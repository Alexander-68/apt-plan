# Graph Report - apt  (2026-11-14)

## Corpus Check
- 11 files · ~14,785 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 3, .css 1)

## Summary
- 435 nodes · 863 edges · 21 communities (16 shown, 5 thin omitted)
- Extraction: 92% EXTRACTED · 7% INFERRED · 1% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `63ae6ff4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Living, Kitchen & Entrance Design
- 3D Scene Core (app.js)
- Bedroom Suite Renderings
- Furniture Geometry Builders
- Option F Plan (assets)
- Navigation & Furniture Editing
- check.mjs
- Seating & Mesh Helpers
- Cloudflare Workers Deployment (.assetsignore)
- Main Bedroom & Study Photos
- Daughter Room (女兒房)
- package.json
- Window Geometry from ref_photos
- Wood Textures & Stool Photos
- index.html App Shell
- Photo: Utility Balcony from Door
- check-package.mjs
- Main Bathroom Photo
- createStool
- 2026-10-28 Designer Update
- Favicon

## God Nodes (most connected - your core abstractions)
1. `Kitchen (廚房)` - 26 edges
2. `Living Room (客廳)` - 24 edges
3. `Rendering 6 - Straight view to living room & kitchen` - 21 edges
4. `Daughter Room (女兒房)` - 21 edges
5. `Main Bedroom (主臥室)` - 21 edges
6. `Entrance (玄關)` - 20 edges
7. `Rendering 5 - Living room corner to dining & entrance` - 20 edges
8. `Apartment Floor Plan 2026-10-28` - 17 edges
9. `box()` - 16 edges
10. `Rendering 3 - Kitchen view toward living room and entrance` - 16 edges

## Surprising Connections (you probably didn't know these)
- `1. Open` --references--> `adaptPixelRatio()`  [INFERRED]
  TODO.md → app.js
- `Toilet door / glass partition opening` --conceptually_related_to--> `Guest Bathroom (客浴廁)`  [AMBIGUOUS]
  ref_photos/rendering-2-straight cross-section view from the living room to the wall containing shoes closets decorative light mirror toiled roor appliances closets refrigerator.jpg → ref_photos/apt-plan-2026-10-07.jpg
- `Apartment Floor Plan 2026-10-28` --references--> `Balcony`  [AMBIGUOUS]
  ref_photos/rendering-261028/apt-plan-261028.png → ref_photos/apt-plan-2026-10-07.jpg
- `How to verify (needed before any claim of "done")` --references--> `freeSpawn()`  [INFERRED]
  TODO.md → app.js
- `2. Accepted — do not "fix" without a reason` --references--> `resize()`  [INFERRED]
  TODO.md → app.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Apartment rooms in layout Option F** — assets_plan_entry_foyer, assets_plan_guest_bathroom, assets_plan_utility_balcony, assets_plan_kitchen, assets_plan_dining_room, assets_plan_living_room, assets_plan_daughter_room, assets_plan_study, assets_plan_main_bedroom, assets_plan_main_bathroom [EXTRACTED 1.00]
- **Daughter room furnishing set** — design_single_bed, design_vanity_desk, design_wishbone_chair, design_nightstand_lamp, design_leaf_wallpaper [EXTRACTED 1.00]
- **Dining set (table, bench, chairs)** — design_dining_table, design_dining_bench, design_dining_chairs [EXTRACTED 1.00]
- **Entrance composition: shoe closet, pendant niche, mirror, oval cove, stone floor** — design_shoe_closet, design_pendant_light, design_entrance_mirror, design_oval_ceiling_cove, design_stone_floor [EXTRACTED 1.00]
- **Kitchen run (stone backsplash, walnut grid cabinets, hood, base cabinets, sink, cooktop)** — design_kitchen_backsplash, design_kitchen_wall_cabinets, design_range_hood, design_kitchen_base_cabinets, design_kitchen_sink, design_induction_cooktop [EXTRACTED 1.00]
- **Main bathroom wet zone: tub, shower, window, green marble** — design_freestanding_bathtub, design_glass_shower, design_bathroom_window, design_green_marble [EXTRACTED 1.00]
- **Main bedroom suite: bedroom, study and main bathroom connected via sliding doors** — room_main_bedroom, room_study_room, room_main_bathroom, design_sliding_study_door, design_sliding_bathroom_door [EXTRACTED 1.00]
- **Main bedroom window treatments (adjustable shutters and cellular shades)** — design_plantation_shutters, design_window_shades, design_window_bench_cabinet, room_main_bedroom [EXTRACTED 1.00]
- **Main bedroom window walls photographed from three viewpoints** — ref_photos_main_bedroom_both_walls_windows, ref_photos_main_bedroom_windows_wall_facing_right_on_plan, ref_photos_main_bedroom_windows_wall_facing_up_on_plan, room_main_bedroom [EXTRACTED 1.00]
- **Main suite: bedroom connects to study and bathroom via sliding doors** — room_main_bedroom, room_study_room, room_main_bathroom, design_sliding_study_door, design_sliding_bathroom_door [EXTRACTED 1.00]
- **East facade window wall with exterior louvers (living, daughter, main bedroom)** — room_living_room, room_daughter_room, room_main_bedroom, ref_photos_apt_plan_2026_10_07_outdoor_louvers [INFERRED 0.75]
- **Continuous living-room wall: fridge cabinets, glass display, TV wall** — design_tall_storage_wall, design_refrigerator, design_glass_display_cabinet, design_tv_wall [INFERRED 0.85]
- **Main bedroom finish palette: curved green cove ceiling, slat walls, wood-veneer closet, oak floor** — design_curved_ceiling_cove, design_vertical_slat_wall, design_main_closet, design_light_oak_floor, design_curved_wall_led_reveal [INFERRED 0.85]
- **Material textures for 3D surfaces** — assets_tex_kitchen_stone, assets_tex_mural, assets_tex_walnut, assets_tex_whiteoak [INFERRED 0.85]
- **Shared dry-room finishes: light polished tiles, under-window cabinets, woven roller blinds** — polished_light_floor_tiles, builtin_underwindow_cabinet, woven_roller_blinds, room_main_bedroom, room_study_room [INFERRED 0.85]
- **Original glossy beige tile with dark skirting across photos** — ref_photos_living_room_windows, ref_photos_daughter_room_windows, ref_photos_entrance_door_vew_from_living_room, ref_photos_living_room_windows_floor_finish [INFERRED 0.85]
- **Wooden stool reference photos for 3D model** — assets_stool_frame, assets_stool_top, assets_stool_frame_solid_wood_stool [INFERRED 0.85]
- **Study workspace: desk, shelves, chair, marble wall, mirrors** — design_study_desk, design_study_shelves, design_study_chair, design_green_marble, design_ceiling_mirror, design_study_vertical_mirror [INFERRED 0.85]

## Communities (21 total, 5 thin omitted)

### Community 0 - "Living, Kitchen & Entrance Design"
Cohesion: 0.08
Nodes (64): Ceiling access panel, Cellular (honeycomb) blinds, Curved ceiling soffit with LED, Dark wood/metal dining bench, Upholstered curved-back dining chairs, black frames, Dining table (dark metal frame, light stone top), Full-height entrance mirror, White boucle stool (+56 more)

### Community 1 - "3D Scene Core (app.js)"
Cohesion: 0.03
Nodes (53): architecture, camera, ceiling, colliders, columnRects, drum, entryHatches, environment (+45 more)

### Community 2 - "Bedroom Suite Renderings"
Cohesion: 0.11
Nodes (48): Floating vanity with vertical slat fronts and green marble top, Main bathroom window (dark bronze sliding frame), Bedroom Wooden Desk with Chair and Round Walnut Nightstand, Flush hidden bedroom door within slat wall, Ceiling Access Hatch Panel, Study ceiling mirror strip reflecting marble side wall, Curved Sage-Green Ceiling Soffit with LED Cove Lighting, Curved Plaster Wall with Vertical LED Light Reveal (+40 more)

### Community 3 - "Furniture Geometry Builders"
Cohesion: 0.17
Nodes (16): ball(), box(), bulkhead(), cabinet(), cubbies(), cyl(), joinery(), led() (+8 more)

### Community 4 - "Option F Plan (assets)"
Cohesion: 0.16
Nodes (20): Floor Plan (Option F), Floor Plan 2026-10-07 (photographed revision), Revised Main Bathroom (freestanding tub, shower, WC, vanity), Storage Cabinet (儲藏櫃) beside fridge, Window Width Annotations (W223, W222, W156.5, W155, W128, W104, W78), Daughter's Room (女兒房) 105x188cm bed, Dining Room (餐廳) 4-seat table, Entry Foyer (玄關) (+12 more)

### Community 5 - "Navigation & Furniture Editing"
Cohesion: 0.18
Nodes (14): cleanView(), editMode(), endFurnitureDrag(), look(), material(), photo(), placeFurniture(), requestRender() (+6 more)

### Community 6 - "check.mjs"
Cohesion: 0.06
Nodes (37): adaptPixelRatio(), canStand(), cornerLines, freeSpawn(), move(), pixelRatio(), placementWalls, renderFrame() (+29 more)

### Community 7 - "Seating & Mesh Helpers"
Cohesion: 0.35
Nodes (12): boucleChair(), chChair(), daughterStool, floor(), movable(), openingLines, slabShape, solid() (+4 more)

### Community 10 - "Main Bedroom & Study Photos"
Cohesion: 0.20
Nodes (14): Built-in low cabinet under window with plinth outlets, Polished light porcelain floor tiles with dark skirting, Photo: Main Bedroom Both Window Walls, Wall-mounted split AC unit (main bedroom), Ceiling dome light and smoke detector, Main bedroom corner window layout on two adjacent exterior walls, Main bedroom dark-framed door on side wall, Photo: Main Bedroom Window Wall (faces right on plan) (+6 more)

### Community 11 - "Daughter Room (女兒房)"
Cohesion: 0.11
Nodes (30): Arched white oak closet/entry portal, Ceiling-hung wood shelves with clothing rail, Botanical leaf-branch wallpaper, Recessed linear LED ceiling lines, Round wood nightstand with lamp, Light wood single bed, White sliding wardrobe with curved edge, Vanity desk with round mirror (+22 more)

### Community 12 - "package.json"
Cohesion: 0.14
Nodes (14): description, devDependencies, @playwright/test@^1.63.0, engines, node, name, private, scripts (+6 more)

### Community 14 - "Wood Textures & Stool Photos"
Cohesion: 0.25
Nodes (8): Wooden Stool Photo (side view), Solid Wood Square Stool (thick legs, apron, laminated end-grain leg caps), Wooden Stool Photo (top view), Stool Seat Top Texture (light beech/rubberwood, striped corner leg tops), Walnut Texture, Walnut Wood Veneer (medium brown vertical grain), White Oak Texture, Light Grey-washed White Oak (plank, likely flooring)

### Community 15 - "index.html App Shell"
Cohesion: 0.08
Nodes (28): AGENTS.md Agent Instructions, Furnished 3D Apartment Walkthrough (Three.js 0.185.0, jsDelivr, no build step), Dynamic app.js Loader with Error Fallback, Floor Area Stats (85.4 / 90.6 m2), Help Dialog, Three.js Import Map, Camera Mode Switch (3D Overview / Walk inside), index.html App Shell (+20 more)

### Community 16 - "Photo: Utility Balcony from Door"
Cohesion: 0.50
Nodes (4): Photo: Utility Balcony from Door, Ceiling-hung clothes drying rail and exposed pipes, Laundry sink with wall tap and hose, Dark brick-tile parapet wall open to light well

### Community 17 - "check-package.mjs"
Cohesion: 0.13
Nodes (17): addAssetRef(), addModuleRef(), addRuntime(), buildScript, expectedAssets, expectedBundle, isExternal(), MIME (+9 more)

### Community 18 - "Main Bathroom Photo"
Cohesion: 0.40
Nodes (6): Photo: Main Bathroom Window, Built-in white drop-in bathtub under window with hand shower, Ceiling exhaust fan and access hatch, Dark grey large-format wall tiles, Corner glass shower enclosure with gold frame and rain/hand shower, Main bathroom black-framed sliding window with roller blind

## Ambiguous Edges - Review These
- `Toilet door / glass partition opening` → `Guest Bathroom (客浴廁)`  [AMBIGUOUS]
  ref_photos/rendering-2-straight cross-section view from the living room to the wall containing shoes closets decorative light mirror toiled roor appliances closets refrigerator.jpg · relation: conceptually_related_to
- `Guest Bathroom (客浴廁)` → `Rendering 2 - Cross-section: living room to entrance/fridge wall`  [AMBIGUOUS]
  ref_photos/rendering-2-straight cross-section view from the living room to the wall containing shoes closets decorative light mirror toiled roor appliances closets refrigerator.jpg · relation: references
- `Arched white oak closet/entry portal` → `White sliding wardrobe with curved edge`  [AMBIGUOUS]
  ref_photos/rendering-9-straight view daughter room from the window to the room entrance.jpg · relation: conceptually_related_to
- `Study ceiling mirror strip reflecting marble side wall` → `Vertical study wall mirror reflecting study table`  [AMBIGUOUS]
  ref_photos/rendering-261028/apt-rendering-20261028-p10-studyroom-view-from-inner-corner-to-table-and-room-entrance-there-is-mirror-on-the ceiling-reflecting-side-wall-near-table.jpg · relation: semantically_similar_to
- `Balcony` → `Exterior Balcony / Louver Fins along East and South Facades`  [AMBIGUOUS]
  ref_photos/apt-plan-2026-10-07.jpg · relation: conceptually_related_to
- `Balcony` → `Apartment Floor Plan 2026-10-28`  [AMBIGUOUS]
  ref_photos/rendering-261028/apt-plan-261028.png · relation: references
- `Study Room (書房)` → `Rendering p03: Main Bedroom, Inner Corner to Entrance`  [AMBIGUOUS]
  ref_photos/rendering-261028/apt-rendering-20261028-p03-main-bedroom-vew-from-the-inner-corner-to-entrance-bed-is-blurred.jpg · relation: references
- `Living Room (客廳) with sofa and TV wall cabinet` → `Pale Leaf-Branch Wall Mural (champagne/beige wallpaper)`  [AMBIGUOUS]
  assets/tex-mural.jpg · relation: conceptually_related_to

## Knowledge Gaps
- **48 isolated node(s):** `Storage Cabinet (儲藏櫃) and Fridge`, `Utility Balcony AC Outdoor Unit and Gas Water Heater`, `White High-Gloss Kitchen Cabinets and Beige Wall Tiles`, `Wall Intercom Panel`, `Woman seated on sofa (staging)` (+43 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 158 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createStool()` connect `createStool` to `3D Scene Core (app.js)`, `index.html App Shell`, `Seating & Mesh Helpers`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Kitchen (廚房)` (e.g. with `Rendering 1 - Entrance view from front door` and `Dark wood bench in kitchen corridor`) actually correct?**
  _`Kitchen (廚房)` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Storage Cabinet (儲藏櫃) and Fridge`, `Utility Balcony AC Outdoor Unit and Gas Water Heater`, `White High-Gloss Kitchen Cabinets and Beige Wall Tiles` to the rest of the system?**
  _48 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Living, Kitchen & Entrance Design` be split into smaller, more focused modules?**
  _Cohesion score 0.08432539682539683 - nodes in this community are weakly interconnected._
- **Why does `@playwright/test` connect `package.json` to `check-package.mjs`, `check.mjs`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Toilet door / glass partition opening` and `Guest Bathroom (客浴廁)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Guest Bathroom (客浴廁)` and `Rendering 2 - Cross-section: living room to entrance/fridge wall`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._