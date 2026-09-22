// ==UserScript==
// @name         GeoFS Fire Gizmo
// @namespace    GeoFS-Fire-Gizmo
// @version      3.0
// @description  Place and position fires in GeoFS with XYZ controls
// @match        https://geo-fs.com/geofs.php*
// @match        https://www.geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    "use strict";

    console.log("[FireGizmo] Starting...");

    let fire = null;
    let firePosition = null;

    let imageURL = null;

    let x = 0; // longitude movement
    let y = 0; // latitude movement
    let z = 0; // altitude movement

    let size = 3;

    // ---------------------------------------------------------
    // WAIT FOR GEOFS
    // ---------------------------------------------------------

    function waitForGeoFS() {

        if (
            window.geofs &&
            geofs.api &&
            geofs.api.billboard &&
            geofs.api.getCameraLla
        ) {

            console.log("[FireGizmo] GeoFS ready!");
            initialize();

        } else {

            setTimeout(
                waitForGeoFS,
                500
            );

        }
    }

    // ---------------------------------------------------------
    // FIRE IMAGE
    // ---------------------------------------------------------

    function createFireImage() {

        const canvas =
            document.createElement("canvas");

        canvas.width = 256;
        canvas.height = 256;

        const ctx =
            canvas.getContext("2d");

        // Glow

        const glow =
            ctx.createRadialGradient(
                128,
                180,
                5,
                128,
                180,
                120
            );

        glow.addColorStop(
            0,
            "rgba(255,255,220,1)"
        );

        glow.addColorStop(
            0.18,
            "rgba(255,200,40,.95)"
        );

        glow.addColorStop(
            0.5,
            "rgba(255,60,0,.35)"
        );

        glow.addColorStop(
            1,
            "rgba(255,0,0,0)"
        );

        ctx.fillStyle = glow;

        ctx.fillRect(
            0,
            0,
            256,
            256
        );

        // Outer flame

        ctx.beginPath();

        ctx.moveTo(128, 240);

        ctx.bezierCurveTo(
            55,
            215,
            70,
            155,
            105,
            120
        );

        ctx.bezierCurveTo(
            90,
            85,
            120,
            60,
            135,
            20
        );

        ctx.bezierCurveTo(
            165,
            75,
            190,
            110,
            160,
            145
        );

        ctx.bezierCurveTo(
            205,
            185,
            175,
            225,
            128,
            240
        );

        ctx.closePath();

        const flame =
            ctx.createLinearGradient(
                0,
                20,
                0,
                240
            );

        flame.addColorStop(
            0,
            "#fffde0"
        );

        flame.addColorStop(
            0.25,
            "#ffd000"
        );

        flame.addColorStop(
            0.65,
            "#ff5700"
        );

        flame.addColorStop(
            1,
            "#c40000"
        );

        ctx.fillStyle = flame;

        ctx.fill();

        // Inner flame

        ctx.beginPath();

        ctx.moveTo(128, 225);

        ctx.bezierCurveTo(
            95,
            205,
            105,
            170,
            120,
            145
        );

        ctx.bezierCurveTo(
            112,
            125,
            130,
            100,
            136,
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
            215,
            128,
            225
        );

        ctx.closePath();

        ctx.fillStyle =
            "#fff176";

        ctx.fill();

        return canvas.toDataURL(
            "image/png"
        );
    }

    // ---------------------------------------------------------
    // SMOKE
    // ---------------------------------------------------------

    function createSmokeImage() {

        const canvas =
            document.createElement("canvas");

        canvas.width = 256;
        canvas.height = 256;

        const ctx =
            canvas.getContext("2d");

        const clouds = [
            [128, 215, 42],
            [105, 165, 38],
            [150, 120, 35],
            [115, 75, 30]
        ];

        for (const c of clouds) {

            const gradient =
                ctx.createRadialGradient(
                    c[0],
                    c[1],
                    2,
                    c[0],
                    c[1],
                    c[2]
                );

            gradient.addColorStop(
                0,
                "rgba(35,35,35,.65)"
            );

            gradient.addColorStop(
                .55,
                "rgba(60,60,60,.3)"
            );

            gradient.addColorStop(
                1,
                "rgba(0,0,0,0)"
            );

            ctx.fillStyle =
                gradient;

            ctx.beginPath();

            ctx.arc(
                c[0],
                c[1],
                c[2],
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        return canvas.toDataURL(
            "image/png"
        );
    }

    // ---------------------------------------------------------
    // CREATE FIRE
    // ---------------------------------------------------------

    function spawnFire() {

        removeFire();

        const camera =
            geofs.api.getCameraLla();

        if (!camera) {

            setStatus(
                "Could not get camera position"
            );

            return;
        }

        /*
         * GeoFS LLA format:
         *
         * [latitude, longitude, altitude]
         */

        firePosition = [
            camera[0],
            camera[1],
            camera[2]
        ];

        updatePosition();

        setStatus(
            "🔥 Fire created!"
        );
    }

    // ---------------------------------------------------------
    // UPDATE FIRE
    // ---------------------------------------------------------

    function updatePosition() {

        if (!firePosition)
            return;

        const lat =
            firePosition[0] + y / 111000;

        const lon =
            firePosition[1] +
            x /
            (
                111000 *
                Math.cos(
                    firePosition[0] *
                    Math.PI /
                    180
                )
            );

        const alt =
            firePosition[2] + z;

        const location = [
            lat,
            lon,
            alt
        ];

        // Create billboard if necessary

        if (!fire) {

            fire =
                new geofs.api.billboard(
                    location,
                    imageURL,
                    {
                        collection:
                            "translucent",

                        scale:
                            0.7 +
                            size * 0.3,

                        opacity: 1,

                        geofsFixCameraRotation:
                            true
                    }
                );

        } else {

            fire.setLocation(
                location
            );

            fire.setScale(
                0.7 +
                size * 0.3
            );

        }
    }

    // ---------------------------------------------------------
    // DELETE FIRE
    // ---------------------------------------------------------

    function removeFire() {

        if (fire) {

            try {
                fire.destroy();
            } catch (e) {}

        }

        fire = null;
    }

    // ---------------------------------------------------------
    // UI
    // ---------------------------------------------------------

    function createUI() {

        const panel =
            document.createElement("div");

        panel.id =
            "fire-gizmo";

        panel.innerHTML = `

            <div class="fg-title">
                🔥 FIRE GIZMO
            </div>

            <button id="fg-create">
                🔥 CREATE FIRE
            </button>

            <div class="fg-section">
                <b>POSITION</b>
            </div>

            <label>
                X — Left / Right
                <span id="fg-x-value">0</span> m
            </label>

            <input
                id="fg-x"
                type="range"
                min="-500"
                max="500"
                value="0"
                step="1"
            >

            <label>
                Y — Forward / Back
                <span id="fg-y-value">0</span> m
            </label>

            <input
                id="fg-y"
                type="range"
                min="-500"
                max="500"
                value="0"
                step="1"
            >

            <label>
                Z — Up / Down
                <span id="fg-z-value">0</span> m
            </label>

            <input
                id="fg-z"
                type="range"
                min="-100"
                max="500"
                value="0"
                step="1"
            >

            <div class="fg-section">
                <b>SIZE</b>
            </div>

            <input
                id="fg-size"
                type="range"
                min="1"
                max="8"
                value="3"
                step="1"
            >

            <div class="fg-buttons">

                <button id="fg-reset">
                    ↩ RESET
                </button>

                <button id="fg-delete">
                    🗑 DELETE
                </button>

            </div>

            <div id="fg-status">
                Ready
            </div>

        `;

        const style =
            document.createElement("style");

        style.textContent = `

            #fire-gizmo {

                position:fixed;

                right:20px;

                top:120px;

                width:245px;

                padding:14px;

                background:
                    rgba(12,12,15,.96);

                color:white;

                z-index:999999;

                border:
                    2px solid #ff5a00;

                border-radius:12px;

                font-family:
                    Arial,sans-serif;

                box-shadow:
                    0 8px 35px
                    rgba(0,0,0,.65);

            }

            .fg-title {

                font-size:20px;

                font-weight:bold;

                color:#ff8a3d;

                margin-bottom:12px;

            }

            .fg-section {

                margin-top:13px;

                margin-bottom:5px;

                color:#ff9a55;

            }

            #fire-gizmo label {

                display:block;

                margin-top:8px;

                margin-bottom:3px;

            }

            #fire-gizmo label span {

                float:right;

                color:#ff9a55;

            }

            #fire-gizmo input {

                width:100%;

            }

            #fire-gizmo button {

                width:100%;

                padding:9px;

                margin-top:6px;

                border:0;

                border-radius:6px;

                background:#333;

                color:white;

                font-weight:bold;

                cursor:pointer;

            }

            #fire-gizmo button:hover {

                background:#ff5a00;

            }

            .fg-buttons {

                display:flex;

                gap:6px;

            }

            .fg-buttons button {

                width:50%;

            }

            #fg-status {

                margin-top:10px;

                color:#ffad70;

                min-height:18px;

            }

        `;

        document.head.appendChild(
            style
        );

        document.body.appendChild(
            panel
        );


        // Create

        document.getElementById(
            "fg-create"
        ).onclick =
            spawnFire;


        // X

        document.getElementById(
            "fg-x"
        ).oninput = function () {

            x = Number(this.value);

            document.getElementById(
                "fg-x-value"
            ).textContent = x;

            updatePosition();

        };


        // Y

        document.getElementById(
            "fg-y"
        ).oninput = function () {

            y = Number(this.value);

            document.getElementById(
                "fg-y-value"
            ).textContent = y;

            updatePosition();

        };


        // Z

        document.getElementById(
            "fg-z"
        ).oninput = function () {

            z = Number(this.value);

            document.getElementById(
                "fg-z-value"
            ).textContent = z;

            updatePosition();

        };


        // Size

        document.getElementById(
            "fg-size"
        ).oninput = function () {

            size =
                Number(this.value);

            if (fire) {

                fire.setScale(
                    0.7 +
                    size * 0.3
                );

            }

        };


        // Reset

        document.getElementById(
            "fg-reset"
        ).onclick = function () {

            x = 0;
            y = 0;
            z = 0;

            document.getElementById(
                "fg-x"
            ).value = 0;

            document.getElementById(
                "fg-y"
            ).value = 0;

            document.getElementById(
                "fg-z"
            ).value = 0;

            document.getElementById(
                "fg-x-value"
            ).textContent = 0;

            document.getElementById(
                "fg-y-value"
            ).textContent = 0;

            document.getElementById(
                "fg-z-value"
            ).textContent = 0;

            updatePosition();

        };


        // Delete

        document.getElementById(
            "fg-delete"
        ).onclick =
            function () {

                removeFire();

                setStatus(
                    "Fire deleted"
                );

            };

    }

    // ---------------------------------------------------------
    // STATUS
    // ---------------------------------------------------------

    function setStatus(text) {

        const element =
            document.getElementById(
                "fg-status"
            );

        if (element)
            element.textContent =
                text;

    }

    // ---------------------------------------------------------
    // START
    // ---------------------------------------------------------

    function initialize() {

        imageURL =
            createFireImage();

        createSmokeImage();

        createUI();

        setStatus(
            "Ready — click CREATE FIRE"
        );

        console.log(
            "[FireGizmo] Ready!"
        );

    }

    waitForGeoFS();

})();
