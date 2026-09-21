GeoFS Realistic Fires

A GeoFS addon that lets you spawn **realistic-looking animated fires and smoke anywhere on the GeoFS map**.

Features

* 🔥 Spawn fires anywhere by clicking the map
* 🌋 5 different fire intensity levels
* 🔥 Animated flames
* 💨 Animated smoke
* 🟠 Fire glow on the ground
* 🗑️ Remove the last fire
* 🧹 Clear all fires
* 🎨 Fire and smoke textures are generated locally
* ⚡ No external image files required

Installation

### Tampermonkey / Violentmonkey

1. Install **Tampermonkey** or **Violentmonkey**.
2. Create a new userscript.
3. Copy the contents of `geofs-realistic-fires.user.js`.
4. Paste the code into the userscript.
5. Save the script.
6. Open or reload [GeoFS](https://www.geo-fs.com/).

## 🎮 How to Use

After loading GeoFS, you will see a panel called:

**🔥 Realistic Fires**

### Place a fire

1. Click **🔥 Place Fire**.
2. Click anywhere on the GeoFS map.
3. A fire and smoke column will appear at that location.

### Change intensity

Use the **Intensity** slider to choose between:

* `1` — Small fire
* `2` — Low fire
* `3` — Medium fire
* `4` — Large fire
* `5` — Very large fire

### Remove a fire

Click **Remove Last** to remove the most recently created fire.

### Remove everything

Click **Clear All Fires** to remove every fire currently spawned.

## 🛠️ Project Structure

```text
GeoFS-Realistic-Fires/
│
├── geofs-realistic-fires.user.js
├── README.md
└── LICENSE
```

## ⚠️ Notes

This addon creates the fire effects locally in your browser using the GeoFS/Cesium scene.

The fires are **visual effects only**. They do not physically damage aircraft, buildings, terrain, or the real world.

GeoFS internal APIs can change over time, so future GeoFS updates may require changes to the addon.

## 🚀 Future Features

Possible future updates:

* 🌬️ Wind-driven smoke
* 🔥 Fire spreading
* 🌲 Fires that interact with scenery
* 🚒 Fire trucks
* ✈️ Aircraft fire effects
* 💥 Explosions
* 🌧️ Rain that extinguishes fires
* 🌙 Better night-time fire lighting
* 🔊 Fire sound effects
* 🎛️ More advanced fire controls

## 📜 License

MIT License.

Feel free to modify, improve, and share the addon.
