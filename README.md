# F Residence

A furnished 3D apartment walkthrough built with Three.js **0.185.0**, loaded from the requested jsDelivr module URL. No build step or production dependencies.

## Run

```sh
npm start
```

Open **http://127.0.0.1:4173**. Python 3 serves the static files. Alternatively, serve this folder with any static HTTP server. Internet access is needed for Three.js and the optional web fonts.

Drag to orbit; scroll/pinch to zoom. Choose **Walk inside** or a room, then use **WASD / arrow keys** and drag to look. A click on the scene locks the mouse; **Esc** releases it. Touch devices have a movement pad. Furniture and walls block movement. Use the daylight switch for an evening lighting study.

## OmniGate bundle

Run `pwsh -File .\build-omnigate.ps1` to create `apt.zip` beside the script,
then upload that ZIP through OmniGate's **Upload & host app**. No npm process
or Python server is needed when hosted. Bundle contains runtime files,
`omnigate.json`, this README, and the house-heart SVG favicon; excludes
development dependencies, scripts, reference photos, and generated artifacts.
The build script works from any working directory. Three.js and optional fonts
still require internet access; this packaging does not make the app offline.

See `HOW_TO_MAKE_OMNIGATE_WEB_APPS.md` for the copied gateway bundle specification.
UI lives in `index.html` and `style.css`; scene and interaction logic in `app.js`,
layout in `plan.js` and `wall-edges.js`, furniture components in `stool.js` and
`stool2.js`. Preserve responsive room navigation, overview/walk modes, readable
controls, and browser-local furniture placement when tailoring the app.

## Source and interpretation

### 2026-10-07 designer update

`ref_photos/apt-plan-2026-10-07.jpg` (shown in the app as `assets/plan-2026-10-07.jpg`) refines the original plan; registered on the four structural columns it matches the old footprint, so only local changes were made: the daughter's room door moves to the end of a short entry passage lined in oak, the guest toilet door moves north to sit flush in the refrigerator wall, and window sills/heads follow the plan's `W width/height/sill` annotations.

Interior finishes, built-ins and furniture for the entrance, living/dining, refrigerator wall, kitchen and daughter's room follow `ref_photos/rendering-1…10`. Whitewashed oak, walnut and travertine-veneer textures are sampled from the renderings themselves (`assets/tex-*.jpg`, flat-fielded to remove baked lighting); the leaf mural is the daughter room wall cropped from rendering 8. Walk mode adds window area lights and ambient occlusion to approach the renderings' soft daylight. The main bedroom, study and bathrooms have no renderings and keep the earlier interpretation. Direct sunlit floor patches seen in the renderings are not reproduced.


`260801-apartm-plan-F.pdf` is the supplied, single-page raster plan. `assets/plan.png` is its rendered reference, also available in the app. `plan.js` traces the stepped footprint, partitions, windows, openings, room layout and furniture scale from that image.

Scale uses the labeled 105 × 188 cm daughter's bed (approximately 160 pixels long). Ceiling height is 2.65 m, with built-ins stopping at 2.35 m under a bulkhead. Unmarked measurements and unclear door openings are approximated. Furniture is modeled in Three.js in the drawing's locations; materials, decoration and lighting are a design interpretation. This is an interactive visualization, not a measured construction model.

Window and exterior door geometry follows the eleven photos in `ref_photos/`, using their filenames to map each wall to the plan. Living/daughter/main-bedroom north glazing has 3/2/3 sections with low sills, lower fixed lights and a left upper sash; the main bedroom's east wall has four sections, a higher sill and end sashes. The study has a raised two-section window, the main bathroom has two sections above the bath, and the guest bathroom has a high two-section window above the toilet. The utility balcony is open above a masonry parapet. The entrance has a closed dark timber door; the kitchen's glazed balcony door is shown open 90 degrees to allow walkthrough access. Opening widths, offsets and heights are photo estimates in `plan.js`, not surveyed dimensions. Blinds and curtains are omitted so the frames remain visible.

The Study stool is a reusable `createStool()` component in `stool.js`, in metres, measuring 35 × 35 × 45 cm. Its notched seat, four full-height corner posts and four aprons follow IMG_5719–IMG_5722. Texture UVs sample the wood directly from unmodified IMG_5722 (seat and striped corner joints) and IMG_5720 (legs and aprons), copied into `assets/`. Edge rounding, varnish, leg width and apron thickness are estimated from the photos; photo lighting remains baked into the texture. The stool retains furniture dragging, rotation, collision and saved placement.

`stool2.js` exports `createStool2()`, extracted from the supplied `wooden_stool_3d_viewer.html`. This second 35 × 35 × 45 cm stool sits beside the bed in the daughter’s room, with the original procedural wood, bump maps, finger joints and underside brackets. It uses the apartment’s lighting and furniture controls.

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
