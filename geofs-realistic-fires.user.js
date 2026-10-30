// ==UserScript==
// @name         GeoFS Realistic Multi Fire
// @namespace    geofs-fire
// @version      1.0
// @description  Realistic ground fires and smaller aircraft-attached fires
// @match        *://www.geo-fs.com/*
// @match        *://geo-fs.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    "use strict";

    if (window.__geoFireAddon) {
        try { window.__geoFireAddon.destroy(); } catch (e) {}
    }

    const MAX_FIRES = 20;
    const MAX_FLAMES = 7;
    const MAX_SMOKE = 3;
    const MAX_EMBERS = 5;

    let fires = [];
    let nextId = 1;
    let selectedId = null;
    let disposed = false;
    let ready = false;
    let hidden = false;
    let raf = null;
    let loader = null;
    let ui = null;
    let css = null;

    const textures = { flames: [], smoke: [], ember: null };

    const PRESETS = {
        custom:     { x: 0,    y: 0,   z: 0 },
        leftEngine: { x: -6,   y: 0,   z: -2 },
        rightEngine:{ x: 6,    y: 0,   z: -2 },
        leftWing:   { x: -14,  y: -1,  z: 0 },
        rightWing:  { x: 14,   y: -1,  z: 0 },
        tail:       { x: 0,    y: -22, z: 3 },
        fuselage:   { x: 0,    y: 0,   z: 2 }
    };

    // -----------------------------------------------------
    // PROCEDURAL TEXTURES
    // -----------------------------------------------------

    function rng(seed) {
        return function () {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function createFireTexture(seed) {
        const c = document.createElement("canvas");
        c.width = 512;
        c.height = 768;
        const ctx = c.getContext("2d");
        const random = rng(seed);

        const glow = ctx.createRadialGradient(256, 570, 20, 256, 570, 300);
        glow.addColorStop(0, "rgba(255,170,20,.30)");
        glow.addColorStop(.3, "rgba(255,70,0,.18)");
        glow.addColorStop(.7, "rgba(170,20,0,.06)");
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 512, 768);

        // Detailed, irregular flame texture.
        for (let i = 0; i < 1800; i++) {
            const h = Math.pow(random(), 1.65);
            let x = 256 + (random() - .5) * (30 + h * 220);
            const y = 690 - h * 600;

            x += Math.sin(y * .035 + seed) * 35 * h;
            x += Math.sin(y * .071 + seed * 2.3) * 18;

            const radius = 3 + random() * (8 + h * 28);
            const t = random();

            let color;
            if (t < .13) color = [255, 255, 220];
            else if (t < .42) color = [255, 215, 45];
            else if (t < .78) color = [255, 75, 5];
            else color = [190, 20, 0];

            const alpha = .01 + random() * .065;
            const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
            g.addColorStop(0, `rgba(${color.join(",")},${alpha})`);
            g.addColorStop(.4, `rgba(${color.join(",")},${alpha * .6})`);
            g.addColorStop(1, "rgba(0,0,0,0)");

            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Hot central areas.
        for (let i = 0; i < 500; i++) {
            const x = 256 + (random() - .5) * 150;
            const y = 620 - random() * 250;
            const r = 4 + random() * 25;
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);

            g.addColorStop(0, "rgba(255,255,235,.16)");
            g.addColorStop(.3, "rgba(255,240,120,.10)");
            g.addColorStop(.7, "rgba(255,130,10,.04)");
            g.addColorStop(1, "rgba(255,50,0,0)");

            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Soft, tapered tongues.
        ctx.filter = "blur(5px)";
        for (let i = 0; i < 45; i++) {
            const x = 256 + (random() - .5) * 170;
            const y = 610 - random() * 160;
            const length = 50 + random() * 230;
            const width = 8 + random() * 20;

            const g = ctx.createLinearGradient(x, y, x, y - length);
            g.addColorStop(0, "rgba(255,220,70,.09)");
            g.addColorStop(.4, "rgba(255,90,0,.06)");
            g.addColorStop(1, "rgba(255,20,0,0)");

            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(x, y - length / 2, width, length / 2,
                (random() - .5) * .4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.filter = "none";

        return c.toDataURL("image/png");
    }

    function createSmokeTexture(seed) {
        const c = document.createElement("canvas");
        c.width = 384;
        c.height = 384;
        const ctx = c.getContext("2d");
        const random = rng(seed);

        for (let i = 0; i < 350; i++) {
            const x = 192 + (random() - .5) * 300;
            const y = 192 + (random() - .5) * 300;
            const r = 12 + random() * 55;
            const gray = Math.floor(30 + random() * 40);
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);

            g.addColorStop(0, `rgba(${gray},${gray},${gray},.06)`);
            g.addColorStop(.5, `rgba(${gray},${gray},${gray},.025)`);
            g.addColorStop(1, "rgba(0,0,0,0)");

            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        return c.toDataURL("image/png");
    }

    function createEmberTexture() {
        const c = document.createElement("canvas");
        c.width = 64;
        c.height = 64;
        const ctx = c.getContext("2d");
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);

        g.addColorStop(0, "rgba(255,255,230,1)");
        g.addColorStop(.15, "rgba(255,210,50,1)");
        g.addColorStop(.45, "rgba(255,70,0,.7)");
        g.addColorStop(1, "rgba(255,0,0,0)");

        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
        return c.toDataURL("image/png");
    }

    // -----------------------------------------------------
    // GEOFS POSITION AND BILLBOARD HELPERS
    // -----------------------------------------------------

    function validLla(p) {
        return Array.isArray(p) &&
            p.length >= 3 &&
            p.slice(0, 3).every(Number.isFinite);
    }

    function cameraLla() {
        try {
            return geofs.api.getCameraLla(geofs.camera.cam);
        } catch (e) {
            return null;
        }
    }

    function getAircraft() {
        try {
            return geofs.aircraft && geofs.aircraft.instance;
        } catch (e) {
            return null;
        }
    }

    function aircraftLla() {
        const a = getAircraft();
        if (!a) return null;

        const candidates = [
            a.llaLocation,
            a.lla,
            a.location,
            a.object3d && a.object3d.lla
        ];

        for (const p of candidates) {
            if (validLla(p)) return p;
        }

        return null;
    }

    // HTR is treated as degrees here.
    // If your GeoFS aircraft exposes HTR in radians,
    // the conversion should be changed accordingly.
    function aircraftOrientation() {
        const a = getAircraft();
        if (!a) return { heading: 0, pitch: 0, roll: 0 };

        const htr = a.htr;
        if (Array.isArray(htr) && htr.length >= 3) {
            return {
                heading: htr[0] * Math.PI / 180,
                pitch: htr[1] * Math.PI / 180,
                roll: htr[2] * Math.PI / 180
            };
        }

        return {
            heading: 0,
            pitch: 0,
            roll: 0
        };
    }

    function offsetLla(base, east, north, up) {
        const lat = base[0] + north / 111320;
        const cosLat = Math.cos(base[0] * Math.PI / 180);
        const lon = base[1] + east / (111320 * Math.max(.01, Math.abs(cosLat)));
        return [lat, lon, base[2] + up];
    }

    // Local axes: X right, Y forward, Z up.
    function rotateOffset(x, y, z, o) {
        const xr = x * Math.cos(o.roll) + z * Math.sin(o.roll);
        const zr = -x * Math.sin(o.roll) + z * Math.cos(o.roll);

        const yp = y * Math.cos(o.pitch) - zr * Math.sin(o.pitch);
        const zp = y * Math.sin(o.pitch) + zr * Math.cos(o.pitch);

        return {
            east: xr * Math.cos(o.heading) + yp * Math.sin(o.heading),
            north: -xr * Math.sin(o.heading) + yp * Math.cos(o.heading),
            up: zp
        };
    }

    function position(fire, x, y, z) {
        if (fire.mode === "aircraft") {
            const base = aircraftLla();
            if (!validLla(base)) return null;

            const rotated = rotateOffset(
                fire.x + x, fire.y + y, fire.z + z,
                aircraftOrientation()
            );

            return offsetLla(base, rotated.east, rotated.north, rotated.up);
        }

        return offsetLla(fire.base, fire.x + x, fire.y + y, fire.z + z);
    }

    function makeBillboard(lla, image, scale, opacity) {
        try {
            return new geofs.api.billboard(lla, image, {
                collection: "translucent",
                scale,
                opacity,
                geofsFixCameraRotation: true
            });
        } catch (e) {
            console.warn("[GeoFS Fire] Billboard creation failed", e);
            return null;
        }
    }

    // -----------------------------------------------------
    // FIRE MANAGEMENT
    // -----------------------------------------------------

    function selectedFire() {
        return fires.find(f => f.id === selectedId) || null;
    }

    function destroyObjects(fire) {
        for (const p of fire.objects) {
            try {
                if (p.object && p.object.destroy) p.object.destroy();
            } catch (e) {}
        }
        fire.objects = [];
    }

    function addFire(mode) {
        if (!ready) {
            status("Fire textures are still loading...");
            return;
        }

        if (fires.length >= MAX_FIRES) {
            status("Maximum of 20 fires reached");
            return;
        }

        const base = mode === "aircraft" ? aircraftLla() : cameraLla();

        if (!validLla(base)) {
            status(mode === "aircraft"
                ? "Could not read aircraft position"
                : "Could not read camera position");
            return;
        }

        const fire = {
            id: nextId++,
            mode,
            base: [...base],
            preset: "custom",
            x: 0,
            y: 0,
            z: mode === "aircraft" ? 0 : -20,
            // Smaller default aircraft fire.
            size: mode === "aircraft" ? 0.15 : 0.5,
            intensity: 6,
            objects: []
        };

        fires.push(fire);
        selectedId = fire.id;
        buildFire(fire);
        updateSelector();
        syncControls();
        status("Added " + mode + " fire #" + fire.id);
    }

    function buildFire(fire) {
        destroyObjects(fire);

        const flameCount = Math.min(
            MAX_FLAMES, 4 + Math.floor(fire.intensity / 3)
        );

        for (let i = 0; i < flameCount; i++) {
            const angle = i / flameCount * Math.PI * 2;
            const radius = (i % 3) * .8 * fire.size;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const z = (i % 3) * fire.size * 1.5;

            // Smaller scale on aircraft to reduce the flat-sheet look.
            const scale = fire.size * (
                (fire.mode === "aircraft" ? 0.9 : 2.2) +
                Math.random() * (fire.mode === "aircraft" ? 0.3 : 0.8)
            );

            const lla = position(fire, x, y, z);
            if (!lla) continue;

            const object = makeBillboard(
                lla,
                textures.flames[i % textures.flames.length],
                scale,
                .65 + Math.random() * .25
            );

            if (object) {
                fire.objects.push({
                    object, type: "flame", x, y, z, scale,
                    phase: Math.random() * Math.PI * 2,
                    speed: .7 + Math.random() * 1.3
                });
            }
        }

        const smokeCount = Math.min(
            MAX_SMOKE, 1 + Math.floor(fire.intensity / 4)
        );

        for (let i = 0; i < smokeCount; i++) {
            const offset = i * 5 * fire.size;
            const lla = position(fire, 0, 0, (3 + i * 5) * fire.size);
            if (!lla) continue;

            const object = makeBillboard(
                lla, textures.smoke[i % textures.smoke.length],
                fire.size * (fire.mode === "aircraft" ? 1.1 + i * .2 : 2.2 + i * .5),
                .17
            );

            if (object) {
                fire.objects.push({
                    object, type: "smoke", offset,
                    phase: Math.random() * Math.PI * 2,
                    speed: .2 + Math.random() * .4
                });
            }
        }

        const emberCount = Math.min(
            MAX_EMBERS, 2 + Math.floor(fire.intensity / 3)
        );

        for (let i = 0; i < emberCount; i++) {
            const lla = position(fire, 0, 0, 0);
            if (!lla) continue;

            const object = makeBillboard(
                lla, textures.ember,
                fire.size * (fire.mode === "aircraft" ? .045 : .08) +
                    Math.random() * fire.size * .05,
                .8
            );

            if (object) {
                fire.objects.push({
                    object, type: "ember",
                    phase: Math.random() * 10,
                    angle: Math.random() * Math.PI * 2,
                    distance: Math.random() * 4 * fire.size,
                    rise: (3 + Math.random() * 8) * fire.size
                });
            }
        }
    }

    function deleteSelected() {
        const fire = selectedFire();
        if (!fire) return;

        destroyObjects(fire);
        fires = fires.filter(f => f.id !== fire.id);
        selectedId = fires.length ? fires[fires.length - 1].id : null;

        updateSelector();
        syncControls();
        status("Selected fire deleted");
    }

    function deleteAll() {
        for (const fire of fires) destroyObjects(fire);
        fires = [];
        selectedId = null;
        updateSelector();
        syncControls();
        status("All fires deleted");
    }

    // -----------------------------------------------------
    // SMOOTH ANIMATION
    // -----------------------------------------------------

    function animate(timestamp) {
        if (disposed) return;
        raf = requestAnimationFrame(animate);

        const t = timestamp / 1000;

        for (const fire of fires) {
            for (const p of fire.objects) {
                try {
                    let x = 0, y = 0, z = 0;

                    if (p.type === "flame") {
                        x = p.x + Math.sin(t * p.speed * 3 + p.phase) *
                            fire.size * .45;
                        y = p.y + Math.cos(t * p.speed * 2.7 + p.phase) *
                            fire.size * .35;
                        z = p.z + Math.sin(t * p.speed * 2 + p.phase) *
                            fire.size * .45;

                        if (p.object.setScale) {
                            p.object.setScale(
                                p.scale * (
                                    1 + Math.sin(t * p.speed * 5 + p.phase) * .08
                                )
                            );
                        }
                    } else if (p.type === "smoke") {
                        x = Math.sin(t * p.speed + p.phase) * fire.size * 1.2;
                        y = Math.cos(t * p.speed * .8 + p.phase) * fire.size * 1.2;
                        z = 3 * fire.size + p.offset +
                            (t * 1.5 % 8) * fire.size;
                    } else if (p.type === "ember") {
                        const rise = (t * 3 * fire.size + p.phase) % p.rise;
                        const distance = p.distance + rise * .3;
                        x = Math.cos(p.angle) * distance;
                        y = Math.sin(p.angle) * distance;
                        z = rise;
                    }

                    const lla = position(fire, x, y, z);
                    if (lla && p.object.setLocation) {
                        p.object.setLocation(lla);
                    }
                } catch (e) {}
            }
        }
    }

    // -----------------------------------------------------
    // UI
    // -----------------------------------------------------

    function createUI() {
        ui = document.createElement("div");
        ui.id = "geofs-fire-ui";

        ui.innerHTML = `
            <div class="fire-title">🔥 GEOFS FIRE</div>
            <button id="add-ground">+ ADD GROUND FIRE</button>
            <button id="add-aircraft">+ ADD AIRCRAFT FIRE</button>

            <label>SELECT FIRE</label>
            <select id="fire-select"></select>

            <div id="aircraft-options">
                <label>AIRCRAFT PART</label>
                <select id="fire-preset">
                    <option value="custom">Custom / Center</option>
                    <option value="leftEngine">Left Engine</option>
                    <option value="rightEngine">Right Engine</option>
                    <option value="leftWing">Left Wing</option>
                    <option value="rightWing">Right Wing</option>
                    <option value="tail">Tail</option>
                    <option value="fuselage">Fuselage</option>
                </select>
                <p class="help">Aircraft offsets: X = left/right, Y = forward/back, Z = up/down.</p>
            </div>

            <label>X <span id="vx">0</span></label>
            <input id="sx" type="range" min="-100" max="100" step=".1" value="0">

            <label>Y <span id="vy">0</span></label>
            <input id="sy" type="range" min="-100" max="100" step=".1" value="0">

            <label>Z <span id="vz">-20</span></label>
            <input id="sz" type="range" min="-500" max="500" step=".1" value="-20">

            <label>SIZE <span id="vsize">0.5</span></label>
            <input id="ssize" type="range" min=".05" max="1.5" step=".05" value=".5">

            <label>INTENSITY <span id="vintensity">6</span></label>
            <input id="sintensity" type="range" min="1" max="10" step="1" value="6">

            <button id="delete-fire">DELETE SELECTED</button>
            <button id="delete-all">DELETE ALL FIRES</button>
            <p class="help">Press H to hide/show this panel.</p>
            <div id="fire-status">Preparing textures...</div>
        `;

        css = document.createElement("style");
        css.textContent = `
            #geofs-fire-ui {
                position:fixed; right:20px; top:90px; width:250px;
                padding:14px; box-sizing:border-box;
                background:rgba(8,8,8,.94); color:white;
                z-index:999999; border:2px solid #ff641c;
                border-radius:12px; font:13px Arial,sans-serif;
                box-shadow:0 8px 30px #000b;
                max-height:82vh; overflow-y:auto;
            }
            #geofs-fire-ui .fire-title {
                color:#ff8438; font-size:18px; font-weight:bold;
                margin-bottom:12px;
            }
            #geofs-fire-ui button, #geofs-fire-ui select {
                box-sizing:border-box; width:100%; margin-top:7px;
                padding:9px; border:0; border-radius:6px;
                background:#292929; color:white; font-weight:bold;
                cursor:pointer;
            }
            #geofs-fire-ui button:hover { background:#d94d10; }
            #geofs-fire-ui input {
                width:100%; box-sizing:border-box;
                accent-color:#ff641c; margin-bottom:5px;
            }
            #geofs-fire-ui label { display:block; margin-top:8px; }
            #geofs-fire-ui label span { float:right; color:#ff9a60; }
            #geofs-fire-ui .help {
                font-size:11px; color:#aaa; text-align:center; line-height:1.4;
            }
            #fire-status { margin-top:9px; color:#ff9a60; text-align:center; }
        `;

        document.head.appendChild(css);
        document.body.appendChild(ui);

        document.getElementById("add-ground").onclick = () => addFire("ground");
        document.getElementById("add-aircraft").onclick = () => addFire("aircraft");
        document.getElementById("delete-fire").onclick = deleteSelected;
        document.getElementById("delete-all").onclick = deleteAll;

        document.getElementById("fire-select").onchange = e => {
            selectedId = Number(e.target.value) || null;
            syncControls();
        };

        document.getElementById("fire-preset").onchange = e => {
            const fire = selectedFire();
            const preset = PRESETS[e.target.value];
            if (!fire || fire.mode !== "aircraft" || !preset) return;

            fire.preset = e.target.value;
            fire.x = preset.x;
            fire.y = preset.y;
            fire.z = preset.z;
            syncControls();
        };

        const mapping = {
            sx: "x", sy: "y", sz: "z",
            ssize: "size", sintensity: "intensity"
        };

        for (const [id, key] of Object.entries(mapping)) {
            const slider = document.getElementById(id);

            slider.oninput = () => {
                const fire = selectedFire();
                if (!fire) return;

                fire[key] = Number(slider.value);

                if (fire.mode === "aircraft" &&
                    ["x", "y", "z"].includes(key)) {
                    fire.preset = "custom";
                    document.getElementById("fire-preset").value = "custom";
                }

                updateLabels();
            };

            slider.onchange = () => {
                const fire = selectedFire();
                if (fire && (key === "size" || key === "intensity")) {
                    buildFire(fire);
                }
            };
        }

        document.addEventListener("keydown", onKeyDown);
        updateSelector();
        syncControls();
    }

    function onKeyDown(e) {
        if (e.key.toLowerCase() !== "h" || e.repeat) return;

        const target = e.target;
        if (target && (
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable
        )) return;

        hidden = !hidden;
        if (ui) ui.style.display = hidden ? "none" : "block";
    }

    function updateSelector() {
        const select = document.getElementById("fire-select");
        if (!select) return;

        select.innerHTML = "";

        if (!fires.length) {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "No fires";
            select.appendChild(option);
            return;
        }

        for (const fire of fires) {
            const option = document.createElement("option");
            option.value = fire.id;
            option.textContent = `Fire #${fire.id} (${fire.mode})`;
            select.appendChild(option);
        }

        select.value = String(selectedId);
    }

    function syncControls() {
        const fire = selectedFire();
        const values = fire || {
            x: 0, y: 0, z: -20, size: .5, intensity: 6
        };

        const pairs = [
            ["sx", "vx", "x"], ["sy", "vy", "y"],
            ["sz", "vz", "z"], ["ssize", "vsize", "size"],
            ["sintensity", "vintensity", "intensity"]
        ];

        for (const [sliderId, labelId, key] of pairs) {
            const slider = document.getElementById(sliderId);
            const label = document.getElementById(labelId);
            if (!slider || !label) continue;

            slider.value = values[key];
            label.textContent = values[key];
        }

        const aircraftOptions = document.getElementById("aircraft-options");
        if (aircraftOptions) {
            aircraftOptions.style.display =
                fire && fire.mode === "aircraft" ? "block" : "none";
        }

        const preset = document.getElementById("fire-preset");
        if (preset) preset.value = fire ? fire.preset : "custom";

        for (const id of ["sx", "sy"]) {
            const slider = document.getElementById(id);
            slider.min = fire && fire.mode === "ground" ? -1000 : -100;
            slider.max = fire && fire.mode === "ground" ? 1000 : 100;
        }

        const z = document.getElementById("sz");
        if (z) {
            z.min = fire && fire.mode === "ground" ? -500 : -100;
            z.max = fire && fire.mode === "ground" ? 500 : 100;
        }
    }

    function updateLabels() {
        const fire = selectedFire();
        if (!fire) return;

        for (const key of ["x", "y", "z", "size", "intensity"]) {
            const label = document.getElementById(
                key === "size" ? "vsize" :
                key === "intensity" ? "vintensity" : "v" + key
            );
            if (label) label.textContent = fire[key];
        }
    }

    function status(message) {
        const el = document.getElementById("fire-status");
        if (el) el.textContent = message;
    }

    // -----------------------------------------------------
    // LOAD TEXTURES WITHOUT REGENERATING THEM DURING PLAY
    // -----------------------------------------------------

    function prepareTextures() {
        let i = 0;

        function next() {
            if (disposed) return;

            if (i < 5) {
                textures.flames.push(createFireTexture(1000 + i * 973));
                i++;
                status("Preparing fire textures " + i + "/5...");
                setTimeout(next, 25);
                return;
            }

            textures.smoke.push(createSmokeTexture(9000));
            textures.smoke.push(createSmokeTexture(9333));
            textures.ember = createEmberTexture();

            ready = true;
            status("Ready — add a fire");
        }

        next();
    }

    // -----------------------------------------------------
    // CLEANUP
    // -----------------------------------------------------

    function destroyAddon() {
        disposed = true;
        if (loader) clearInterval(loader);
        if (raf !== null) cancelAnimationFrame(raf);

        for (const fire of fires) destroyObjects(fire);
        fires = [];

        document.removeEventListener("keydown", onKeyDown);
        if (ui) ui.remove();
        if (css) css.remove();

        if (window.__geoFireAddon &&
            window.__geoFireAddon.destroy === destroyAddon) {
            delete window.__geoFireAddon;
        }
    }

    window.__geoFireAddon = { destroy: destroyAddon };

    // -----------------------------------------------------
    // START
    // -----------------------------------------------------

    loader = setInterval(() => {
        if (disposed) return;

        if (window.geofs &&
            geofs.api &&
            geofs.api.billboard &&
            geofs.api.getCameraLla &&
            geofs.camera &&
            geofs.camera.cam) {
            clearInterval(loader);
            createUI();
            prepareTextures();
            raf = requestAnimationFrame(animate);
            console.log("[GeoFS Fire] Multi-fire addon started");
        }
    }, 500);
})();
