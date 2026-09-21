// ==UserScript==
// @name         GeoFS Realistic Fires
// @namespace    GeoFS-Realistic-Fires
// @version      1.0
// @description  Spawn animated fires and smoke anywhere in GeoFS
// @match        https://www.geo-fs.com/*
// @match        https://geo-fs.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
    "use strict";

    let fires = [];
    let placing = false;
    let intensity = 3;
    let fireFrame = 0;
    let smokeFrame = 0;

    // Wait for GeoFS
    const waitForGeoFS = setInterval(() => {
        if (window.geofs?.api?.viewer && window.Cesium) {
            clearInterval(waitForGeoFS);
            start();
        }
    }, 500);

    function start() {
        createUI();
        createFireImages();
        setupMouse();
        animate();

        console.log("🔥 GeoFS Realistic Fires loaded!");
    }

    let fireImages = [];
    let smokeImages = [];

    // Generate fire/smoke textures locally
    function createFireImages() {
        for (let frame = 0; frame < 12; frame++) {
            fireImages.push(makeFire(frame));
            smokeImages.push(makeSmoke(frame));
        }
    }

    function makeFire(frame) {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;

        const ctx = canvas.getContext("2d");

        const wobble = Math.sin(frame * 0.8) * 12;

        // Glow
        const glow = ctx.createRadialGradient(
            128, 165, 5,
            128, 165, 115
        );

        glow.addColorStop(0, "rgba(255,255,180,0.9)");
        glow.addColorStop(0.25, "rgba(255,150,20,0.65)");
        glow.addColorStop(0.6, "rgba(255,50,0,0.25)");
        glow.addColorStop(1, "rgba(255,0,0,0)");

        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 256, 256);

        // Outer flame
        ctx.beginPath();
        ctx.moveTo(128, 235);
        ctx.bezierCurveTo(
            65, 215,
            70, 150,
            105 + wobble, 120
        );

        ctx.bezierCurveTo(
            92, 90,
            125, 65,
            135, 25
        );

        ctx.bezierCurveTo(
            165, 80,
            185, 105,
            160, 140
        );

        ctx.bezierCurveTo(
            205, 180,
            170, 220,
            128, 235
        );

        ctx.closePath();

        const flame = ctx.createLinearGradient(0, 30, 0, 235);
        flame.addColorStop(0, "#fff59d");
        flame.addColorStop(0.3, "#ffb300");
        flame.addColorStop(0.7, "#ff3d00");
        flame.addColorStop(1, "#b71c00");

        ctx.fillStyle = flame;
        ctx.fill();

        // Inner flame
        ctx.beginPath();
        ctx.moveTo(128, 220);

        ctx.bezierCurveTo(
            95, 205,
            105, 165,
            120, 145
        );

        ctx.bezierCurveTo(
            112, 125,
            130, 105,
            135, 82
        );

        ctx.bezierCurveTo(
            155, 125,
            160, 145,
            148, 165
        );

        ctx.bezierCurveTo(
            170, 190,
            150, 210,
            128, 220
        );

        ctx.closePath();

        const inner = ctx.createLinearGradient(0, 80, 0, 220);
        inner.addColorStop(0, "#ffffff");
        inner.addColorStop(0.4, "#fff176");
        inner.addColorStop(1, "#ff9800");

        ctx.fillStyle = inner;
        ctx.fill();

        return canvas.toDataURL();
    }

    function makeSmoke(frame) {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;

        const ctx = canvas.getContext("2d");

        const drift = Math.sin(frame * 0.5) * 25;

        const clouds = [
            [128, 210, 40],
            [110 + drift * 0.3, 165, 38],
            [145 + drift * 0.6, 120, 34],
            [115 + drift, 75, 30]
        ];

        for (const [x, y, r] of clouds) {
            const gradient = ctx.createRadialGradient(
                x, y, 3,
                x, y, r
            );

            gradient.addColorStop(
                0,
                "rgba(40,40,40,0.65)"
            );

            gradient.addColorStop(
                0.6,
                "rgba(60,60,60,0.25)"
            );

            gradient.addColorStop(
                1,
                "rgba(0,0,0,0)"
            );

            ctx.fillStyle = gradient;

            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        return canvas.toDataURL();
    }

    function createUI() {
        const panel = document.createElement("div");

        panel.style.cssText = `
            position:fixed;
            right:15px;
            top:100px;
            width:230px;
            padding:12px;
            background:rgba(15,15,15,.92);
            color:white;
            z-index:999999;
            border-radius:10px;
            font-family:Arial;
            box-shadow:0 5px 25px rgba(0,0,0,.5);
        `;

        panel.innerHTML = `
            <div style="
                font-size:18px;
                font-weight:bold;
                margin-bottom:10px;
            ">
                🔥 Realistic Fires
            </div>

            <button id="firePlace" style="width:100%;padding:8px;">
                🔥 Place Fire
            </button>

            <br><br>

            <label>
                Intensity:
                <span id="fireIntensity">3</span>
            </label>

            <input
                id="fireSlider"
                type="range"
                min="1"
                max="5"
                value="3"
                style="width:100%;"
            >

            <br>

            <button id="fireRemove" style="width:100%;padding:7px;">
                Remove Last
            </button>

            <br><br>

            <button id="fireClear" style="width:100%;padding:7px;">
                Clear All Fires
            </button>

            <div id="fireStatus" style="
                margin-top:8px;
                color:#ffad5c;
            ">
                Ready
            </div>
        `;

        document.body.appendChild(panel);

        document.getElementById("firePlace").onclick = () => {
            placing = !placing;

            document.getElementById("fireStatus").textContent =
                placing
                    ? "Click anywhere on the map!"
                    : "Placement cancelled";

            document.getElementById("firePlace").textContent =
                placing
                    ? "❌ Cancel"
                    : "🔥 Place Fire";
        };

        document.getElementById("fireSlider").oninput = e => {
            intensity = Number(e.target.value);

            document.getElementById(
                "fireIntensity"
            ).textContent = intensity;
        };

        document.getElementById("fireRemove").onclick =
            removeLast;

        document.getElementById("fireClear").onclick =
            clearFires;
    }

    function setupMouse() {
        const viewer = geofs.api.viewer;

        const handler =
            new Cesium.ScreenSpaceEventHandler(
                viewer.scene.canvas
            );

        handler.setInputAction(movement => {
            if (!placing) return;

            let position = null;

            if (viewer.scene.pickPositionSupported) {
                position =
                    viewer.scene.pickPosition(
                        movement.position
                    );
            }

            if (!position) {
                position =
                    viewer.camera.pickEllipsoid(
                        movement.position,
                        viewer.scene.globe.ellipsoid
                    );
            }

            if (!position) return;

            spawnFire(position);

            placing = false;

            document.getElementById(
                "firePlace"
            ).textContent = "🔥 Place Fire";
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    function spawnFire(position) {
        const viewer = geofs.api.viewer;

        const cart =
            Cesium.Cartographic.fromCartesian(position);

        const baseHeight = cart.height || 0;

        const fire = {
            entities: [],
            intensity: intensity
        };

        // Fire flames
        const flameCount = 2 + intensity;

        for (let i = 0; i < flameCount; i++) {
            const lon =
                cart.longitude +
                (Math.random() - 0.5) *
                0.00015;

            const lat =
                cart.latitude +
                (Math.random() - 0.5) *
                0.00015;

            const height =
                baseHeight +
                Math.random() *
                (2 + intensity);

            const pos =
                Cesium.Cartesian3.fromRadians(
                    lon,
                    lat,
                    height
                );

            const entity =
                viewer.entities.add({
                    position: pos,

                    billboard: {
                        image:
                            fireImages[
                                Math.floor(
                                    Math.random() *
                                    fireImages.length
                                )
                            ],

                        width:
                            45 +
                            intensity * 12,

                        height:
                            55 +
                            intensity * 15,

                        verticalOrigin:
                            Cesium.VerticalOrigin.BOTTOM,

                        disableDepthTestDistance:
                            Number.POSITIVE_INFINITY
                    }
                });

            fire.entities.push(entity);
        }

        // Smoke
        const smokeCount =
            2 + Math.ceil(intensity / 2);

        for (let i = 0; i < smokeCount; i++) {
            const height =
                baseHeight +
                8 +
                i * (7 + intensity);

            const lon =
                cart.longitude +
                (Math.random() - 0.5) *
                0.0001;

            const lat =
                cart.latitude +
                (Math.random() - 0.5) *
                0.0001;

            const pos =
                Cesium.Cartesian3.fromRadians(
                    lon,
                    lat,
                    height
                );

            const entity =
                viewer.entities.add({
                    position: pos,

                    billboard: {
                        image:
                            smokeImages[i %
                                smokeImages.length],

                        width:
                            55 +
                            i * 12,

                        height:
                            55 +
                            i * 12,

                        verticalOrigin:
                            Cesium.VerticalOrigin.CENTER,

                        disableDepthTestDistance:
                            Number.POSITIVE_INFINITY,

                        color:
                            Cesium.Color.WHITE
                                .withAlpha(0.65)
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
                        baseHeight + 0.1
                    ),

                ellipse: {
                    semiMajorAxis:
                        4 + intensity * 2,

                    semiMinorAxis:
                        4 + intensity * 2,

                    material:
                        Cesium.Color.ORANGE
                            .withAlpha(0.18)
                }
            });

        fire.entities.push(glow);

        fires.push(fire);

        document.getElementById(
            "fireStatus"
        ).textContent =
            `🔥 ${fires.length} fire(s) active`;
    }

    function removeLast() {
        if (!fires.length) return;

        const viewer = geofs.api.viewer;

        const fire = fires.pop();

        fire.entities.forEach(entity => {
            viewer.entities.remove(entity);
        });

        document.getElementById(
            "fireStatus"
        ).textContent =
            `🔥 ${fires.length} fire(s) active`;
    }

    function clearFires() {
        const viewer = geofs.api.viewer;

        fires.forEach(fire => {
            fire.entities.forEach(entity => {
                viewer.entities.remove(entity);
            });
        });

        fires = [];

        document.getElementById(
            "fireStatus"
        ).textContent =
            "All fires cleared";
    }

    // Animate the fire and smoke
    function animate() {
        setInterval(() => {
            fireFrame =
                (fireFrame + 1) %
                fireImages.length;

            smokeFrame =
                (smokeFrame + 1) %
                smokeImages.length;

            fires.forEach(fire => {
                const flameCount =
                    2 + fire.intensity;

                let flameIndex = 0;
                let smokeIndex = 0;

                fire.entities.forEach(entity => {
                    if (!entity.billboard) return;

                    if (flameIndex < flameCount) {
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
})();
