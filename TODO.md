# Open work — F Residence

Rolling TODO. Last updated 2026-11-14 after fixing the 2026-11-09 review findings and a follow-up
review of those fixes. Nothing below blocks the app from running.

## How to verify (needed before any claim of "done")

```sh
npm install          # once
npm start            # terminal 1 — python http.server on 127.0.0.1:4173
npm test             # browser check + packaging check (~90 s)
graphify update .    # after code edits (AST only, no API cost)
```

- `check.mjs` needs the server running (it says so and exits if not); `check-package.mjs` does not
  but needs Chrome and `pwsh`.
- Graph rule from AGENTS.md: run `graphify query "<question>"` before grepping or reading source.
- Mutation-test new checks before trusting them. Reverts that the current suite catches include:
  - placeFurniture rotating by `rotation.y-homeAngle` → `Turned desk chair collider is 36×38 px (found 38.0×36.0)`
  - double-tap ignoring drag movement → `A tap followed by a drag does not rotate`
  - an intro area out of step with `plan.js` → `index.html shows 85.6 m² · 25.9 坪 from the room polygons`
  - old keyboard guard, bypassed `freeSpawn`, a changed window `depth`, a deleted room, a blank
    daughter camera, a missing build asset, `plan.png` un-ignored (see git history of this file).

## 1. Open

- [ ] **Instance the repeated decor (performance).** Measured with `artifacts/probe-draws.mjs`:
      overview 669 draw calls, walk with shadow refresh 1397, walk steady 296. Battens, shutter
      slats, cubbies, book rows and backsplash tiles are separate same-material meshes;
      `InstancedMesh` (as for the bath pebbles) would collapse them. Do it only if a low-end device
      is measured struggling — 669 is workable. *Care:* furniture must stay separate; keep `*-sill`
      meshes named, `check.mjs` reads them.
- [ ] `stool2.js` seat side walls take UVs from `(x,z)` only, so the 25 mm edge reads as a flat
      strip. `stool.js` solves this with `edgeQuad`; give ExtrudeGeometry group 1 its own strip UV.
- [ ] Intro areas on 360×640 portrait now sit on a translucent backing but still cover part of the
      model. Moving the model down at very short portrait heights would be cleaner.

## 2. Accepted — do not "fix" without a reason

- **`webglcontextlost`** is not handled in `app.js`: Three's `WebGLRenderer` already calls
  `preventDefault()` on loss, so restore fires and `webglcontextrestored` re-renders.
- **`stool2.js` `bumpScale: 0.00035` is correct.** Three's bump mapping works in world units, so it
  is 0.35 mm of relief in this metre-scale scene, not an inert value.
- **DPR changes** are re-applied in `resize()`. A DPR change with no resize event (rare in Chrome)
  is not tracked; add a `matchMedia('(resolution: …)')` listener only if someone reports it.
- **Saved layouts are world metres** under key `f-residence-furniture-v1`; the comment beside the
  key says to bump it whenever `plan.js` coordinates or `SCALE` change.
- **`cornerSpan()`** uses one global half-thickness and the first matching opening; its contract is
  commented in `wall-edges.js` and is fine while openings are farther apart than a wall is thick.
- **`check.mjs` change-detector constants** (sill values, furniture indices, part counts) stay: each
  failure message names what changed, which is what a change-detector is for.
- **17 residual close corner pairs (≤1.18 cm)** are real steps where a thick wall meets a thinner
  one. Do not reintroduce cosmetic thickness edits (x=900 going 12 → 17 px intrudes 2.9 cm into the
  utility glazing; the suite catches it). Read the thickness rules in `plan.js` before touching
  `walls`/`windows`.
- **The two plan rasters stay in the repository** as trace references but are not shipped. If one
  returns to the UI, add it to `build-omnigate.ps1` **and** `.assetsignore`; `check-package.mjs`
  fails until both agree.
- **`graphify update` skips `style.css`** ("no supported extension"). Not a graph bug.
- **The app needs the network** for Three.js from jsDelivr and the web fonts; both packaging checks
  assert only local responses.

## 3. Notes

- The `check.mjs` hook block (`HOOKS_SOURCE`) binds to module-private names in `app.js` on purpose;
  renaming one fails with `check.mjs hooks are stale: <name>` — update the hook block.
- CDP touch tests: a drag that leaves a piece somewhere new can put another mesh in front of it, so
  later taps miss it. Drag out and back (as the tap-then-drag test does) to keep later steps valid.
- `apt.zip` is rebuilt by every `npm test` (via `apt.zip.tmp`); both are git-ignored.
- `artifacts/` (git-ignored) holds screenshots, cleared per run, and disposable probes
  (`probe-draws.mjs`, `probe-focus.mjs`, `probe-spawn.mjs`, `audit-corners.mjs`).
