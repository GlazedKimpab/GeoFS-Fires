// ==UserScript==
// @name         GeoFS Fire API Test
// @version      1.0
// @match        https://www.geo-fs.com/*
// @match        https://geo-fs.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    "use strict";

    function test() {
        const info = [];

        info.push("GeoFS: " + !!window.geofs);
        info.push("GeoFS API: " + !!window.geofs?.api);
        info.push("Viewer: " + !!window.geofs?.api?.viewer);
        info.push("Billboard: " + typeof window.geofs?.api?.billboard);
        info.push("Camera LLA: " + typeof window.geofs?.api?.getCameraLla);
        info.push("Cesium: " + !!window.Cesium);

        console.log(
            "========== GEOFS FIRE TEST ==========\n" +
            info.join("\n") +
            "\n======================================"
        );

        const box = document.createElement("div");

        box.style.cssText = `
            position:fixed;
            left:20px;
            top:20px;
            z-index:999999;
            background:#111;
            color:white;
            padding:15px;
            border:2px solid orange;
            border-radius:8px;
            font:14px monospace;
            white-space:pre;
        `;

        box.textContent =
            "🔥 GeoFS Fire API Test\\n\\n" +
            info.join("\\n");

        document.body.appendChild(box);
    }

    const timer = setInterval(() => {
        if (window.geofs) {
            clearInterval(timer);
            test();
        }
    }, 500);

})();
