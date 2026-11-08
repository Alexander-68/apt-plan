# Open work — F Residence

Rolling TODO. Written 2026-11-09 after the three-reviewer code review of the walkthrough.
Continue from here; nothing below blocks the app from running.

## Where things stand

- Branch `master`, last commit `0ada1fb` ("Batch static architecture into fewer draw calls").
- `npm test` is green: `check.mjs` (135 assertions) **and** `check-package.mjs` (builds `apt.zip`,
  serves it on an ephemeral port, boots it in Chrome, asserts every local response is 2xx).
- Review findings A–L are all resolved **except I, which is partial** (section 1).
- Working tree is clean. `apt.zip` and `artifacts/` are git-ignored.

### Landed in this pass

| Commit | What |
|---|---|
| `689beca` | Movement keys survive a focused HUD button (walking used to die silently after clicking a scene tool, Help or Clean view) |
| `ef466e5` | `freeSpawn()` stops furniture on a spawn freezing walking; per-window `depth` + wall-line thickness rules; `ORIGIN_X/Z`/`unX`/`unZ`; daughter/kitchen polygons meet at their real partition; shadow refresh throttled during drags |
| `e341b76` | README corrections (plan image not shown in app, `W height/sill` annotation, blinds) + stopped shipping the two unused plan rasters |
| `61f9ef1` | `check.mjs` hardened (135 asserts, testHooks + `testStale`, screenshot colour guards, room inventory, HTTP/console collectors, plan invariants, focus + spawn regressions) and `check-package.mjs` added |
| `0ada1fb` | Static architecture/ceiling boxes batched per material; corner lines derived from plan data |

### How to verify (needed before any claim of "done")

```sh
npm install          # once
npm start            # terminal 1 — python http.server on 127.0.0.1:4173
npm test             # browser check + packaging check
graphify update .    # after code edits (AST only, no API cost)
```

- `check.mjs` needs the server running; `check-package.mjs` does not but needs Chrome and `pwsh`.
- Graph rule from AGENTS.md: run `graphify query "<question>"` before grepping or reading source,
  and read raw files only for lines the graph or an earlier read located.
- Mutation-test new checks before trusting them. Reverted-behaviour runs used this pass:
  - old keyboard guard → `W still walks after #light takes focus (moved 0.000 m)`
  - bypassed `freeSpawn` → `A blocked room spawn still places the camera on a standable cell`
  - one window `depth` changed → `living flanking walls share its 14 px depth at 540,270 (found 16)`
  - a room deleted from `plan.js` → `plan.js exports the nine expected rooms in order`
  - daughter camera reverted to the blank view → `artifacts/photo-daughter.png is blank or single-colour: 42 distinct sampled colours (floor 50)`
  - `assets/tex-mural.jpg` removed from the build list → `Missing from apt.zip (1): assets/tex-mural.jpg`
  - `!assets/plan.png` added back to `.assetsignore` → `Unexpected in .assetsignore (1): assets/plan.png`
- Scratch tools left in `artifacts/` (git-ignored, safe to delete): `probe-focus.mjs`, `probe-spawn.mjs`,
  `probe-draws.mjs`, `audit-corners.mjs`, plus `review-test-run*.txt` logs.

---

## 1. Performance — finish finding I (partial)

The shadow-map cost per drag is fixed and static architecture is batched, but the app still builds
most of its decor and furniture as individual boxes. Measured this pass:

| Frame | Before | Now |
|---|---|---|
| Overview (boot / settled) | 766 | 669 |
| Walk with shadow refresh (mode switch) | 1554 | 1397 |
| Walk steady state (no shadow pass) | — | 296 |

- [ ] **Instance the repeated decor.** Battens, shutter slats, cubbies, book rows and backsplash
      tiles are separate meshes with the same material and rotation; `InstancedMesh` (already used
      for the 420 pebbles near the bath) would collapse them. The bulk is built in the kitchen,
      daughter-room, main-bedroom and study sections of `app.js`.
      *Why:* the overview frame is the embedded-GPU target the README promises to respect.
      *Care:* furniture pieces move and must stay separate; check `furniture` membership before
      batching. Keep `*-sill` meshes named — `check.mjs` reads them.
- [ ] Consider whether 669 overview calls are acceptable instead. If yes, close this item and
      update the numbers in this file. Measure with `artifacts/probe-draws.mjs`.

## 2. App behaviour and accessibility (Minor)

Line numbers are from the review at `fcc0367` and have shifted; search the quoted symbol.

- [ ] `wallState()` — the walls button reads "Cutaway" **while disabled** in walk mode, where the
      walls are actually full. Use a state label ("Walls: full") or relabel in walk.
