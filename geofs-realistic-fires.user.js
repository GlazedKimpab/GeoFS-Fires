// ==UserScript==
// @name         GeoFS Realistic Fires
// @namespace    GeoFS-Realistic-Fires
// @version      1.1
// @description  Spawn animated fires anywhere in GeoFS
// @match        https://www.geo-fs.com/*
// @match        https://geo-fs.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    "use strict";

    let viewer = null;
    let placing = false;
    let fires = [];
    let intensity = 3;
    let fireFrame = 0;
    let smokeFrame = 0;

    // --------------------------------------------------
    // WAIT FOR GEOFS
    // --------------------------------------------------

    const wait = setInterval(() => {
        try {
            if (
                window.geofs &&
                window.geofs.api &&
                window.geofs.api.viewer &&
                window.Cesium
            ) {
                viewer = window.geofs.api.viewer;
                clearInterval(wait);
                initialize();
            }
        } catch (e) {
            console.log("Waiting for GeoFS...");
        }
    }, 500);

    // --------------------------------------------------
    // CREATE FIRE TEXTURES
    // --------------------------------------------------

    const fireImages = [];
    const smokeImages = [];

    function createTextures() {
        for (let i = 0; i < 12; i++) {
            fireImages.push(createFire(i));
            smokeImages.push(createSmoke(i));
        }
    }

    function createFire(frame) {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;

        const ctx = canvas.getContext("2d");

        const wobble = Math.sin(frame * 0.8) * 15;

        // Glow
        const glow = ctx.createRadialGradient(
            128, 170, 5,
            128, 170, 115
        );

        glow.addColorStop(0, "rgba(255,255,220,1)");
        glow.addColorStop(0.2, "rgba(255,180,30,.9)");
        glow.addColorStop(0.55, "rgba(255,50,0,.35)");
        glow.addColorStop(1, "rgba(255,0,0,0)");

        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 256, 256);

        // Flame
        ctx.beginPath();

        ctx.moveTo(128, 235);

        ctx.bezierCurveTo(
            60,
            210,
            75 + wobble,
            150,
            105,
            120
        );

        ctx.bezierCurveTo(
            90,
            85,
            125,
            60,
            135,
            20
        );

        ctx.bezierCurveTo(
            165,
            75,
            185,
            105,
            160,
            140
        );

        ctx.bezierCurveTo(
            205,
            180,
            175,
            220,
            128,
            235
        );

        ctx.closePath();

        const flame = ctx.createLinearGradient(
            0, 20, 0, 235
        );

        flame.addColorStop(0, "#fffbd0");
        flame.addColorStop(.25, "#ffd000");
        flame.addColorStop(.65, "#ff5a00");
        flame.addColorStop(1, "#d50000");

        ctx.fillStyle = flame;
        ctx.fill();

        // Inner flame
        ctx.beginPath();

        ctx.moveTo(128, 220);

        ctx.bezierCurveTo(
            95,
            205,
            105,
            170,
            120,
            145
        );

        ctx.bezierCurveTo(
            110,
            120,
            130,
            100,
            135,
            75
        );

        ctx.bezierCurveTo(
            155,
            120,
            160,
            145,
            148,
            165
        );

        ctx.bezierCurveTo(
            170,
            190,
            150,
            210,
            128,
            220
        );

        ctx.closePath();

        ctx.fillStyle = "#fff176";
        ctx.fill();

        return canvas.toDataURL("image/png");
    }

    function createSmoke(frame) {
        const canvas = document.createElement("canvas");

        canvas.width = 256;
        canvas.height = 256;

        const ctx = canvas.getContext("2d");

        const drift = Math.sin(frame * .5) * 25;

        const clouds = [
            [128, 210, 40],
            [110 + drift * .3, 165, 38],
            [145 + drift * .6, 120, 35],
            [115 + drift, 75, 30]
        ];

        clouds.forEach(([x, y, r]) => {
            const gradient = ctx.createRadialGradient(
                x, y, 2,
                x, y, r
            );

            gradient.addColorStop(
                0,
                "rgba(35,35,35,.65)"
            );

            gradient.addColorStop(
                .6,
                "rgba(60,60,60,.3)"
            );

            gradient.addColorStop(
                1,
                "rgba(0,0,0,0)"
            );

            ctx.fillStyle = gradient;

            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        });

        return canvas.toDataURL("image/png");
    }

    // --------------------------------------------------
    // UI
    // --------------------------------------------------

    function createUI() {
        const panel = document.createElement("div");

        panel.id = "geofs-fire-panel";

        panel.innerHTML = `
            <div style="
                font-size:18px;
                font-weight:bold;
                margin-bottom:10px;
            ">
                🔥 Realistic Fires
            </div>

            <button id="fire-place">
                🔥 Place Fire
            </button>

            <div style="margin-top:10px;">
                Intensity:
                <b id="fire-value">3</b>
            </div>

            <input
                id="fire-slider"
                type="range"
                min="1"
                max="5"
                value="3"
            >

            <button id="fire-remove">
                Remove Last
            </button>

            <button id="fire-clear">
                Clear All
            </button>

            <div id="fire-status">
                Ready
            </div>
        `;

        panel.style.cssText = `
            position:fixed;
            right:15px;
            top:100px;
            width:220px;
            padding:14px;
            z-index:999999;
            background:rgba(15,15,15,.95);
            color:white;
            border:1px solid #ff6a00;
            border-radius:10px;
            font-family:Arial,sans-serif;
            box-shadow:0 5px 30px rgba(0,0,0,.6);
        `;

        const style = document.createElement("style");

        style.textContent = `
            #geofs-fire-panel button {
                width:100%;
                margin-top:7px;
                padding:8px;
                border:0;
                border-radius:6px;
                background:#333;
                color:white;
                cursor:pointer;
            }

            #geofs-fire-panel button:hover {
                background:#ff5a00;
            }

            #fire-slider {
                width:100%;
            }

            #fire-status {
                margin-top:10px;
                color:#ffb060;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(panel);

        document.getElementById("fire-place").onclick = () => {
            placing = !placing;

            document.getElementById("fire-place").textContent =
                placing
                    ? "❌ Click map to cancel"
                    : "🔥 Place Fire";

            document.getElementById("fire-status").textContent =
                placing
                    ? "Click somewhere on the globe..."
                    : "Ready";
        };

        document.getElementById("fire-slider").oninput = e => {
            intensity = Number(e.target.value);

            document.getElementById("fire-value")
                .textContent = intensity;
        };

        document.getElementById("fire-remove").onclick =
            removeLast;

        document.getElementById("fire-clear").onclick =
            clearAll;
    }

    // --------------------------------------------------
    // GET WORLD POSITION
    // --------------------------------------------------

    function getWorldPosition(screenPosition) {
        const scene = viewer.scene;

        // First try depth picking
        if (scene.pickPositionSupported) {
            const picked = scene.pickPosition(screenPosition);

            if (picked) {
                return picked;
            }
        }

        // Reliable globe ray intersection
        const ray =
            viewer.camera.getPickRay(screenPosition);

        if (!ray) return null;

        return scene.globe.pick(
            ray,
            scene
        );
    }

    // --------------------------------------------------
    // MOUSE CLICK
    // --------------------------------------------------

    function setupMouse() {
        const handler =
            new Cesium.ScreenSpaceEventHandler(
                viewer.scene.canvas
            );

        handler.setInputAction(function (click) {

            if (!placing) return;

            const position =
                getWorldPosition(click.position);

            if (!position) {
                document.getElementById(
                    "fire-status"
                ).textContent =
                    "Couldn't find terrain.";
                return;
            }

            spawnFire(position);

            placing = false;

            document.getElementById(
                "fire-place"
            ).textContent =
                "🔥 Place Fire";

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    // --------------------------------------------------
    // SPAWN FIRE
    // --------------------------------------------------

    function spawnFire(position) {

        const cart =
            Cesium.Cartographic.fromCartesian(
                position
            );

        const fire = {
            entities: [],
            intensity: intensity,
            flameCount: 2 + intensity
        };

        // Flames
        for (
            let i = 0;
            i < fire.flameCount;
            i++
        ) {

            const offsetLon =
                (Math.random() - .5) *
                0.00015;

            const offsetLat =
                (Math.random() - .5) *
                0.00015;

            const height =
                (cart.height || 0) +
                Math.random() * intensity * 2;

            const firePosition =
                Cesium.Cartesian3.fromRadians(
                    cart.longitude + offsetLon,
                    cart.latitude + offsetLat,
                    height
                );

            const entity =
                viewer.entities.add({

                    position: firePosition,

                    billboard: {

                        image:
                            fireImages[i %
                                fireImages.length],

                        width:
                            55 + intensity * 12,

                        height:
                            70 + intensity * 14,

                        verticalOrigin:
                            Cesium.VerticalOrigin.BOTTOM,

                        disableDepthTestDistance:
                            Number.POSITIVE_INFINITY,

                        show: true
                    }
                });

            fire.entities.push(entity);
        }

        // Smoke
        for (
            let i = 0;
            i < 3;
            i++
        ) {

            const smokePosition =
                Cesium.Cartesian3.fromRadians(
                    cart.longitude,
                    cart.latitude,
                    (cart.height || 0) +
                    8 +
                    i * 10
                );

            const entity =
                viewer.entities.add({

                    position: smokePosition,

                    billboard: {

                        image:
                            smokeImages[i %
                                smokeImages.length],

                        width: 65 + i * 15,
                        height: 65 + i * 15,

                        verticalOrigin:
                            Cesium.VerticalOrigin.CENTER,

                        disableDepthTestDistance:
                            Number.POSITIVE_INFINITY,

                        show: true,

                        color:
                            Cesium.Color.WHITE
                                .withAlpha(.7)
                    }
                });

            fire.entities.push(entity);
        }

        // Ground glow
        const glow =
            viewer.entities.add({

                position:
                    Cesium.Cartesian3.fromRadians(
                        cart.longitude,
                        cart.latitude,
                        (cart.height || 0) + .2
                    ),

                ellipse: {

                    semiMajorAxis:
                        5 + intensity * 2,

                    semiMinorAxis:
                        5 + intensity * 2,

                    material:
                        Cesium.Color.ORANGE
                            .withAlpha(.25),

                    height:
                        (cart.height || 0) + .2
                }
            });

        fire.entities.push(glow);

        fires.push(fire);

        document.getElementById(
            "fire-status"
        ).textContent =
            `🔥 ${fires.length} fire(s) active`;
    }

    // --------------------------------------------------
    // REMOVE
    // --------------------------------------------------

    function removeLast() {

        if (!fires.length) return;

        const fire = fires.pop();

        fire.entities.forEach(entity => {
            viewer.entities.remove(entity);
        });

        updateStatus();
    }

    function clearAll() {

        fires.forEach(fire => {
            fire.entities.forEach(entity => {
                viewer.entities.remove(entity);
            });
        });

        fires = [];

        updateStatus();
    }

    function updateStatus() {
        document.getElementById(
            "fire-status"
        ).textContent =
            `🔥 ${fires.length} fire(s) active`;
    }

    // --------------------------------------------------
    // ANIMATION
    // --------------------------------------------------

    function animate() {

        setInterval(() => {

            fireFrame =
                (fireFrame + 1) %
                fireImages.length;

            smokeFrame =
                (smokeFrame + 1) %
                smokeImages.length;

            fires.forEach(fire => {

                let flameIndex = 0;
                let smokeIndex = 0;

                fire.entities.forEach(entity => {

                    if (!entity.billboard)
                        return;

                    if (
                        flameIndex <
                        fire.flameCount
                    ) {

                        entity.billboard.image =
                            fireImages[
                                (fireFrame +
                                flameIndex) %
                                fireImages.length
                            ];

                        flameIndex++;

                    } else {

                        entity.billboard.image =
                            smokeImages[
                                (smokeFrame +
                                smokeIndex) %
                                smokeImages.length
                            ];

                        smokeIndex++;
                    }
                });
            });

        }, 100);
    }

    // --------------------------------------------------
    // START
    // --------------------------------------------------

    function initialize() {

        console.log(
            "🔥 GeoFS Realistic Fires starting..."
        );

        createTextures();
        createUI();
        setupMouse();
        animate();

        console.log(
            "🔥 GeoFS Realistic Fires ready!"
        );
    }

})();
