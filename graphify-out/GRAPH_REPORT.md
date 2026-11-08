# Graph Report - apt  (2026-11-09)

## Corpus Check
- 9 files · ~9,660 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 3, .css 1)

## Summary
- 383 nodes · 785 edges · 20 communities (16 shown, 4 thin omitted)
- Extraction: 92% EXTRACTED · 7% INFERRED · 1% AMBIGUOUS · INFERRED: 56 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fcc0367a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Living, Kitchen & Entrance Design
- 3D Scene Core (app.js)
- Bedroom Suite Renderings
- Furniture Geometry Builders
- Option F Plan (assets)
- Navigation & Furniture Editing
- Plan Data & Checks
- Seating & Mesh Helpers
- Daughter Room Design
- Cloudflare Workers Deployment (.assetsignore)
- Main Bedroom & Study Photos
- Utility Balcony (工作陽台)
- package.json
- Window Geometry from ref_photos
- Wood Textures & Stool Photos
- index.html App Shell
- createStool2
- Main Bathroom Photo
- 2026-10-28 Designer Update
- Favicon

## God Nodes (most connected - your core abstractions)
1. `Kitchen (廚房)` - 26 edges
2. `Living Room (客廳)` - 24 edges
3. `box()` - 22 edges
4. `Rendering 6 - Straight view to living room & kitchen` - 21 edges
5. `Main Bedroom (主臥室)` - 21 edges
6. `Daughter Room (女兒房)` - 21 edges
7. `Entrance (玄關)` - 20 edges
8. `Rendering 5 - Living room corner to dining & entrance` - 20 edges
9. `Apartment Floor Plan 2026-10-28` - 17 edges
10. `Rendering 3 - Kitchen view toward living room and entrance` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Apartment Floor Plan 2026-10-28` --references--> `Balcony`  [AMBIGUOUS]
  ref_photos/rendering-261028/apt-plan-261028.png → ref_photos/apt-plan-2026-10-07.jpg
- `Daughter Room Stool (createStool2, procedural wood)` --references--> `createStool2()`  [EXTRACTED]
  README.md → stool2.js
- `Arched white oak closet/entry portal` --semantically_similar_to--> `Curved ceiling soffit with LED`  [INFERRED] [semantically similar]
  ref_photos/rendering-8-straight view daughter room to the bed.jpg → ref_photos/rendering-3-view from kinchen to the angle of living room and entrance.jpg
- `Toilet door / glass partition opening` --conceptually_related_to--> `Guest Bathroom (客浴廁)`  [AMBIGUOUS]
  ref_photos/rendering-2-straight cross-section view from the living room to the wall containing shoes closets decorative light mirror toiled roor appliances closets refrigerator.jpg → ref_photos/apt-plan-2026-10-07.jpg
- `Study ceiling mirror strip reflecting marble side wall` --semantically_similar_to--> `Vertical study wall mirror reflecting study table`  [AMBIGUOUS] [semantically similar]
  ref_photos/rendering-261028/apt-rendering-20261028-p10-studyroom-view-from-inner-corner-to-table-and-room-entrance-there-is-mirror-on-the ceiling-reflecting-side-wall-near-table.jpg → ref_photos/rendering-261028/apt-rendering-20261028-p09-view-from-studyroom-table-to-the-main-bedroom-closet-onleft-bedroom-door-closed-studyroom-wall-vertical-mirror-onleft-reflecting-study-table.jpg

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

## Communities (20 total, 4 thin omitted)

### Community 0 - "Living, Kitchen & Entrance Design"
Cohesion: 0.10
Nodes (58): Ceiling access panel, Cellular (honeycomb) blinds, Curved ceiling soffit with LED, Dark wood/metal dining bench, Upholstered curved-back dining chairs, black frames, Dining table (dark metal frame, light stone top), Full-height entrance mirror, White boucle stool (+50 more)

### Community 1 - "3D Scene Core (app.js)"
Cohesion: 0.03
Nodes (52): architecture, camera, ceiling, colliders, drum, entryHatches, environment, fabricTex (+44 more)

### Community 2 - "Bedroom Suite Renderings"
Cohesion: 0.12
Nodes (46): Floating vanity with vertical slat fronts and green marble top, Main bathroom window (dark bronze sliding frame), Bedroom Wooden Desk with Chair and Round Walnut Nightstand, Flush hidden bedroom door within slat wall, Ceiling Access Hatch Panel, Study ceiling mirror strip reflecting marble side wall, Curved Sage-Green Ceiling Soffit with LED Cove Lighting, Curved Plaster Wall with Vertical LED Light Reveal (+38 more)

### Community 3 - "Furniture Geometry Builders"
Cohesion: 0.13
Nodes (21): bed(), book(), box(), bulkhead(), cabinet(), cubbies(), cyl(), desk() (+13 more)

### Community 4 - "Option F Plan (assets)"
Cohesion: 0.16
Nodes (20): Floor Plan (Option F), Floor Plan 2026-10-07 (photographed revision), Revised Main Bathroom (freestanding tub, shower, WC, vanity), Storage Cabinet (儲藏櫃) beside fridge, Window Width Annotations (W223, W222, W156.5, W155, W128, W104, W78), Daughter's Room (女兒房) 105x188cm bed, Dining Room (餐廳) 4-seat table, Entry Foyer (玄關) (+12 more)

### Community 5 - "Navigation & Furniture Editing"
Cohesion: 0.14
Nodes (19): canStand(), cleanView(), editMode(), endFurnitureDrag(), look(), move(), placeFurniture(), renderFrame() (+11 more)

### Community 6 - "Plan Data & Checks"
Cohesion: 0.20
Nodes (11): notched, square, CEILING, doors, outline, rooms, SCALE, walls (+3 more)

### Community 7 - "Seating & Mesh Helpers"
Cohesion: 0.26
Nodes (17): ball(), boucleChair(), chair(), chChair(), cornerLines, daughterStool, floor(), mesh() (+9 more)

### Community 8 - "Daughter Room Design"
Cohesion: 0.11
Nodes (31): Arched white oak closet/entry portal, Ceiling-hung wood shelves with clothing rail, Botanical leaf-branch wallpaper, Recessed linear LED ceiling lines, Round wood nightstand with lamp, Light wood single bed, White sliding wardrobe with curved edge, Vanity desk with round mirror (+23 more)

### Community 10 - "Main Bedroom & Study Photos"
Cohesion: 0.20
Nodes (14): Built-in low cabinet under window with plinth outlets, Polished light porcelain floor tiles with dark skirting, Photo: Main Bedroom Both Window Walls, Wall-mounted split AC unit (main bedroom), Ceiling dome light and smoke detector, Main bedroom corner window layout on two adjacent exterior walls, Main bedroom dark-framed door on side wall, Photo: Main Bedroom Window Wall (faces right on plan) (+6 more)

### Community 11 - "Utility Balcony (工作陽台)"
Cohesion: 0.20
Nodes (11): Dark framed glass door to utility balcony, Utility Balcony AC Outdoor Unit and Gas Water Heater, Balcony Door View from Kitchen (photo), Gas Cooktop, Built-in Oven and Range Hood, Dark Aluminium Glazed Door to Utility Balcony, White High-Gloss Kitchen Cabinets and Beige Wall Tiles, Photo: Utility Balcony from Door, Ceiling-hung clothes drying rail and exposed pipes (+3 more)

### Community 12 - "package.json"
Cohesion: 0.20
Nodes (10): description, devDependencies, @playwright/test@^1.63.0, name, scripts, start, test, type (+2 more)

### Community 14 - "Wood Textures & Stool Photos"
Cohesion: 0.25
Nodes (8): Wooden Stool Photo (side view), Solid Wood Square Stool (thick legs, apron, laminated end-grain leg caps), Wooden Stool Photo (top view), Stool Seat Top Texture (light beech/rubberwood, striped corner leg tops), Walnut Texture, Walnut Wood Veneer (medium brown vertical grain), White Oak Texture, Light Grey-washed White Oak (plank, likely flooring)

### Community 15 - "index.html App Shell"
Cohesion: 0.10
Nodes (18): AGENTS.md Agent Instructions, Furnished 3D Apartment Walkthrough (Three.js 0.185.0, jsDelivr, no build step), Dynamic app.js Loader with Error Fallback, Floor Area Stats (85.4 / 90.6 m2), Help Dialog, Three.js Import Map, Camera Mode Switch (3D Overview / Walk inside), index.html App Shell (+10 more)

### Community 17 - "createStool2"
Cohesion: 0.19
Nodes (10): Daughter Room Stool (createStool2, procedural wood), Study Stool (createStool, photo-textured), createStool2(), createApronWoodTexture(), createFingerJointCapTexture(), createLegPlainSideTexture(), createLegPlungeJointSideTexture(), createSeatTopTexture() (+2 more)

### Community 18 - "Main Bathroom Photo"
Cohesion: 0.40
Nodes (6): Photo: Main Bathroom Window, Built-in white drop-in bathtub under window with hand shower, Ceiling exhaust fan and access hatch, Dark grey large-format wall tiles, Corner glass shower enclosure with gold frame and rain/hand shower, Main bathroom black-framed sliding window with roller blind

## Ambiguous Edges - Review These
- `Toilet door / glass partition opening` → `Guest Bathroom (客浴廁)`  [AMBIGUOUS]
  ref_photos/rendering-2-straight cross-section view from the living room to the wall containing shoes closets decorative light mirror toiled roor appliances closets refrigerator.jpg · relation: conceptually_related_to
- `Guest Bathroom (客浴廁)` → `Rendering 2 - Cross-section: living room to entrance/fridge wall`  [AMBIGUOUS]
  ref_photos/rendering-2-straight cross-section view from the living room to the wall containing shoes closets decorative light mirror toiled roor appliances closets refrigerator.jpg · relation: references
- `Study ceiling mirror strip reflecting marble side wall` → `Vertical study wall mirror reflecting study table`  [AMBIGUOUS]
  ref_photos/rendering-261028/apt-rendering-20261028-p10-studyroom-view-from-inner-corner-to-table-and-room-entrance-there-is-mirror-on-the ceiling-reflecting-side-wall-near-table.jpg · relation: semantically_similar_to
- `Study Room (書房)` → `Rendering p03: Main Bedroom, Inner Corner to Entrance`  [AMBIGUOUS]
  ref_photos/rendering-261028/apt-rendering-20261028-p03-main-bedroom-vew-from-the-inner-corner-to-entrance-bed-is-blurred.jpg · relation: references
- `Apartment Floor Plan 2026-10-28` → `Balcony`  [AMBIGUOUS]
  ref_photos/rendering-261028/apt-plan-261028.png · relation: references
- `Living Room (客廳) with sofa and TV wall cabinet` → `Pale Leaf-Branch Wall Mural (champagne/beige wallpaper)`  [AMBIGUOUS]
  assets/tex-mural.jpg · relation: conceptually_related_to
- `Arched white oak closet/entry portal` → `White sliding wardrobe with curved edge`  [AMBIGUOUS]
  ref_photos/rendering-9-straight view daughter room from the window to the room entrance.jpg · relation: conceptually_related_to
- `Exterior Balcony / Louver Fins along East and South Facades` → `Balcony`  [AMBIGUOUS]
  ref_photos/apt-plan-2026-10-07.jpg · relation: conceptually_related_to

## Knowledge Gaps
- **48 isolated node(s):** `Storage Cabinet (儲藏櫃) and Fridge`, `Wall Intercom Panel`, `Woman seated on sofa (staging)`, `Wall-mounted split AC unit (main bedroom)`, `Ceiling dome light and smoke detector` (+43 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 125 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createStool()` connect `createStool2` to `3D Scene Core (app.js)`, `Seating & Mesh Helpers`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Kitchen (廚房)` (e.g. with `Rendering 1 - Entrance view from front door` and `Dark wood bench in kitchen corridor`) actually correct?**
  _`Kitchen (廚房)` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Storage Cabinet (儲藏櫃) and Fridge`, `Wall Intercom Panel`, `Woman seated on sofa (staging)` to the rest of the system?**
  _48 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Living, Kitchen & Entrance Design` be split into smaller, more focused modules?**
  _Cohesion score 0.09618874773139746 - nodes in this community are weakly interconnected._
- **Why does `Study Stool (createStool, photo-textured)` connect `createStool2` to `index.html App Shell`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Toilet door / glass partition opening` and `Guest Bathroom (客浴廁)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Guest Bathroom (客浴廁)` and `Rendering 2 - Cross-section: living room to entrance/fridge wall`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._