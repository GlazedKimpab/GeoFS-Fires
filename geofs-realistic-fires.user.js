// ============================================================
// GEOFS - PROCEDURAL REALISTIC FIRE
// H = hide/show controls
// ============================================================

(function () {

    "use strict";

    // --------------------------------------------------------
    // SETTINGS
    // --------------------------------------------------------

    let fireBase = null;

    let fireX = 0;
    let fireY = 0;
    let fireZ = -20;

    let fireSize = 3;
    let fireIntensity = 6;

    let fireObjects = [];

    let ui = null;
    let hidden = false;

    let lastTextureUpdate = 0;


    // --------------------------------------------------------
    // WAIT FOR GEOFS
    // --------------------------------------------------------

    const loader = setInterval(() => {

        if (
            window.geofs &&
            geofs.api &&
            geofs.api.billboard &&
            geofs.camera &&
            geofs.camera.cam
        ) {

            clearInterval(loader);

            createUI();

            console.log(
                "[FIRE] Procedural fire loaded"
            );
        }

    }, 500);


    // ========================================================
    // PROCEDURAL FIRE TEXTURE
    // ========================================================

    function createFireTexture(seed) {

        const canvas =
            document.createElement("canvas");

        canvas.width = 512;
        canvas.height = 768;

        const ctx =
            canvas.getContext("2d");

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        /*
         * ----------------------------------------------------
         * LARGE SOFT OUTER GLOW
         * ----------------------------------------------------
         */

        const glow =
            ctx.createRadialGradient(
                256,
                570,
                20,
                256,
                570,
                300
            );

        glow.addColorStop(
            0,
            "rgba(255,170,20,.30)"
        );

        glow.addColorStop(
            .3,
            "rgba(255,70,0,.18)"
        );

        glow.addColorStop(
            .7,
            "rgba(170,20,0,.06)"
        );

        glow.addColorStop(
            1,
            "rgba(0,0,0,0)"
        );

        ctx.fillStyle = glow;

        ctx.fillRect(
            0,
            0,
            512,
            768
        );


        /*
         * ----------------------------------------------------
         * ORGANIC NOISE FIELD
         *
         * Instead of drawing circles or flame polygons,
         * thousands of tiny overlapping translucent fields
         * create an irregular silhouette.
         * ----------------------------------------------------
         */

        const random = mulberry32(
            seed
        );


        for (
            let i = 0;
            i < 1800;
            i++
        ) {

            const height =
                Math.pow(
                    random(),
                    1.65
                );


            /*
             * Fire is narrow at the top and wide at
             * the bottom.
             */

            const width =
                30 +
                height * 220;


            let x =
                256 +
                (
                    random() -
                    .5
                ) *
                width;


            let y =
                690 -
                height *
                600;


            /*
             * Multiple sine distortions make the edge
             * irregular instead of symmetrical.
             */

            x +=
                Math.sin(
                    y * .035 +
                    seed
                ) *
                35 *
                height;

            x +=
                Math.sin(
                    y * .071 +
                    seed * 2.3
                ) *
                18;

            x +=
                Math.sin(
                    y * .013 +
                    seed * 4.1
                ) *
                28 *
                height;


            const radius =
                3 +
                random() *
                (
                    8 +
                    height * 28
                );


            const temperature =
                random();


            let r;
            let g;
            let b;
            let alpha;


            if (
                temperature < .13
            ) {

                // White-hot core

                r = 255;
                g = 255;
                b = 220;

                alpha =
                    .015 +
                    random() * .075;

            } else if (
                temperature < .42
            ) {

                // Yellow

                r = 255;
                g = 215;
                b = 45;

                alpha =
                    .012 +
                    random() * .065;

            } else if (
                temperature < .78
            ) {

                // Orange

                r = 255;
                g = 75;
                b = 5;

                alpha =
                    .01 +
                    random() * .06;

            } else {

                // Deep red outer fire

                r = 190;
                g = 20;
                b = 0;

                alpha =
                    .008 +
                    random() * .045;
            }


            const gradient =
                ctx.createRadialGradient(
                    x,
                    y,
                    0,
                    x,
                    y,
                    radius
                );


            gradient.addColorStop(
                0,
                `rgba(${r},${g},${b},${alpha})`
            );

            gradient.addColorStop(
                .35,
                `rgba(${r},${g},${b},${alpha * .65})`
            );

            gradient.addColorStop(
                1,
                `rgba(${r},${g},${b},0)`
            );


            ctx.fillStyle =
                gradient;


            ctx.beginPath();

            ctx.arc(
                x,
                y,
                radius,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }


        /*
         * ----------------------------------------------------
         * WHITE-HOT CENTRAL REGION
         * ----------------------------------------------------
         */

        for (
            let i = 0;
            i < 500;
            i++
        ) {

            const x =
                256 +
                (
                    random() -
                    .5
                ) *
                150;


            const y =
                620 -
                random() *
                250;


            const radius =
                4 +
                random() *
                25;


            const g =
                ctx.createRadialGradient(
                    x,
                    y,
                    0,
                    x,
                    y,
                    radius
                );


            g.addColorStop(
                0,
                "rgba(255,255,235,.16)"
            );

            g.addColorStop(
                .3,
                "rgba(255,240,120,.10)"
            );

            g.addColorStop(
                .7,
                "rgba(255,130,10,.04)"
            );

            g.addColorStop(
                1,
                "rgba(255,50,0,0)"
            );


            ctx.fillStyle = g;

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                radius,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }


        /*
         * ----------------------------------------------------
         * RANDOM HOT TONGUES
         * ----------------------------------------------------
         *
         * These are extremely soft and blurred so they don't
         * look like cartoon flame shapes.
         */

        ctx.filter =
            "blur(5px)";


        for (
            let i = 0;
            i < 45;
            i++
        ) {

            const x =
                256 +
                (
                    random() -
                    .5
                ) *
                170;


            const startY =
                610 -
                random() *
                160;


            const length =
                50 +
                random() *
                230;


            const width =
                8 +
                random() *
                20;


            const gradient =
                ctx.createLinearGradient(
                    x,
                    startY,
                    x +
                    (
                        random() -
                        .5
                    ) *
                    50,
                    startY -
                    length
                );


            gradient.addColorStop(
                0,
                "rgba(255,220,70,.08)"
            );

            gradient.addColorStop(
                .35,
                "rgba(255,90,0,.06)"
            );

            gradient.addColorStop(
                1,
                "rgba(255,20,0,0)"
            );


            ctx.fillStyle =
                gradient;


            ctx.beginPath();

            ctx.ellipse(
                x,
                startY -
                length / 2,
                width,
                length / 2,
                (
                    random() -
                    .5
                ) *
                .5,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }


        ctx.filter =
            "none";


        return canvas.toDataURL(
            "image/png"
        );
    }


    // ========================================================
    // RANDOM NUMBER GENERATOR
    // ========================================================

    function mulberry32(a) {

        return function () {

            let t =
                a +=
                0x6D2B79F5;

            t =
                Math.imul(
                    t ^
                    t >>> 15,
                    t | 1
                );

            t ^=
                t +
                Math.imul(
                    t ^
                    t >>> 7,
                    t | 61
                );

            return (
                (
                    t ^
                    t >>> 14
                ) >>> 0
            ) /
            4294967296;
        };
    }


    // ========================================================
    // SMOKE
    // ========================================================

    function createSmokeTexture(
        seed
    ) {

        const canvas =
            document.createElement(
                "canvas"
            );

        canvas.width = 512;
        canvas.height = 512;

        const ctx =
            canvas.getContext(
                "2d"
            );

        const random =
            mulberry32(
                seed
            );


        for (
            let i = 0;
            i < 500;
            i++
        ) {

            const x =
                256 +
                (
                    random() -
                    .5
                ) *
                400;


            const y =
                256 +
                (
                    random() -
                    .5
                ) *
                400;


            const radius =
                15 +
                random() *
                70;


            const gray =
                25 +
                random() *
                45;


            const g =
                ctx.createRadialGradient(
                    x,
                    y,
                    0,
                    x,
                    y,
                    radius
                );


            g.addColorStop(
                0,
                `rgba(${gray},${gray},${gray},.055)`
            );

            g.addColorStop(
                .5,
                `rgba(${gray},${gray},${gray},.025)`
            );

            g.addColorStop(
                1,
                "rgba(0,0,0,0)"
            );


            ctx.fillStyle = g;

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                radius,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }


        return canvas.toDataURL(
            "image/png"
        );
    }


    // ========================================================
    // EMBER
    // ========================================================

    function createEmberTexture() {

        const canvas =
            document.createElement(
                "canvas"
            );

        canvas.width = 64;
        canvas.height = 64;

        const ctx =
            canvas.getContext(
                "2d"
            );


        const g =
            ctx.createRadialGradient(
                32,
                32,
                0,
                32,
                32,
                32
            );


        g.addColorStop(
            0,
            "rgba(255,255,230,1)"
        );

        g.addColorStop(
            .15,
            "rgba(255,210,50,1)"
        );

        g.addColorStop(
            .45,
            "rgba(255,70,0,.7)"
        );

        g.addColorStop(
            1,
            "rgba(255,0,0,0)"
        );


        ctx.fillStyle = g;

        ctx.fillRect(
            0,
            0,
            64,
            64
        );


        return canvas.toDataURL(
            "image/png"
        );
    }


    const EMBER_TEXTURE =
        createEmberTexture();


    // ========================================================
    // CREATE BILLBOARD
    // ========================================================

    function createBillboard(
        position,
        image,
        scale,
        opacity
    ) {

        try {

            return new geofs.api.billboard(
                position,
                image,
                {

                    collection:
                        "translucent",

                    scale:
                        scale,

                    opacity:
                        opacity,

                    geofsFixCameraRotation:
                        true
                }
            );

        } catch (e) {

            console.error(
                "[FIRE] Billboard error:",
                e
            );

            return null;
        }
    }


    // ========================================================
    // CREATE FIRE
    // ========================================================

    function createFire() {

        deleteFire();


        const camera =
            geofs.api.getCameraLla(
                geofs.camera.cam
            );


        if (
            !camera
        ) {

            setStatus(
                "Could not get position"
            );

            return;
        }


        fireBase = [

            camera[0],
            camera[1],
            camera[2]

        ];


        fireX = 0;
        fireY = 0;
        fireZ = -20;


        buildFire();


        setStatus(
            "🔥 Fire placed"
        );
    }


    // ========================================================
    // POSITION CALCULATION
    // ========================================================

    function position(
        x,
        y,
        z
    ) {

        const lat =
            fireBase[0] +
            y /
            111320;


        const lon =
            fireBase[1] +
            x /
            (
                111320 *
                Math.cos(
                    fireBase[0] *
                    Math.PI /
                    180
                )
            );


        return [

            lat,
            lon,
            fireBase[2] + z

        ];
    }


    // ========================================================
    // BUILD FIRE
    // ========================================================

    function buildFire() {

        deleteFire();


        if (
            !fireBase
        )
            return;


        /*
         * ----------------------------------------------------
         * MAIN FIRE
         * ----------------------------------------------------
         *
         * Only a few huge organic textures.
         *
         * This is what removes the "geometrical particle"
         * appearance.
         */

        const mainCount =
            7 +
            Math.floor(
                fireIntensity /
                2
            );


        for (
            let i = 0;
            i < mainCount;
            i++
        ) {

            const texture =
                createFireTexture(
                    1000 +
                    i *
                    973
            );


            const angle =
                (
                    i /
                    mainCount
                ) *
                Math.PI *
                2;


            const radius =
                (
                    i % 3
                ) *
                .8;


            const x =
                Math.cos(
                    angle
                ) *
                radius;


            const y =
                Math.sin(
                    angle
                ) *
                radius;


            const z =
                fireZ +
                (
                    i % 3
                ) *
                fireSize *
                1.5;


            const object =
                createBillboard(

                    position(
                        fireX + x,
                        fireY + y,
                        z
                    ),

                    texture,

                    fireSize *
                    (
                        2.2 +
                        Math.random() *
                        .8
                    ),

                    .65 +
                    Math.random() *
                    .25

                );


            if (
                object
            ) {

                fireObjects.push({

                    object:

                        object,

                    type:
                        "fire",

                    x:
                        x,

                    y:
                        y,

                    z:
                        z,

                    scale:
                        fireSize *
                        (
                            2.2 +
                            Math.random() *
                            .8
                        ),

                    phase:
                        Math.random() *
                        Math.PI *
                        2,

                    speed:
                        .7 +
                        Math.random() *
                        1.3

                });
            }
        }


        // ----------------------------------------------------
        // SMOKE
        // ----------------------------------------------------

        const smokeCount =
            5 +
            Math.floor(
                fireIntensity /
                2
            );


        for (
            let i = 0;
            i < smokeCount;
            i++
        ) {

            const smoke =
                createSmokeTexture(
                    9000 +
                    i *
                    333
                );


            const object =
                createBillboard(

                    position(
                        fireX,
                        fireY,
                        fireZ +
                        8 +
                        i *
                        10
                    ),

                    smoke,

                    fireSize *
                    (
                        3 +
                        i *
                        .6
                    ),

                    .20

                );


            if (
                object
            ) {

                fireObjects.push({

                    object:
                        object,

                    type:
                        "smoke",

                    phase:
                        Math.random() *
                        Math.PI *
                        2,

                    speed:
                        .2 +
                        Math.random() *
                        .4,

                    offset:
                        i * 10,

                    scale:
                        fireSize *
                        (
                            3 +
                            i * .6
                        )

                });
            }
        }


        // ----------------------------------------------------
        // EMBERS
        // ----------------------------------------------------

        for (
            let i = 0;
            i <
            12 +
            fireIntensity * 3;
            i++
        ) {

            const object =
                createBillboard(

                    position(
                        fireX,
                        fireY,
                        fireZ
                    ),

                    EMBER_TEXTURE,

                    .08 +
                    Math.random() *
                    .15,

                    .8

                );


            if (
                object
            ) {

                fireObjects.push({

                    object:
                        object,

                    type:
                        "ember",

                    phase:
                        Math.random() *
                        Math.PI *
                        2,

                    angle:
                        Math.random() *
                        Math.PI *
                        2,

                    distance:
                        Math.random() *
                        15,

                    rise:
                        5 +
                        Math.random() *
                        20

                });
            }
        }
    }


    // ========================================================
    // ANIMATION
    // ========================================================

    function animate(
        timestamp
    ) {

        const time =
            timestamp /
            1000;


        fireObjects.forEach(
            p => {

                if (
                    !p.object
                )
                    return;


                try {

                    // ----------------------------------------
                    // MAIN FIRE
                    // ----------------------------------------

                    if (
                        p.type ===
                        "fire"
                    ) {

                        const wobbleX =
                            Math.sin(
                                time *
                                p.speed *
                                3 +
                                p.phase
                            ) *
                            fireSize *
                            2;


                        const wobbleY =
                            Math.cos(
                                time *
                                p.speed *
                                2.7 +
                                p.phase
                            ) *
                            fireSize *
                            1.5;


                        const rise =
                            Math.sin(
                                time *
                                p.speed *
                                2 +
                                p.phase
                            ) *
                            fireSize *
                            2;


                        p.object.setLocation(

                            position(

                                fireX +
                                p.x +
                                wobbleX,

                                fireY +
                                p.y +
                                wobbleY,

                                p.z +
                                rise

                            )

                        );


                        /*
                         * Very subtle scale breathing.
                         */

                        const scale =
                            p.scale *
                            (
                                1 +
                                Math.sin(
                                    time *
                                    p.speed *
                                    5 +
                                    p.phase
                                ) *
                                .10
                            );


                        p.object.setScale(
                            scale
                        );
                    }


                    // ----------------------------------------
                    // SMOKE
                    // ----------------------------------------

                    if (
                        p.type ===
                        "smoke"
                    ) {

                        const x =
                            Math.sin(
                                time *
                                p.speed +
                                p.phase
                            ) *
                            (
                                5 +
                                p.offset
                            );


                        const y =
                            Math.cos(
                                time *
                                p.speed *
                                .8 +
                                p.phase
                            ) *
                            (
                                4 +
                                p.offset
                            );


                        const z =
                            fireZ +
                            8 +
                            p.offset +
                            (
                                (
                                    time *
                                    2
                                ) %
                                35
                            );


                        p.object.setLocation(

                            position(
                                fireX + x,
                                fireY + y,
                                z
                            )

                        );


                        p.object.setScale(

                            p.scale *
                            (
                                1 +
                                p.offset /
                                20
                            )

                        );
                    }


                    // ----------------------------------------
                    // EMBERS
                    // ----------------------------------------

                    if (
                        p.type ===
                        "ember"
                    ) {

                        const rise =
                            (
                                time *
                                5
                            ) %
                            p.rise;


                        const distance =
                            p.distance +
                            rise *
                            .5;


                        const x =
                            Math.cos(
                                p.angle
                            ) *
                            distance;


                        const y =
                            Math.sin(
                                p.angle
                            ) *
                            distance;


                        const z =
                            fireZ +
                            rise;


                        p.object.setLocation(

                            position(
                                fireX + x,
                                fireY + y,
                                z
                            )

                        );
                    }

                } catch (e) {}

            }
        );


        /*
         * Rebuild the fire textures periodically.
         *
         * This changes the silhouette itself rather than
         * merely moving the sprites.
         */

        if (
            timestamp -
            lastTextureUpdate >
            350
        ) {

            lastTextureUpdate =
                timestamp;

            regenerateFireTextures();
        }


        requestAnimationFrame(
            animate
        );
    }


    // ========================================================
    // REGENERATE MAIN FIRE
    // ========================================================

    function regenerateFireTextures() {

        const fire =
            fireObjects.filter(
                p =>
                    p.type ===
                    "fire"
            );


        fire.forEach(
            (p, index) => {

                try {

                    const newTexture =
                        createFireTexture(
                            Math.floor(
                                performance.now() /
                                350
                            ) *
                            31 +
                            index *
                            719
                        );


                    /*
                     * Replacing the image is used instead of
                     * making the flame a fixed texture.
                     */

                    if (
                        p.object &&
                        p.object.setImage
                    ) {

                        p.object.setImage(
                            newTexture
                        );

                    }

                } catch (e) {}
            }
        );
    }


    // ========================================================
    // DELETE
    // ========================================================

    function deleteFire() {

        fireObjects.forEach(
            p => {

                try {

                    if (
                        p.object
                    ) {

                        p.object.destroy();

                    }

                } catch (e) {}

            }
        );


        fireObjects = [];
    }


    // ========================================================
    // UI
    // ========================================================

    function createUI() {

        ui =
            document.createElement(
                "div"
            );


        ui.id =
            "procedural-fire-ui";


        ui.innerHTML = `

            <div class="fire-title">
                🔥 PROCEDURAL FIRE
            </div>

            <button id="fire-create">
                PLACE FIRE
            </button>

            <label>
                X
                <span id="fire-x-value">0</span>
            </label>

            <input
                id="fire-x"
                type="range"
                min="-1000"
                max="1000"
                value="0"
            >

            <label>
                Y
                <span id="fire-y-value">0</span>
            </label>

            <input
                id="fire-y"
                type="range"
                min="-1000"
                max="1000"
                value="0"
            >

            <label>
                Z
                <span id="fire-z-value">-20</span>
            </label>

            <input
                id="fire-z"
                type="range"
                min="-500"
                max="500"
                value="-20"
            >

            <label>
                SIZE
                <span id="fire-size-value">3</span>
            </label>

            <input
                id="fire-size"
                type="range"
                min=".5"
                max="10"
                step=".1"
                value="3"
            >

            <label>
                INTENSITY
                <span id="fire-intensity-value">6</span>
            </label>

            <input
                id="fire-intensity"
                type="range"
                min="1"
                max="10"
                value="6"
            >

            <button id="fire-delete">
                DELETE FIRE
            </button>

            <div class="fire-help">
                Press H to hide/show this panel
            </div>

            <div id="fire-status">
                Ready
            </div>
        `;


        const style =
            document.createElement(
                "style"
            );


        style.textContent = `

            #procedural-fire-ui {

                position: fixed;

                right: 20px;
                top: 120px;

                width: 250px;

                padding: 15px;

                background:
                    rgba(8,8,8,.94);

                color: white;

                z-index: 999999;

                border:
                    2px solid
                    #ff641c;

                border-radius:
                    12px;

                font-family:
                    Arial, sans-serif;

                box-shadow:
                    0 8px 30px
                    rgba(0,0,0,.75);
            }


            .fire-title {

                color:
                    #ff8438;

                font-size:
                    19px;

                font-weight:
                    bold;

                margin-bottom:
                    12px;
            }


            #procedural-fire-ui
            button {

                width:
                    100%;

                margin-top:
                    7px;

                padding:
                    9px;

                border:
                    none;

                border-radius:
                    6px;

                background:
                    #292929;

                color:
                    white;

                font-weight:
                    bold;

                cursor:
                    pointer;
            }


            #procedural-fire-ui
            button:hover {

                background:
                    #d94d10;
            }


            #procedural-fire-ui
            input {

                width:
                    100%;

                margin-bottom:
                    5px;
            }


            #procedural-fire-ui
            label {

                display:
                    block;

                margin-top:
                    8px;
            }


            #procedural-fire-ui
            label span {

                float:
                    right;

                color:
                    #ff9a60;
            }


            .fire-help {

                margin-top:
                    12px;

                font-size:
                    11px;

                color:
                    #aaa;

                text-align:
                    center;
            }


            #fire-status {

                margin-top:
                    9px;

                color:
                    #ff9a60;

                text-align:
                    center;
            }
        `;


        document.head.appendChild(
            style
        );

        document.body.appendChild(
            ui
        );


        // ----------------------------------------------------
        // BUTTONS
        // ----------------------------------------------------

        document.getElementById(
            "fire-create"
        ).onclick =
            createFire;


        document.getElementById(
            "fire-delete"
        ).onclick =
            () => {

                deleteFire();

                setStatus(
                    "Fire deleted"
                );
            };


        // ----------------------------------------------------
        // X
        // ----------------------------------------------------

        document.getElementById(
            "fire-x"
        ).oninput =
            e => {

                fireX =
                    Number(
                        e.target.value
                    );

                updateLabels();
            };


        // ----------------------------------------------------
        // Y
        // ----------------------------------------------------

        document.getElementById(
            "fire-y"
        ).oninput =
            e => {

                fireY =
                    Number(
                        e.target.value
                    );

                updateLabels();
            };


        // ----------------------------------------------------
        // Z
        // ----------------------------------------------------

        document.getElementById(
            "fire-z"
        ).oninput =
            e => {

                fireZ =
                    Number(
                        e.target.value
                    );

                updateLabels();
            };


        // ----------------------------------------------------
        // SIZE
        // ----------------------------------------------------

        document.getElementById(
            "fire-size"
        ).oninput =
            e => {

                fireSize =
                    Number(
                        e.target.value
                    );

                updateLabels();

                if (
                    fireBase
                )
                    buildFire();
            };


        // ----------------------------------------------------
        // INTENSITY
        // ----------------------------------------------------

        document.getElementById(
            "fire-intensity"
        ).oninput =
            e => {

                fireIntensity =
                    Number(
                        e.target.value
                    );

                updateLabels();

                if (
                    fireBase
                )
                    buildFire();
            };


        // ----------------------------------------------------
        // H = HIDE UI
        // ----------------------------------------------------

        document.addEventListener(
            "keydown",
            event => {

                /*
                 * Don't activate while typing into
                 * an input.
                 */

                if (
                    event.target.tagName ===
                    "INPUT" ||
                    event.target.tagName ===
                    "TEXTAREA"
                )
                    return;


                if (
                    event.key.toLowerCase() ===
                    "h"
                ) {

                    hidden =
                        !hidden;


                    ui.style.display =
                        hidden
                            ? "none"
                            : "block";
                }
            }
        );


        requestAnimationFrame(
            animate
        );
    }


    // ========================================================
    // UPDATE UI VALUES
    // ========================================================

    function updateLabels() {

        const x =
            document.getElementById(
                "fire-x-value"
            );

        const y =
            document.getElementById(
                "fire-y-value"
            );

        const z =
            document.getElementById(
                "fire-z-value"
            );

        const s =
            document.getElementById(
                "fire-size-value"
            );

        const i =
            document.getElementById(
                "fire-intensity-value"
            );


        if (x)
            x.textContent =
                fireX;

        if (y)
            y.textContent =
                fireY;

        if (z)
            z.textContent =
                fireZ;

        if (s)
            s.textContent =
                fireSize;

        if (i)
            i.textContent =
                fireIntensity;
    }


    // ========================================================
    // STATUS
    // ========================================================

    function setStatus(
        text
    ) {

        const status =
            document.getElementById(
                "fire-status"
            );


        if (
            status
        )
            status.textContent =
                text;
    }

})();