- [ ] `editMode()` + `.clean-view` in `style.css` — entering Edit furniture hides the only on-screen
      editing instructions ("Drag furniture · Space to rotate"). Keep a small hint while `editing`.
- [ ] Furniture double-tap rotation (`pointerup` handler) does not check that the *second* gesture was
      a tap: a tap followed by a drag within 600 ms rotates 90° and saves. `lastFurnitureTap` is also
      set by mouse releases and never cleared on `pointercancel`. Require neither gesture moved
      beyond a few pixels.
- [ ] Rotation-aware collision in `placeFurniture()` ignores the piece's build rotation
      (`homeColliders` are in the local frame; the applied rotation is `object.rotation.y-homeAngle`).
      `toilet(1257,772,-Math.PI/2)` and `chChair(1310,338,-Math.PI/2)` therefore have transposed
      footprints (~2–15 cm). Use `makeRotationY(object.rotation.y)`.
- [ ] The bathroom `slide` door leaf contributes no `solid()` collider while every other leaf does
      (flush, hidden, reeded, entrance, balcony). Add the parked leaf, or state in a comment that it
      is intentionally non-blocking.
- [ ] `webglcontextlost` is unhandled although `webglcontextrestored` is; without
      `event.preventDefault()` in a lost handler the restore handler may never fire. Stop the loop
      and show a message.
- [ ] `resize()` ignores DPR changes (`setPixelRatio` only at startup) and divides by a possible
      zero `innerHeight`. Re-apply the capped DPR and guard zero dimensions.
- [ ] Touch pad only appears for `(pointer:coarse)`, so a touchscreen laptop with a mouse gets no
      pad and a "WASD" hint. Consider `(any-pointer:coarse)` or revealing the pad on first touch.
- [ ] Dead code: `rug`/`lamp`/`book`/`vase`/`chair`/`desk`/`bed` helpers referenced only by each
      other, an unused 512² `stoneTex`, unused `washer`/`drum` consts, and `dialog img`/`dialog a`
      CSS left from the removed plan dialog.
- [ ] Accessibility: `#loading` fades to `opacity:0` but stays in the accessibility tree with
      "Opening your new perspective…"; no `<noscript>`; `#hint` (10 px `#78816e` on `#edece5`) and
      `.eyebrow` are ≈3.4:1 contrast, below WCAG AA for small text.
- [ ] Mobile room navigation: at 844×390 only ~3 of 9 rooms show in an 84 px scroll box with
      `scrollbar-width:none` and no fade, and `updateRoom()` toggles `.active` without
      `scrollIntoView`. Add `scrollIntoView({block:'nearest',inline:'nearest'})` and/or a horizontal
      strip at short heights.
- [ ] Intro area stats overlap the model at 360×640 (`.area` blocks over the canvas). Add a
      translucent backing or move the model down at very short portrait heights.
- [ ] Saved layouts are absolute world metres under storage key `v1`. Two plan revisions have
      already landed, so a future rescale silently misplaces saved furniture. Store plan-space
      coordinates or bump the key when the plan changes.
- [ ] `apartment.meshes` returns `renderer.info.render.calls` (draw calls), not a mesh count.
      Rename it or add a real mesh count; `check-package.mjs` and `check.mjs` currently assert `>100`
      against it, which happens to be true for both meanings.
- [ ] Sanity-check the displayed floor areas (85.4 m² / 90.6 m²) after the daughter/kitchen polygon
      fix — the polygons changed by ~1.5 m², so confirm the numbers still read as intended.

## 3. Geometry and furniture models (Minor)

- [ ] `stool2.js` — all six `bumpScale: 0.00035` values are inert (three multiplies the sampled
      height by `bumpScale`; typical values are 0–1). The bump maps render but do nothing visible, and
      `check.mjs` only asserts a bump map exists. Either raise to ~0.02–0.2 and eyeball
      `artifacts/stool2.png`, or keep and comment that the value is inherited from the supplied
      `wooden_stool_3d_viewer.html`.
- [ ] `stool2.js` seat side walls take their UV from `(x,z)` only, so the 25 mm edge samples a single
      texel row and reads as a flat strip next to the grained apron. `stool.js` already solves this
      with a dedicated edge strip (`edgeQuad`); give ExtrudeGeometry group 1 its own strip UV.
- [ ] `stool2.js` one ±X leg pair is necessarily mirrored (BoxGeometry UV handedness), putting the BR
      leg's cap fingers ~4.5 mm out of register with its plunge fingers, and the comment claiming the
      top stripes align with +X overstates. Add a third cap variant or make the finger pattern
      symmetric.
