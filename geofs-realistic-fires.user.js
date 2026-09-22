// ==UserScript==
// @name         GeoFS Fire Gizmo
// @namespace    GeoFS-Fire-Gizmo
// @version      4.0
// @description  Fire spawner with XYZ movement controls
// @match        https://www.geo-fs.com/*
// @match        https://geo-fs.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    "use strict";

    let fire = null;

    let basePosition = null;

    let x = 0;
    let y = 0;
    let z = 0;

    let scale = 3;

    // --------------------------------------------------
    // WAIT FOR GEOFS
    // --------------------------------------------------

    const timer = setInterval(() => {

        if (
            window.geofs &&
            geofs.api &&
            geofs.api.billboard &&
            geofs.camera &&
            geofs.camera.cam
        ) {

            clearInterval(timer);

            console.log(
                "[FIRE] GeoFS API detected!"
            );

            start();
        }

    }, 500);


    // --------------------------------------------------
    // FIRE IMAGE
    // --------------------------------------------------

    function makeFire() {

        const canvas =
            document.createElement("canvas");

        canvas.width = 256;
        canvas.height = 256;

        const ctx =
            canvas.getContext("2d");

        // glow

        const glow =
            ctx.createRadialGradient(
                128,
                170,
                5,
                128,
                170,
                120
            );

        glow.addColorStop(
            0,
            "rgba(255,255,220,1)"
        );

        glow.addColorStop(
            .2,
            "rgba(255,180,20,.95)"
        );

        glow.addColorStop(
            .5,
            "rgba(255,50,0,.35)"
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

        // outer flame

        ctx.beginPath();

        ctx.moveTo(128,235);

        ctx.bezierCurveTo(
            60,215,
            70,155,
            105,120
        );

        ctx.bezierCurveTo(
            90,90,
            120,60,
            135,20
        );

        ctx.bezierCurveTo(
            165,75,
            190,110,
            160,145
        );

        ctx.bezierCurveTo(
            205,180,
            175,220,
            128,235
        );

        ctx.closePath();

        const flame =
            ctx.createLinearGradient(
                0,
                20,
                0,
                235
            );

        flame.addColorStop(
            0,
            "#ffffff"
        );

        flame.addColorStop(
            .25,
            "#ffe000"
        );

        flame.addColorStop(
            .65,
            "#ff5000"
        );

        flame.addColorStop(
            1,
            "#c00000"
        );

        ctx.fillStyle = flame;

        ctx.fill();

        // inner flame

        ctx.beginPath();

        ctx.moveTo(128,220);

        ctx.bezierCurveTo(
            95,205,
            105,170,
            120,145
        );

        ctx.bezierCurveTo(
            112,125,
            130,100,
            136,75
        );

        ctx.bezierCurveTo(
            155,120,
            160,145,
            148,165
        );

        ctx.bezierCurveTo(
            170,190,
            150,210,
            128,220
        );

        ctx.closePath();

        ctx.fillStyle =
            "#fff176";

        ctx.fill();

        return canvas.toDataURL(
            "image/png"
        );
    }


    const FIRE_IMAGE =
        makeFire();


    // --------------------------------------------------
    // CREATE FIRE
    // --------------------------------------------------

    function createFire() {

        deleteFire();

        /*
         * IMPORTANT:
         *
         * getCameraLla requires
         * geofs.camera.cam
         */

        const cameraPosition =
            geofs.api.getCameraLla(
                geofs.camera.cam
            );

        if (!cameraPosition) {

            status(
                "Couldn't get camera position"
            );

            console.error(
                "[FIRE] Camera position failed"
            );

            return;
        }

        console.log(
            "[FIRE] Camera LLA:",
            cameraPosition
        );


        /*
         * Put fire slightly in front
         * of the aircraft/camera.
         *
         * LLA =
         * latitude
         * longitude
         * altitude
         */

        basePosition = [
            cameraPosition[0],
            cameraPosition[1],
            cameraPosition[2]
        ];


        x = 0;
        y = 0;
        z = -20;


        document.getElementById(
            "fire-x"
        ).value = 0;

        document.getElementById(
            "fire-y"
        ).value = 0;

        document.getElementById(
            "fire-z"
        ).value = -20;


        updateLabels();

        updateFire();

        status(
            "🔥 FIRE CREATED"
        );

        console.log(
            "[FIRE] Created at:",
            basePosition
        );
    }


    // --------------------------------------------------
    // UPDATE FIRE
    // --------------------------------------------------

    function updateFire() {

        if (!basePosition)
            return;


        /*
         * Convert meters into
         * approximate latitude/
         * longitude offsets.
         */

        const latitude =
            basePosition[0] +
            y / 111320;


        const longitude =
            basePosition[1] +
            x /
            (
                111320 *
                Math.cos(
                    basePosition[0] *
                    Math.PI /
                    180
                )
            );


        const altitude =
            basePosition[2] +
            z;


        const location = [
            latitude,
            longitude,
            altitude
        ];


        // Create billboard

        if (!fire) {

            console.log(
                "[FIRE] Creating billboard:",
                location
            );

            try {

                fire =
                    new geofs.api.billboard(
                        location,
                        FIRE_IMAGE,
                        {
                            collection:
                                "translucent",

                            scale:
                                scale,

                            opacity:
                                1,

                            geofsFixCameraRotation:
                                true
                        }
                    );

                console.log(
                    "[FIRE] BILLBOARD CREATED!",
                    fire
                );

            } catch (error) {

                console.error(
                    "[FIRE] BILLBOARD ERROR:",
                    error
                );

                status(
                    "Billboard error — press F12"
                );

                return;
            }

        } else {

            fire.setLocation(
                location
            );

            fire.setScale(
                scale
            );
        }
    }


    // --------------------------------------------------
    // DELETE
    // --------------------------------------------------

    function deleteFire() {

        if (!fire)
            return;

        try {

            fire.destroy();

        } catch (error) {

            console.warn(
                "[FIRE] Destroy error:",
                error
            );
        }

        fire = null;
    }


    // --------------------------------------------------
    // UI
    // --------------------------------------------------

    function createUI() {

        const panel =
            document.createElement("div");

        panel.id =
            "fire-gizmo";


        panel.innerHTML = `

            <div class="title">
                🔥 FIRE GIZMO
            </div>

            <button id="create">
                🔥 CREATE FIRE
            </button>

            <div class="axis">
                <b>POSITION</b>
            </div>

            <label>
                X
                <span id="x-value">0</span> m
            </label>

            <input
                id="fire-x"
                type="range"
                min="-1000"
                max="1000"
                value="0"
                step="1"
            >

            <label>
                Y
                <span id="y-value">0</span> m
            </label>

            <input
                id="fire-y"
                type="range"
                min="-1000"
                max="1000"
                value="0"
                step="1"
            >

            <label>
                Z
                <span id="z-value">-20</span> m
            </label>

            <input
                id="fire-z"
                type="range"
                min="-500"
                max="500"
                value="-20"
                step="1"
            >

            <div class="axis">
                <b>QUICK MOVE</b>
            </div>

            <div class="row">
                <button id="left">← X</button>
                <button id="right">X →</button>
            </div>

            <div class="row">
                <button id="back">Y ↓</button>
                <button id="forward">Y ↑</button>
            </div>

            <div class="row">
                <button id="down">Z ↓</button>
                <button id="up">Z ↑</button>
            </div>

            <div class="axis">
                <b>SIZE</b>
            </div>

            <input
                id="fire-size"
                type="range"
                min="1"
                max="8"
                value="3"
                step=".1"
            >

            <button id="reset">
                ↩ RESET
            </button>

            <button id="delete">
                🗑 DELETE FIRE
            </button>

            <div id="status">
                Ready
            </div>
        `;


        const style =
            document.createElement("style");

        style.textContent = `

            #fire-gizmo {
                position:fixed;
                right:20px;
                top:110px;
                width:250px;
                padding:15px;
                background:rgba(10,10,12,.96);
                color:white;
                z-index:999999;
                border:2px solid #ff6500;
                border-radius:12px;
                font-family:Arial;
                box-shadow:0 8px 30px rgba(0,0,0,.7);
            }

            #fire-gizmo .title {
                font-size:20px;
                font-weight:bold;
                color:#ff8a3d;
                margin-bottom:12px;
            }

            #fire-gizmo .axis {
                margin-top:12px;
                margin-bottom:5px;
                color:#ff9b55;
            }

            #fire-gizmo label {
                display:block;
                margin-top:7px;
            }

            #fire-gizmo label span {
                float:right;
                color:#ff9b55;
            }

            #fire-gizmo input {
                width:100%;
            }

            #fire-gizmo button {
                width:100%;
                margin-top:6px;
                padding:8px;
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

            #fire-gizmo .row {
                display:flex;
                gap:5px;
            }

            #fire-gizmo .row button {
                width:50%;
            }

            #status {
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


        // CREATE

        document.getElementById(
            "create"
        ).onclick =
            createFire;


        // X

        document.getElementById(
            "fire-x"
        ).oninput = e => {

            x =
                Number(e.target.value);

            updateLabels();
            updateFire();
        };


        // Y

        document.getElementById(
            "fire-y"
        ).oninput = e => {

            y =
                Number(e.target.value);

            updateLabels();
            updateFire();
        };


        // Z

        document.getElementById(
            "fire-z"
        ).oninput = e => {

            z =
                Number(e.target.value);

            updateLabels();
            updateFire();
        };


        // SIZE

        document.getElementById(
            "fire-size"
        ).oninput = e => {

            scale =
                Number(e.target.value);

            if (fire)
                fire.setScale(scale);
        };


        // QUICK MOVEMENT

        document.getElementById(
            "left"
        ).onclick = () => moveX(-10);

        document.getElementById(
            "right"
        ).onclick = () => moveX(10);

        document.getElementById(
            "back"
        ).onclick = () => moveY(-10);

        document.getElementById(
            "forward"
        ).onclick = () => moveY(10);

        document.getElementById(
            "down"
        ).onclick = () => moveZ(-10);

        document.getElementById(
            "up"
        ).onclick = () => moveZ(10);


        // RESET

        document.getElementById(
            "reset"
        ).onclick = () => {

            x = 0;
            y = 0;
            z = -20;

            updateControls();

            updateFire();
        };


        // DELETE

        document.getElementById(
            "delete"
        ).onclick = () => {

            deleteFire();

            status(
                "Fire deleted"
            );
        };
    }


    // --------------------------------------------------
    // MOVEMENT
    // --------------------------------------------------

    function moveX(amount) {

        x += amount;

        updateControls();
        updateFire();
    }


    function moveY(amount) {

        y += amount;

        updateControls();
        updateFire();
    }


    function moveZ(amount) {

        z += amount;

        updateControls();
        updateFire();
    }


    function updateControls() {

        document.getElementById(
            "fire-x"
        ).value = x;

        document.getElementById(
            "fire-y"
        ).value = y;

        document.getElementById(
            "fire-z"
        ).value = z;

        updateLabels();
    }


    function updateLabels() {

        document.getElementById(
            "x-value"
        ).textContent = x;

        document.getElementById(
            "y-value"
        ).textContent = y;

        document.getElementById(
            "z-value"
        ).textContent = z;
    }


    // --------------------------------------------------
    // STATUS
    // --------------------------------------------------

    function status(text) {

        const element =
            document.getElementById(
                "status"
            );

        if (element)
            element.textContent =
                text;
    }


    // --------------------------------------------------
    // START
    // --------------------------------------------------

    function start() {

        createUI();

        console.log(
            "[FIRE] Fire Gizmo ready."
        );
    }

})();
