# F Residence

A furnished 3D apartment walkthrough built with Three.js **0.185.0**, loaded from the requested jsDelivr module URL. No build step or production dependencies.

## Run

```sh
npm start
```

Open **http://127.0.0.1:4173**. Python 3 serves the static files. Alternatively, serve this folder with any static HTTP server. Internet access is needed for Three.js and the optional web fonts.

Drag to orbit; scroll/pinch to zoom. Choose **Walk inside** or a room, then use **WASD / arrow keys** and drag to look. A click on the scene locks the mouse; **Esc** releases it. Touch devices have a movement pad. Furniture and walls block movement. Use the daylight switch for an evening lighting study.

## Source and interpretation

`260801-apartm-plan-F.pdf` is the supplied, single-page raster plan. `assets/plan.png` is its rendered reference, also available in the app. `plan.js` traces the stepped footprint, partitions, windows, openings, room layout and furniture scale from that image.

Scale uses the labeled 105 × 188 cm daughter's bed (approximately 160 pixels long). Ceiling height is assumed at 2.8 m. Unmarked measurements and unclear door openings are approximated. Furniture is modeled in Three.js in the drawing's locations; materials, decoration and lighting are a design interpretation. This is an interactive visualization, not a measured construction model.

## Cloudflare Workers deployment

No build command is needed. Set the asset directory to the repository root (`.`), using `npx wrangler deploy --assets .` as the deploy command in Cloudflare's Git integration.

`.assetsignore` allows only the app's HTML, CSS, JavaScript, plan image, and source PDF to be uploaded. It excludes installed dependencies, screenshots, Git data, and development files. Git's `.gitignore` does not control Wrangler's asset uploads. `artifacts/` is already ignored by Git.

Commit and push these files before retrying the deployment. See [Cloudflare's asset exclusion documentation](https://developers.cloudflare.com/workers/static-assets/binding/#excluding-certain-files-from-being-uploaded).

## Verify

With the server running:

```sh
npm install
npm test
```

The browser check uses installed Google Chrome on Windows; set `CHROME_PATH` to another Chromium executable if needed. It checks rendering, every room spawn, navigation, controls, dialogs and a narrow viewport, and saves screenshots in `artifacts/`.