- [ ] `wall-edges.js` `cornerSpan()` mixes units (plan px in, metres out), uses one global
      half-thickness instead of the owning wall's, `beside` ignores whether the corner belongs to
      that wall, and `.find` takes the first rather than the nearest opening. Harmless today; a trap
      for the next edit. Pass the wall's own half-thickness, pick the nearest collinear opening, and
      document the px-in/metres-out contract.
- [ ] `stool.js` texture loading has no `onError`, so a missing asset leaves a blank map and only a
      console error. Same for `app.js`'s `loader.load` calls. Add an error path / one-line
      "some textures unavailable" state.
- [ ] `stool2.js` generates six colour canvases plus six derived bump canvases (~33–44 MB of texture
      for a 35 cm stool) with `Math.random()`, so `artifacts/stool2.png` is not reproducible. The
      1536² seat canvas is ~4.4 px/mm for glue seams 0.34 mm wide. Consider 512², one shared noise
      pass, and a seeded PRNG.
- [ ] `stool2.js` seat notch uses `s = LEG_SIZE` exactly, so notch faces are coplanar with the leg
      faces (no artifact today because the faces are oppositely wound and occluded). Use
      `LEG_SIZE + 0.0005` like the 0.8 mm clearance in `stool.js`.

## 4. Browser check and packaging (Minor)

- [ ] `check.mjs` still carries implementation-derived constants (sill values `1.22`/`1.185`, stool
      `layoutId`, part counts 9/13, furniture count 14, indices `[11]`/`[3]`). They are change-detectors
      rather than requirement checks: prefer invariants (every piece fits; the bedroom desk is the
      piece whose collider touches that wall) or a documented inventory.
- [ ] No preflight message when the server is down: `page.goto` produces a raw
      `net::ERR_CONNECTION_REFUSED` after a long timeout. A quick fetch that says "Run `npm start`
      first" would make the failure self-explanatory.
- [ ] `check.mjs` does not clear `artifacts/` per run, so a failure before a given screenshot leaves
      the previous run's stale image for a human reviewer.
- [ ] `build-omnigate.ps1` writes `apt.zip` in place: a failure after `File.Create` leaves a corrupt
      archive. Write to a temp file and move into place. (`check-package.mjs` now validates the
      finished archive, so a corrupt zip fails the suite — this is about not leaving debris.)
- [ ] `package.json`: no `engines` field although `@playwright/test` 1.63.0 requires Node >= 20, no
      `"private": true`, and `name` is `play3js` rather than the product name.
- [ ] `index.html` still has a static "09" room-count label; `check.mjs` pins the room list and button
      count but not this label.
- [x] ~~Sleeps where an observable condition exists~~ — the initial 1200 ms, the 300 ms after
      `#light`, the 100 ms per room screenshot and the 300 ms after resize now wait on observable
      conditions. Remaining `waitForTimeout` calls assert "no frames for N ms" and are intentional.

## 5. Accepted residuals — do not "fix" without a reason

- **17 residual close corner pairs (≤1.18 cm).** They are genuine steps where a thick wall butts into
  a thinner one; the union outline really has both faces. Removing them means changing real wall
  thicknesses. Do not reintroduce the cosmetic thickness edits: one of them (the exterior wall at
  x=900 going 12 → 17 px) was proven to intrude 2.9 cm into the utility glazing, and the suite now
  catches it.
- **`plan.js` documents the two thickness rules** (same thickness along a wall line; a window's
  `depth` matches the run it interrupts; junction mismatches ≤1 px are inherent to a traced plan).
  Read that comment before touching `walls`/`windows`.
- **The two plan rasters stay in the repository** (`assets/plan.png`,
  `assets/plan-2026-10-07.jpg`) as trace references but are no longer shipped by either deployment.
  If one is reintroduced into the UI, add it back to `build-omnigate.ps1` **and** `.assetsignore` —
  `check-package.mjs` will fail until both agree.
- **`graphify update` skips `style.css`** ("no supported extension"), so CSS never enters the graph.
  Not a code defect; do not chase it as a graph bug.
- **The app needs the network** for Three.js from jsDelivr and the optional web fonts. Both packaging
  checks tolerate CDN failure and assert only local responses.

## 6. Notes for tomorrow

- Start with `npm start` in one terminal and `npm test` in another; the suite takes ~90 s and needs
  the server.
- The `check.mjs` hook block (`HOOKS_SOURCE`) binds to module-private names in `app.js` on purpose.
  If you rename one of those symbols, the suite fails with `check.mjs hooks are stale: <name>` —
  that is the intended behaviour, update the hook block.
- `apt.zip` is rebuilt by every `npm test`; it is git-ignored, leave it.
- `artifacts/` probes are disposable; delete them once the items above are closed.
