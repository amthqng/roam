(() => {
  "use strict";

  const START = Object.freeze({ longitude: 12.3383, latitude: 45.43418, altitude: 110.0 });
  const RADIUS_METERS = 240;
  const EYE_HEIGHT_METERS = 1.8;
  let streetHeight = null;
  const WALK_METERS_PER_SECOND = 1.45;
  const FAST_METERS_PER_SECOND = 3.0;
  const EYE_LIMIT = Math.PI * 0.46;
  const KEY_STORAGE = "roam.googleMapTilesApiKey";
  const QUALITY = Object.freeze({standard:{sse:12,scale:.8,cache:256},high:{sse:4,scale:1,cache:512},ultra:{sse:1,scale:1,cache:1024}});
  let quality = "ultra";

  const $ = (id) => document.getElementById(id);
  const setup = $("setup");
  const input = $("apiKey");
  const button = $("startButton");
  const setupMessage = $("setupMessage");
  const loading = $("loading");
  const hud = $("hud");
  const fatalError = $("fatalError");
  const movementState = $("movementState");

  let viewer = null;
  let tileset = null;
  let activeKey = null;
  let loadingSession = false;
  let running = false;
  let frame = 0;
  let lastFrame = 0;
  let heading = 85 * Math.PI / 180;
  let pitch = -5 * Math.PI / 180;
  let current = { ...START };
  const pressed = new Set();

  try { input.value = sessionStorage.getItem(KEY_STORAGE) || ""; } catch (_) {}

  try { const saved = localStorage.getItem("roam.graphicsQuality"); if (Object.hasOwn(QUALITY,saved)) quality = saved; } catch (_) {}
  function applyQuality() {
    const q = QUALITY[quality];
    if (viewer) {
      viewer.useBrowserRecommendedResolution = quality === "standard";
      viewer.resolutionScale = q.scale;
    }
    if (tileset) {
      tileset.maximumScreenSpaceError = q.sse;
      tileset.cacheBytes = q.cache * 1024 * 1024;
      tileset.maximumCacheOverflowBytes = q.cache * 1024 * 1024;
      tileset.dynamicScreenSpaceError = quality === "standard";
      tileset.foveatedScreenSpaceError = quality !== "ultra";
    }
    const picker = $("graphicsQuality");
    if (picker) picker.value = quality;
  }
  const showError = (message) => {
    fatalError.textContent = message;
    fatalError.classList.remove("hidden");
  };
  const clearError = () => {
    fatalError.textContent = "";
    fatalError.classList.add("hidden");
  };

  function installViewer() {
    if (viewer) return;
    viewer = new Cesium.Viewer("cesiumContainer", {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      selectionIndicator: false,
      infoBox: false,
      baseLayer: false,
      skyBox: false,
      scene3DOnly: true,
      useDefaultRenderLoop: true
    });
    viewer.scene.globe.show = false;
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString("#a6bac2");
    viewer.scene.screenSpaceCameraController.enableInputs = false;
    viewer.scene.fog.enabled = false;
    viewer.scene.postProcessStages.fxaa.enabled = true;
    applyQuality();
    viewer.camera.frustum.fov = Cesium.Math.toRadians(75);
    updateCamera();
    viewer.scene.canvas.addEventListener("click", () => {
      if (running && document.pointerLockElement !== viewer.scene.canvas) {
        viewer.scene.canvas.requestPointerLock?.();
      }
    });
  }

  function updateCamera() {
    if (!viewer) return;
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(current.longitude, current.latitude, current.altitude),
      orientation: { heading, pitch, roll: 0 }
    });
  }

  async function reset() {
    current = { ...START };
    heading = Cesium.Math.toRadians(85);
    pitch = Cesium.Math.toRadians(-5);
    pressed.clear();
    updateCamera();
    await placeAtStreetHeight();
    movementState.textContent = streetHeight === null ? "Street surface not detected. Camera stays above the city." : "Returned to Piazza San Marco";
  }

  async function placeAtStreetHeight() {
    // Start above the 3D mesh, then query the actual photo-mesh height.
    // Geographic coordinates alone do not tell us the rendered street altitude.
    if (!viewer?.scene?.sampleHeightSupported) {
      movementState.textContent = "Your browser cannot detect 3D street elevation.";
      return false;
    }
    try {
      const point = Cesium.Cartographic.fromDegrees(current.longitude, current.latitude);
      const result = await viewer.scene.sampleHeightMostDetailed([point]);
      const ground = result?.[0]?.height;
      if (!Number.isFinite(ground)) {
        streetHeight = null;
        return false;
      }
      streetHeight = ground;
      current.altitude = ground + EYE_HEIGHT_METERS;
      updateCamera();
      return true;
    } catch (error) {
      console.warn("Could not sample 3D street surface", error?.message);
      streetHeight = null;
      return false;
    }
  }

  function distanceFromStart() {
    const north = (current.latitude - START.latitude) * 111320;
    const east = (current.longitude - START.longitude) * 111320 * Math.cos(Cesium.Math.toRadians(START.latitude));
    return Math.hypot(north, east);
  }

  function loop(timestamp) {
    if (!running) return;
    const delta = Math.min((timestamp - (lastFrame || timestamp)) / 1000, 0.07);
    lastFrame = timestamp;

    let forward = Number(pressed.has("KeyW") || pressed.has("ArrowUp")) - Number(pressed.has("KeyS") || pressed.has("ArrowDown"));
    let sideways = Number(pressed.has("KeyD") || pressed.has("ArrowRight")) - Number(pressed.has("KeyA") || pressed.has("ArrowLeft"));
    const length = Math.hypot(forward, sideways);
    if (length > 0) {
      forward /= length;
      sideways /= length;
      const speed = pressed.has("ShiftLeft") || pressed.has("ShiftRight") ? FAST_METERS_PER_SECOND : WALK_METERS_PER_SECOND;
      const north = (Math.cos(heading) * forward - Math.sin(heading) * sideways) * speed * delta;
      const east = (Math.sin(heading) * forward + Math.cos(heading) * sideways) * speed * delta;
      const old = { ...current };
      current.latitude += north / 111320;
      current.longitude += east / (111320 * Math.cos(Cesium.Math.toRadians(current.latitude)));
      if (distanceFromStart() > RADIUS_METERS) {
        current = old;
        movementState.textContent = "Prototype boundary reached. Turn around or reset.";
      } else {
        movementState.textContent = "Walking near Piazza San Marco";
      }
      if (streetHeight !== null && viewer.scene.sampleHeightSupported) {
        const point = Cesium.Cartographic.fromDegrees(current.longitude, current.latitude);
        const measured = viewer.scene.sampleHeight(point);
        if (Number.isFinite(measured)) {
          // Follow a detected surface, but avoid sudden jumps onto rooftops
          // or dives below the city if the photographic mesh has gaps.
          if (Math.abs(measured - streetHeight) < 2.5) {
            streetHeight = measured;
          }
          current.altitude = streetHeight + EYE_HEIGHT_METERS;
        }
      }
      updateCamera();
    }
    frame = requestAnimationFrame(loop);
  }

  function startWalking() {
    if (running) return;
    running = true;
    lastFrame = 0;
    setup.classList.add("hidden");
    hud.classList.remove("hidden");
    loading.classList.add("hidden");
    frame = requestAnimationFrame(loop);
    movementState.textContent = "Click the scene to capture your mouse";
  }

  function friendlyStatus(status, details) {
    const msg = String(details || "").slice(0, 350);
    if (status === 400) return "Google rejected this Map Tiles request (400). " + msg;
    if (status === 401) return "Google did not accept the API key (401). Check that it was copied correctly.";
    if (status === 403) return "Google denied access (403). Check Map Tiles API is enabled, billing is active, and the key's website/API restrictions allow this site. " + msg;
    if (status === 404) return "Google could not find the 3D tiles resource (404). Check that Photorealistic 3D Tiles are available for this project.";
    if (status === 429) return "Google's Map Tiles API quota was exceeded (429). Review your quota and billing.";
    return "Map Tiles API returned HTTP " + status + ". " + msg;
  }

  function safeError(error, key) {
    // Never show or log an API key embedded in a failed network request URL.
    const status = Number(error?.statusCode || error?.status);
    const value = Number.isFinite(status) && status > 0 ? friendlyStatus(status, "") : (error?.message || String(error));
    return value.replaceAll(key, "[redacted]").replace(/key=([^&\\s]+)/gi, "key=[redacted]");
  }

  async function start() {
    if (loadingSession || running) return;
    const key = input.value.trim();
    if (!key) {
      setupMessage.textContent = "Enter a Google Map Tiles API key to load Venice.";
      input.focus();
      return;
    }
    if (!window.Cesium) {
      setupMessage.textContent = "CesiumJS did not load. Check your connection and reload.";
      return;
    }
    clearError();
    setupMessage.textContent = "";
    loadingSession = true;
    button.disabled = true;
    loading.classList.remove("hidden");
    try {
      try { sessionStorage.setItem(KEY_STORAGE, key); } catch (_) {}
      setupMessage.textContent = "Connecting the 3D viewer…";
      installViewer();
      // One root request per new tileset. Reuse the loaded tileset for the
      // same API key, including after opening settings or retrying elevation.
      if (tileset && activeKey !== key) {
        viewer.scene.primitives.remove(tileset);
        tileset = null;
        activeKey = null;
      }
      if (!tileset) {
        const resource = new Cesium.Resource({
          url: "https://tile.googleapis.com/v1/3dtiles/root.json",
          queryParameters: { key }
        });
        const next = await Cesium.Cesium3DTileset.fromUrl(resource, {
          maximumScreenSpaceError: QUALITY[quality].sse,
          showCreditsOnScreen: true
        });
        viewer.scene.primitives.add(next);
        tileset = next;
        activeKey = key;
      }
      applyQuality();
      // A temporary elevated camera lets Cesium request the destination tiles.
      // Do not enter first-person mode until the scene surface is resolved.
      current = { ...START };
      streetHeight = null;
      updateCamera();
      setupMessage.textContent = "Finding a safe street-level starting height…";
      const placed = await placeAtStreetHeight();
      if (!placed) {
        throw new Error("Could not detect the street surface in Venice. Try again after tiles load, or use a browser with WebGL depth textures.");
      }
      setupMessage.textContent = "";
      startWalking();
    } catch (error) {
      const message = safeError(error, key);
      console.error("Roam map loading failed:", message);
      setupMessage.textContent = message;
      showError("Venice could not load: " + message);
    } finally {
      loading.classList.add("hidden");
      button.disabled = false;
      loadingSession = false;
    }
  }

  const qualityPicker = $("graphicsQuality");
  if (qualityPicker) {
    qualityPicker.value = quality;
    qualityPicker.addEventListener("change", () => {
      if (!Object.hasOwn(QUALITY,qualityPicker.value)) return;
      quality = qualityPicker.value;
      try { localStorage.setItem("roam.graphicsQuality",quality); } catch (_) {}
      applyQuality();
      pressed.clear();
    });
  }
  button.addEventListener("click", start);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") start();
  });
  $("resetButton").addEventListener("click", reset);
  $("changeKey").addEventListener("click", () => {
    if (loadingSession) return;
    if (document.pointerLockElement) document.exitPointerLock?.();
    cancelAnimationFrame(frame);
    running = false;
    pressed.clear();
    hud.classList.add("hidden");
    setup.classList.remove("hidden");
    input.focus();
  });

  document.addEventListener("keydown", (event) => {
    if (!running || event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
    if (["KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.code)) {
      pressed.add(event.code);
      event.preventDefault();
    }
  });
  document.addEventListener("keyup", (event) => pressed.delete(event.code));
  window.addEventListener("blur", () => pressed.clear());
  document.addEventListener("pointerlockchange", () => {
    if (!running) return;
    movementState.textContent = document.pointerLockElement ? "Use WASD to walk · Esc to release mouse" : "Click the scene to look around";
  });
  document.addEventListener("mousemove", (event) => {
    if (!running || !viewer || document.pointerLockElement !== viewer.scene.canvas) return;
    heading = Cesium.Math.zeroToTwoPi(heading + event.movementX * 0.0022);
    pitch = Cesium.Math.clamp(pitch - event.movementY * 0.0022, -EYE_LIMIT, EYE_LIMIT);
    updateCamera();
  });
})();
