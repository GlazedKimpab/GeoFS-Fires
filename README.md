GeoFS Realistic Fires

A GeoFS addon that lets you spawn realistic fires both on aircraft and the ground!!

Some features include:

Spawn fires anywhere by adjusting the position
Adjust by X, Y Axis
Smooth flames
Smoke around the actual flame
Let's you spawn muliple fires at once
Remove the last fire
Clear all fires
Can spawn fire on airliners (on the wings, fuselage, engines, ect.)

Installation

1. Install Tampermonkey
2. Create a new userscript.
3. Copy the contents of `geofs-realistic-fires.user.js`.
4. Paste the code into the userscript.
5. Save the script.
6. Open or reload [GeoFS](https://www.geo-fs.com/).

Or just simply copy the contents of `geofs-realistic-fires.user.js`, and paste it in your consle

How to Use

After loading GeoFS, you will see a panel called:

**🔥 Realistic Fires*

Place a fire

1. Click **🔥 Place Fire**.
2. Click anywhere on the GeoFS map.
3. A fire and smoke column will appear at that location.

Change the location
Use the slider to choose between:

The position
The size
The intensity

Remove a fire

Click **Remove Last** to remove the most recently created fire.

Remove everything

Click **Clear All Fires** to remove every fire currently spawned.

Project Structure

```text
GeoFS-Realistic-Fires/
│
├── geofs-realistic-fires.user.js
├── README.md
└── LICENSE
```

Notes

This addon creates the fire effects locally in your browser using the GeoFS/Cesium scene.

The fires are **visual effects only**. They do not physically damage aircraft, buildings, terrain, or the real world.

GeoFS internal APIs can change over time, so future GeoFS updates may require changes to the addon.

## 📜 License

MIT License.

Feel free to modify, improve, and share the addon.
