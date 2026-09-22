// ==UserScript==
// @name         GeoFS Fire Spawner
// @namespace    GeoFS-Fire-Spawner
// @version      2.0
// @description  Spawn fires anywhere in GeoFS
// @match        https://www.geo-fs.com/*
// @match        https://geo-fs.com/*
// @match        https://*.geo-fs.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    "use strict";

    let fireObjects = [];
    let placing = false;
    let intensity = 3;

    // Wait until GeoFS is ready
    const wait = setInterval(() => {

        if (
            window.geofs &&
            window.geofs.api &&
            window.geofs.api.viewer &&
            window.geofs.api.billboard
        ) {

            clearInterval(wait);
            start();

        }

    }, 500);


    function start() {

        console.log("[Fire] GeoFS detected!");

        createMenu();
        createClickHandler();

    }


    // =====================================================
    // FIRE IMAGE
    // =====================================================

    function makeFireImage() {

        const canvas = document.createElement("canvas");

        canvas.width = 256;
        canvas.height = 256;

        const ctx = canvas.getContext("2d");

        // Glow
        const glow = ctx.createRadialGradient(
            128, 165, 5,
            128, 165, 115
        );

        glow.addColorStop(
            0,
            "rgba(255,255,220,1)"
        );

        glow.addColorStop(
            0.2,
            "rgba(255,180,20,.9)"
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


        // Main flame
        ctx.beginPath();

        ctx.moveTo(128,235);

        ctx.bezierCurveTo(
            60,210,
            75,155,
            105,120
        );

        ctx.bezierCurveTo(
            90,90,
            120,60,
            135,20
        );

        ctx.bezierCurveTo(
            165,75,
            185,110,
            160,145
        );

        ctx.bezierCurveTo(
            200,180,
            175,220,
            128,235
        );

        ctx.closePath();


        const flame =
            ctx.createLinearGradient(
                0,20,
                0,235
            );

        flame.addColorStop(
            0,
            "#fffbd0"
        );

        flame.addColorStop(
            .3,
            "#ffd000"
        );

        flame.addColorStop(
            .7,
            "#ff5500"
        );

        flame.addColorStop(
            1,
            "#c90000"
        );

        ctx.fillStyle = flame;

        ctx.fill();


        // Inner flame
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
            135,75
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


    // =====================================================
    // SMOKE IMAGE
    // =====================================================

    function makeSmokeImage() {

        const canvas =
            document.createElement("canvas");

        canvas.width = 256;
        canvas.height = 256;

        const ctx =
            canvas.getContext("2d");


        const clouds = [
            [128,210,40],
            [110,165,38],
            [145,120,35],
            [115,75,30]
        ];


        clouds.forEach(c => {

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
                "rgba(30,30,30,.65)"
            );

            gradient.addColorStop(
                .6,
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

        });


        return canvas.toDataURL(
            "image/png"
        );
    }


    const FIRE_IMAGE =
        makeFireImage();

    const SMOKE_IMAGE =
        makeSmokeImage();


    // =====================================================
    // MENU
    // =====================================================

    function createMenu() {

        const menu =
            document.createElement("div");

        menu.id =
            "geofs-fire-menu";


        menu.innerHTML = `

            <div style="
                font-size:18px;
                font-weight:bold;
                margin-bottom:10px;
            ">
                🔥 FIRE SPAWNER
            </div>

            <button id="fire-place">
                🔥 PLACE FIRE
            </button>

            <br><br>

            <label>
                Fire size:
                <b id="fire-size">3</b>
            </label>

            <input
                id="fire-slider"
                type="range"
                min="1"
                max="5"
                value="3"
                style="width:100%;"
            >

            <button id="fire-delete">
                🗑️ DELETE LAST
            </button>

            <button id="fire-clear">
                🧹 DELETE ALL
            </button>

            <div
                id="fire-status"
                style="
                    margin-top:10px;
                    color:#ff9d4d;
                "
            >
                Ready
            </div>
        `;


        menu.style.cssText = `
            position:fixed;
            right:20px;
            top:120px;
            width:220px;
            padding:15px;
            z-index:999999;
            background:rgba(10,10,10,.95);
            color:white;
            border:2px solid #ff5a00;
            border-radius:10px;
            font-family:Arial;
            box-shadow:0 5px 30px rgba(0,0,0,.6);
        `;


        document.body.appendChild(menu);


        document.getElementById(
            "fire-place"
        ).onclick = () => {

            placing = !placing;

            document.getElementById(
                "fire-status"
            ).textContent =
                placing
                ? "CLICK THE GROUND"
                : "Ready";

        };


        document.getElementById(
            "fire-slider"
        ).oninput = e => {

            intensity =
                Number(e.target.value);

            document.getElementById(
                "fire-size"
            ).textContent =
                intensity;

        };


        document.getElementById(
            "fire-delete"
        ).onclick =
            deleteLast;


        document.getElementById(
            "fire-clear"
        ).onclick =
            deleteAll;

    }


    // =====================================================
    // CLICK HANDLER
    // =====================================================

    function createClickHandler() {

        const canvas =
            geofs.api.viewer.scene.canvas;


        const handler =
            new Cesium.ScreenSpaceEventHandler(
                canvas
            );


        handler.setInputAction(
            function (click) {

                if (!placing)
                    return;


                const scene =
                    geofs.api.viewer.scene;


                const ray =
                    geofs.api.viewer.camera
                        .getPickRay(
                            click.position
                        );


                if (!ray) {

                    setStatus(
                        "Couldn't find location"
                    );

                    return;
                }


                const position =
                    scene.globe.pick(
                        ray,
                        scene
                    );


                if (!position) {

                    setStatus(
                        "Click on the globe"
                    );

                    return;
                }


                const cart =
                    Cesium.Cartographic
                        .fromCartesian(
                            position
                        );


                const lat =
                    Cesium.Math
                        .toDegrees(
                            cart.latitude
                        );


                const lon =
                    Cesium.Math
                        .toDegrees(
                            cart.longitude
                        );


                spawnFire(
                    lat,
                    lon,
                    cart.height || 0
                );


                placing = false;

                setStatus(
                    "🔥 FIRE SPAWNED!"
                );

            },
            Cesium.ScreenSpaceEventType
                .LEFT_CLICK
        );

    }


    // =====================================================
    // SPAWN FIRE
    // =====================================================

    function spawnFire(
        lat,
        lon,
        altitude
    ) {

        const objects = [];


        // Multiple flames
        for (
            let i = 0;
            i < intensity + 1;
            i++
        ) {

            const offsetLat =
                (Math.random() - .5)
                * .00008;

            const offsetLon =
                (Math.random() - .5)
                * .00008;


            const billboard =
                new geofs.api.billboard(

                    [
                        lat + offsetLat,
                        lon + offsetLon,
                        altitude + 1
                    ],

                    FIRE_IMAGE,

                    {
                        collection:
                            "translucent",

                        scale:
                            0.7 +
                            intensity * .25,

                        opacity:1,

                        geofsFixCameraRotation:
                            true
                    }
                );


            objects.push(
                billboard
            );

        }


        // Smoke
        for (
            let i = 0;
            i < intensity;
            i++
        ) {

            const smoke =
                new geofs.api.billboard(

                    [
                        lat,
                        lon,
                        altitude +
                        8 +
                        i * 8
                    ],

                    SMOKE_IMAGE,

                    {
                        collection:
                            "translucent",

                        scale:
                            0.8 +
                            i * .15,

                        opacity:
                            0.65,

                        geofsFixCameraRotation:
                            true
                    }
                );


            objects.push(smoke);

        }


        fireObjects.push(
            objects
        );


        setStatus(
            "🔥 Fire spawned! Total: " +
            fireObjects.length
        );


        console.log(
            "[Fire] Spawned at:",
            lat,
            lon,
            altitude
        );

    }


    // =====================================================
    // DELETE
    // =====================================================

    function deleteLast() {

        if (!fireObjects.length)
            return;


        const objects =
            fireObjects.pop();


        objects.forEach(
            object => {

                try {
                    object.destroy();
                } catch {}

            }
        );


        setStatus(
            "Removed last fire"
        );

    }


    function deleteAll() {

        fireObjects.forEach(
            objects => {

                objects.forEach(
                    object => {

                        try {
                            object.destroy();
                        } catch {}

                    }
                );

            }
        );


        fireObjects = [];


        setStatus(
            "All fires removed"
        );

    }


    function setStatus(text) {

        const element =
            document.getElementById(
                "fire-status"
            );


        if (element)
            element.textContent =
                text;

    }

})();
