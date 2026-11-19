# Tihar-Chhath UI-Design

This is a project made for the KUCC Tihar–Chhath Web UI Design Competition 2026.
A scroll-driven story built with plain HTML, CSS and JavaScript. It opens with a single switch and carries a glowing Tihar night into the sunrise of Chhath, with every scene drawn on a canvas. There are no images, libraries or build steps.


Link to the Website : https://binnie788.github.io/WebDesignContest_kucc/


## Concept

Turn on the switch and scroll. A festival night of lit buildings and fireworks leads down to a rangoli where families gather. The camera then zooms into the central diyo and opens onto a pond of floating diyos at sunrise, where a devotee offers arghya to the sun. A closing page explains both festivals.

## Story flow

1. **Switch:** the page starts black. Turning on the switch fades in the scene and unlocks scrolling.
2. **Tihar night:** two tall buildings with window lights and twinkling Tihar bulbs, a night sky with moon and stars, a colorful city skyline, and fireworks.
3. **Rangoli:** the camera moves down the buildings to a rangoli ringed with diyos. Families stand and sit around it in kurta, saree and festive outfits. A dog wears a tika, a cow is worshipped, and stay at the foot of a building.
4. **Zoom into the diyo:** the camera zooms into the central diyo, and a golden flash swaps night for morning.
5. **Chhath sunrise:** the view zooms out over a pond with floating diyos, a rising sun and a Chhath devotee standing in the water.
6. **Final page:** "Happy Tihar & Chhath", short notes on both festivals.

## Festival theme

| Element | Meaning |
|---|---|
| Bulb strings, diyos, rangoli | Tihar lights and decoration |
| Dog with a tika | Kukur Tihar |
| Worshipped cow | Gai Tihar |
| Sunrise pond, soop with offerings, devotee | Chhath Puja and arghya to the sun |

## Run it

No installation is needed.

1. Download or clone the repository.
2. Open `index.html` in Chrome or Firefox (double-click it, or use a tool such as VS Code Live Server).

If your copy of the main file has a different name, rename it to `index.html` so GitHub Pages can find it.



Inside `components.js` the script is split into  sections:

| Section | Contents |
|---|---|
| Settings | colors, people, dog, cow, fireworks and the scroll timeline |
| Setup and helpers | canvas sizing, `clamp`, `ease`, `between`, `rand`, `ell`, `poly` |
| Lights and diyo | `bulb`, `lightString`, `diya` |
| Scene parts | `building`,`fireworks`, `scenery`, `rangoli`  |
| Characters | `person`, `dog`, `cow`, `devotee` |
| Scenes | `drawNight` and `drawPond` |
| Timeline | `frame()`, which decides what to draw for the current scroll position |
