import * as THREE from 'three';

// Extracted from wooden_stool_3d_viewer.html: original geometry and procedural wood.
// Metres, assembled at floor level; viewer UI, lighting and animation are omitted.
export function createStool2() {
  // Generates a normal/bump map directly from a canvas's brightness channel
  function generateBumpTexture(sourceCanvas) {
      const w = sourceCanvas.width;
      const h = sourceCanvas.height;
      const srcCtx = sourceCanvas.getContext('2d');
      const srcData = srcCtx.getImageData(0, 0, w, h).data;

      const bumpCanvas = document.createElement('canvas');
      bumpCanvas.width = w;
      bumpCanvas.height = h;
      const bumpCtx = bumpCanvas.getContext('2d');
      const bumpImg = bumpCtx.createImageData(w, h);
      const dst = bumpImg.data;

      for (let i = 0; i < srcData.length; i += 4) {
          const lum = (srcData[i] * 0.299 + srcData[i + 1] * 0.587 + srcData[i + 2] * 0.114);
          dst[i] = lum;
          dst[i + 1] = lum;
          dst[i + 2] = lum;
          dst[i + 3] = 255;
      }
      bumpCtx.putImageData(bumpImg, 0, 0);
      return new THREE.CanvasTexture(bumpCanvas);
  }

  // 1. Seat Top Texture: 5 edge-glued vertical planks matching IMG_5722
  function createSeatTopTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 1536;
      canvas.height = 1536;
      const ctx = canvas.getContext('2d');

      // Richer warm honey amber base tone (darker than pale blonde)
      ctx.fillStyle = '#c7965f';
      ctx.fillRect(0, 0, 1536, 1536);

      // 5 laminated staves with individual subtle tonality & warmth (see IMG_5722)
      const plankWidth = 1536 / 5;
      const staveTints = [
          'rgba(182, 134, 82, 0.32)', // Plank 1 (left)
          'rgba(218, 175, 126, 0.35)', // Plank 2 (center-left with flame)
          'rgba(196, 152, 100, 0.28)', // Plank 3 (middle)
          'rgba(208, 166, 116, 0.30)', // Plank 4
          'rgba(186, 138, 86, 0.32)'  // Plank 5 (right)
      ];

      for (let p = 0; p < 5; p++) {
          ctx.fillStyle = staveTints[p];
          ctx.fillRect(p * plankWidth, 0, plankWidth, 1536);
      }

      // Organic wood grain fibers and cathedral arch loops (Flame grain on plank 2 & 3)
      for (let y = 0; y < 1536; y += 2) {
          for (let x = 0; x < 1536; x += 3) {
              const staveIdx = Math.floor(x / plankWidth);
              const staveX = (x % plankWidth) / plankWidth;

              // Cathedral flame arch distortion for plank 2 (matching IMG_5722)
              let waveOffset = Math.sin(y * 0.008) * 18 + Math.cos(y * 0.02) * 6;
              if (staveIdx === 1) {
                  const dy = (y - 500) / 450;
                  const flame = Math.exp(-dy * dy) * Math.sin(staveX * Math.PI) * 45;
                  waveOffset += flame;
              }

              const grainVal = Math.sin((x + waveOffset) * 0.08 + Math.sin(y * 0.004) * 4);
              if (grainVal > 0.65) {
                  ctx.fillStyle = `rgba(132, 82, 38, ${0.05 + (grainVal - 0.65) * 0.16})`;
                  ctx.fillRect(x, y, 2.5, 3.5);
              }
          }
      }

      // Characteristic Rubberwood Vascular Pores (fine dark dashes aligned with grain)
      for (let i = 0; i < 9000; i++) {
          const px = Math.random() * 1536;
          const py = Math.random() * 1536;
          const len = 4 + Math.random() * 9;
          const width = 0.9 + Math.random() * 1.1;
          const alpha = 0.10 + Math.random() * 0.22;

          ctx.fillStyle = `rgba(85, 48, 18, ${alpha})`;
          ctx.fillRect(px, py, width, len);

          // Adjacent faint highlight pore rim for natural depth
          ctx.fillStyle = `rgba(255, 235, 210, ${alpha * 0.4})`;
          ctx.fillRect(px + 0.8, py + 1, 0.7, len * 0.7);
      }

      // Fine glued seam lines between staves with micro-bevel shading
      for (let p = 1; p < 5; p++) {
          const sx = p * plankWidth;
          // Dark glue seam
          ctx.fillStyle = 'rgba(70, 36, 12, 0.45)';
          ctx.fillRect(sx - 1, 0, 1.5, 1536);
          // Light contact reflection on adjacent edge
          ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
          ctx.fillRect(sx + 0.8, 0, 1, 1536);
      }

      const texture = new THREE.CanvasTexture(canvas);
      const bumpTexture = generateBumpTexture(canvas);
      return { texture, bumpTexture };
  }

  // 2. Apron Wood Texture: Horizontal grain matching IMG_5720 & IMG_5721
  function createApronWoodTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      // Warm golden-amber base gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#cba06b');
      grad.addColorStop(0.5, '#be8f56');
      grad.addColorStop(1, '#b4824a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 256);

      // Horizontal long grain fibers and natural wavy figure
      for (let y = 0; y < 256; y += 2) {
          for (let x = 0; x < 1024; x += 4) {
              const wave = Math.sin(x * 0.012) * 10 + Math.cos(x * 0.003) * 6;
              const grainVal = Math.sin((y + wave) * 0.12 + Math.sin(x * 0.005) * 3);
              if (grainVal > 0.6) {
                  ctx.fillStyle = `rgba(130, 80, 36, ${0.05 + (grainVal - 0.6) * 0.14})`;
                  ctx.fillRect(x, y, 4, 2);
              }
          }
      }

      // Horizontal rubberwood vascular pores
      for (let i = 0; i < 4000; i++) {
          const px = Math.random() * 1024;
          const py = Math.random() * 256;
          const len = 6 + Math.random() * 14;
          const h = 0.9 + Math.random() * 1.0;
          const alpha = 0.09 + Math.random() * 0.18;

          ctx.fillStyle = `rgba(88, 48, 20, ${alpha})`;
          ctx.fillRect(px, py, len, h);

          // Micro highlight rim
          ctx.fillStyle = `rgba(255, 235, 210, ${alpha * 0.4})`;
          ctx.fillRect(px + 1, py + 0.7, len * 0.6, 0.6);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      const bumpTexture = generateBumpTexture(canvas);
      return { texture, bumpTexture };
  }

  // 3. Leg Cap Texture: 3 warm-amber through-joint fingers alternating with 4 blonde wood sections
  function createFingerJointCapTexture(isRotated = false) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Darker warm honey wood base
      ctx.fillStyle = '#c79762';
      ctx.fillRect(0, 0, 512, 512);

      // 7 bands: 4 warm wood gaps, 3 dark amber through-joint fingers
      const bands = [
          { type: 'light', w: 64 },
          { type: 'dark',  w: 76 }, // Finger 1
          { type: 'light', w: 58 },
          { type: 'dark',  w: 76 }, // Finger 2
          { type: 'light', w: 58 },
          { type: 'dark',  w: 76 }, // Finger 3
          { type: 'light', w: 104 }
      ];

      let currentX = 0;
      bands.forEach(b => {
          if (b.type === 'dark') {
              // Rich amber-caramel end-grain finger (kept unchanged)
              const grad = ctx.createLinearGradient(currentX, 0, currentX + b.w, 0);
              grad.addColorStop(0, '#be844d');
              grad.addColorStop(0.5, '#b47740');
              grad.addColorStop(1, '#be864e');
              ctx.fillStyle = grad;
              ctx.fillRect(currentX, 0, b.w, 512);

              // Subtle end-grain annular ring curvature
              ctx.strokeStyle = 'rgba(92, 48, 18, 0.22)';
              ctx.lineWidth = 2.0;
              for (let r = 40; r < 500; r += 32) {
                  ctx.beginPath();
                  ctx.arc(currentX + b.w * 0.5, 256, r, -Math.PI / 2, Math.PI / 2);
                  ctx.stroke();
              }

              // Dense porous end-grain stippling
              ctx.fillStyle = 'rgba(88, 44, 16, 0.25)';
              for (let s = 0; s < 500; s++) {
                  const sx = currentX + Math.random() * b.w;
                  const sy = Math.random() * 512;
                  ctx.fillRect(sx, sy, 1.3, 1.3);
              }
          } else {
              // Matching warm honey wood end-grain
              const grad = ctx.createLinearGradient(currentX, 0, currentX + b.w, 0);
              grad.addColorStop(0, '#c79864');
              grad.addColorStop(0.5, '#d2a472');
              grad.addColorStop(1, '#c5945e');
              ctx.fillStyle = grad;
              ctx.fillRect(currentX, 0, b.w, 512);

              // Soft ring arcs
              ctx.strokeStyle = 'rgba(255, 240, 220, 0.22)';
              ctx.lineWidth = 1.6;
              for (let r = 50; r < 500; r += 36) {
                  ctx.beginPath();
                  ctx.arc(currentX + b.w * 0.5, 256, r, -Math.PI / 2, Math.PI / 2);
                  ctx.stroke();
              }

              ctx.fillStyle = 'rgba(110, 65, 28, 0.16)';
              for (let s = 0; s < 250; s++) {
                  const sx = currentX + Math.random() * b.w;
                  const sy = Math.random() * 512;
                  ctx.fillRect(sx, sy, 1.2, 1.2);
              }
          }

          // Seam divider line with micro-bevel highlight
          if (currentX > 0) {
              ctx.fillStyle = 'rgba(60, 26, 8, 0.72)';
              ctx.fillRect(currentX - 1.2, 0, 2.4, 512);

              ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
              ctx.fillRect(currentX + 1.2, 0, 1.0, 512);
          }

          currentX += b.w;
      });

      // Soft outer chamfer perimeter vignette
      ctx.fillStyle = 'rgba(65, 35, 12, 0.18)';
      ctx.fillRect(0, 0, 512, 3);
      ctx.fillRect(0, 509, 512, 3);
      ctx.fillRect(0, 0, 3, 512);
      ctx.fillRect(509, 0, 3, 512);

      if (isRotated) {
          const rotCanvas = document.createElement('canvas');
          rotCanvas.width = 512;
          rotCanvas.height = 512;
          const rotCtx = rotCanvas.getContext('2d');
          rotCtx.translate(256, 256);
          rotCtx.rotate(Math.PI / 2);
          rotCtx.drawImage(canvas, -256, -256);
          return {
              texture: new THREE.CanvasTexture(rotCanvas),
              bumpTexture: generateBumpTexture(rotCanvas)
          };
      }

      return {
          texture: new THREE.CanvasTexture(canvas),
          bumpTexture: generateBumpTexture(canvas)
      };
  }

  // 4. Leg Outer Side Texture: 3 dark vertical fingers plunging down 4.5 cm from the top edge
  function createLegPlungeJointSideTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      // Darker warm honey wood post
      ctx.fillStyle = '#c79762';
      ctx.fillRect(0, 0, 512, 1024);

      // Continuous vertical wood grain fibers down the entire leg
      for (let y = 0; y < 1024; y += 3) {
          for (let x = 0; x < 512; x += 3) {
              const grain = Math.sin(x * 0.08 + Math.sin(y * 0.005) * 4);
              if (grain > 0.58) {
                  ctx.fillStyle = `rgba(130, 80, 38, ${0.04 + (grain - 0.58) * 0.13})`;
                  ctx.fillRect(x, y, 2.5, 4);
              }
          }
      }

      // Characteristic rubberwood vascular pores
      for (let i = 0; i < 4500; i++) {
          const px = Math.random() * 512;
          const py = Math.random() * 1024;
          const len = 5 + Math.random() * 11;
          ctx.fillStyle = `rgba(88, 48, 20, ${0.09 + Math.random() * 0.18})`;
          ctx.fillRect(px, py, 1.1, len);
      }

      // Plunging 3 finger tenons extending down from top edge (top 10% = 4.5 cm in real scale)
      const jointDepth = 108; // pixels (~4.5 cm)
      const bands = [
          { type: 'light', w: 64 },
          { type: 'dark',  w: 76 }, // Finger 1
          { type: 'light', w: 58 },
          { type: 'dark',  w: 76 }, // Finger 2
          { type: 'light', w: 58 },
          { type: 'dark',  w: 76 }, // Finger 3
          { type: 'light', w: 104 }
      ];

      let currentX = 0;
      bands.forEach(b => {
          if (b.type === 'dark') {
              // Dark amber vertical tenon body (kept unchanged)
              const grad = ctx.createLinearGradient(currentX, 0, currentX + b.w, 0);
              grad.addColorStop(0, '#ba7f47');
              grad.addColorStop(0.5, '#af733c');
              grad.addColorStop(1, '#ba8049');
              ctx.fillStyle = grad;
              ctx.fillRect(currentX, 0, b.w, jointDepth);

              // Vertical grain inside the tenon
              for (let y = 0; y < jointDepth; y += 2) {
                  for (let x = currentX; x < currentX + b.w; x += 2) {
                      const val = Math.sin(x * 0.25 + y * 0.05);
                      if (val > 0.6) {
                          ctx.fillStyle = 'rgba(75, 38, 15, 0.14)';
                          ctx.fillRect(x, y, 1.5, 2.5);
                      }
                  }
              }

              // Bottom square termination seam
              ctx.fillStyle = 'rgba(50, 22, 6, 0.75)';
              ctx.fillRect(currentX, jointDepth - 1.5, b.w, 2.5);

              ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
              ctx.fillRect(currentX, jointDepth + 1.2, b.w, 1.2);
          }

          // Vertical side seam lines for each finger
          if (currentX > 0) {
              ctx.fillStyle = 'rgba(55, 24, 7, 0.7)';
              ctx.fillRect(currentX - 1.0, 0, 2.0, jointDepth);

              ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
              ctx.fillRect(currentX + 1.0, 0, 0.9, jointDepth);
          }

          currentX += b.w;
      });

      const texture = new THREE.CanvasTexture(canvas);
      const bumpTexture = generateBumpTexture(canvas);
      return { texture, bumpTexture };
  }

  // 5. Plain Leg Side Texture (faces without joint fingers)
  function createLegPlainSideTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#c79762';
      ctx.fillRect(0, 0, 512, 1024);

      for (let y = 0; y < 1024; y += 3) {
          for (let x = 0; x < 512; x += 3) {
              const grain = Math.sin(x * 0.08 + Math.sin(y * 0.005) * 4);
              if (grain > 0.58) {
                  ctx.fillStyle = `rgba(130, 80, 38, ${0.04 + (grain - 0.58) * 0.13})`;
                  ctx.fillRect(x, y, 2.5, 4);
              }
          }
      }

      for (let i = 0; i < 4500; i++) {
          const px = Math.random() * 512;
          const py = Math.random() * 1024;
          const len = 5 + Math.random() * 11;
          ctx.fillStyle = `rgba(88, 48, 20, ${0.09 + Math.random() * 0.18})`;
          ctx.fillRect(px, py, 1.1, len);
      }

      const texture = new THREE.CanvasTexture(canvas);
      const bumpTexture = generateBumpTexture(canvas);
      return { texture, bumpTexture };
  }

  // Generate all textures and bump maps
  const seatRes = createSeatTopTexture();
  const apronRes = createApronWoodTexture();
  const capResA = createFingerJointCapTexture(false); // standard orientation
  const capResB = createFingerJointCapTexture(true);  // 90 deg rotated
  const plungeRes = createLegPlungeJointSideTexture();
  const plainLegRes = createLegPlainSideTexture();

  // Canvas colors are sRGB; bump maps remain linear in the current Three.js renderer.
  for (const result of [seatRes, apronRes, capResA, capResB, plungeRes, plainLegRes]) {
      result.texture.colorSpace = THREE.SRGBColorSpace;
      result.texture.anisotropy = 8;
  }

  // PBR Materials calibrated for the smooth semi-gloss clear coat lacquer in the photos
  const seatMaterial = new THREE.MeshStandardMaterial({
      map: seatRes.texture,
      bumpMap: seatRes.bumpTexture,
      bumpScale: 0.00035,
      roughness: 0.26,
      metalness: 0.01
  });

  const apronMaterial = new THREE.MeshStandardMaterial({
      map: apronRes.texture,
      bumpMap: apronRes.bumpTexture,
      bumpScale: 0.00035,
      roughness: 0.28,
      metalness: 0.01
  });

  const topJointMaterialA = new THREE.MeshStandardMaterial({
      map: capResA.texture,
      bumpMap: capResA.bumpTexture,
      bumpScale: 0.00045,
      roughness: 0.28,
      metalness: 0.01
  });

  const topJointMaterialB = new THREE.MeshStandardMaterial({
      map: capResB.texture,
      bumpMap: capResB.bumpTexture,
      bumpScale: 0.00045,
      roughness: 0.28,
      metalness: 0.01
  });

  const plungeSideMaterial = new THREE.MeshStandardMaterial({
      map: plungeRes.texture,
      bumpMap: plungeRes.bumpTexture,
      bumpScale: 0.00035,
      roughness: 0.27,
      metalness: 0.01
  });

  const plainLegMaterial = new THREE.MeshStandardMaterial({
      map: plainLegRes.texture,
      bumpMap: plainLegRes.bumpTexture,
      bumpScale: 0.00035,
      roughness: 0.27,
      metalness: 0.01
  });

  // Build Stool Model to exact dimensions: 35 x 35 cm top, 45 cm height
  const stoolGroup = new THREE.Group();
  stoolGroup.name = 'stool2';

  const STOOL_W = 0.35;
  const STOOL_D = 0.35;
  const STOOL_H = 0.45;
  const LEG_SIZE = 0.058;    // 5.8 cm square solid legs
  const SEAT_THICK = 0.025;  // 2.5 cm thick seat plank
  const APRON_H = 0.07;      // 7 cm high under-seat support apron
  const APRON_T = 0.02;      // 2 cm thick aprons



  const halfW = STOOL_W / 2;
  const halfD = STOOL_D / 2;
  const halfLeg = LEG_SIZE / 2;
  const legOffset = halfW - halfLeg;

  const legGeometry = new THREE.BoxGeometry(LEG_SIZE, STOOL_H, LEG_SIZE);

  // Configure each corner leg so the 3 top stripes point directly to the face where the fingers plunge down
  // topJointMaterialB: stripes run across along X, meeting the ±X side faces
  // topJointMaterialA: stripes run front-to-back along Z, meeting the ±Z front/back faces
  // Materials order: [+X, -X, +Y(top), -Y, +Z, -Z]
  const legConfigs = [
      {
          id: 'FL', // Front-Left: fingers plunge down left (-X) face; top stripes run along X to meet and align with them
          x: -legOffset, z: legOffset,
          mats: [plainLegMaterial, plungeSideMaterial, topJointMaterialB, plainLegMaterial, plainLegMaterial, plainLegMaterial]
      },
      {
          id: 'FR', // Front-Right: fingers plunge down front (+Z) face; top stripes run along Z to meet and align with them
          x: legOffset, z: legOffset,
          mats: [plainLegMaterial, plainLegMaterial, topJointMaterialA, plainLegMaterial, plungeSideMaterial, plainLegMaterial]
      },
      {
          id: 'BL', // Back-Left: fingers plunge down left (-X) face; top stripes align with -X
          x: -legOffset, z: -legOffset,
          mats: [plainLegMaterial, plungeSideMaterial, topJointMaterialB, plainLegMaterial, plainLegMaterial, plainLegMaterial]
      },
      {
          id: 'BR', // Back-Right: fingers plunge down right (+X) face; top stripes align with +X
          x: legOffset, z: -legOffset,
          mats: [plungeSideMaterial, plainLegMaterial, topJointMaterialB, plainLegMaterial, plainLegMaterial, plainLegMaterial]
      }
  ];

  legConfigs.forEach((cfg) => {
      const legMesh = new THREE.Mesh(legGeometry, cfg.mats);
      legMesh.position.set(cfg.x, STOOL_H / 2, cfg.z);
      legMesh.castShadow = true;
      legMesh.receiveShadow = true;
      stoolGroup.add(legMesh);
  });

  // 2. SEAT TOP (Notched 2D profile extruded; flat top coplanar with leg tops at exactly y = STOOL_H)
  const seatShape = new THREE.Shape();
  const w = halfW;
  const s = LEG_SIZE;

  // Clockwise notch profile fitting snugly around the 4 corner leg posts
  seatShape.moveTo(-w + s, -w);
  seatShape.lineTo( w - s, -w);
  seatShape.lineTo( w - s, -w + s);
  seatShape.lineTo( w,     -w + s);
  seatShape.lineTo( w,      w - s);
  seatShape.lineTo( w - s,  w - s);
  seatShape.lineTo( w - s,  w);
  seatShape.lineTo(-w + s,  w);
  seatShape.lineTo(-w + s,  w - s);
  seatShape.lineTo(-w,      w - s);
  seatShape.lineTo(-w,     -w + s);
  seatShape.lineTo(-w + s, -w + s);
  seatShape.closePath();

  const extrudeSettings = {
      depth: SEAT_THICK,
      bevelEnabled: false, // Flat and level top surface
      steps: 1
  };

  const seatGeometry = new THREE.ExtrudeGeometry(seatShape, extrudeSettings);
  seatGeometry.rotateX(-Math.PI / 2);
  // ExtrudeGeometry defaults to world-space UVs; fit the complete grain across the seat.
  const { position, uv } = seatGeometry.attributes;
  for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (position.getX(i) + halfW) / STOOL_W, (position.getZ(i) + halfD) / STOOL_D);
  }

  const seatMesh = new THREE.Mesh(seatGeometry, seatMaterial);
  seatMesh.position.set(0, STOOL_H - SEAT_THICK, 0);
  seatMesh.castShadow = true;
  seatMesh.receiveShadow = true;
  stoolGroup.add(seatMesh);

  // 3. FOUR SUPPORT APRONS (Using horizontal grain material)
  const apronLength = STOOL_W - (LEG_SIZE * 2) + 0.004;
  const apronY = STOOL_H - SEAT_THICK - (APRON_H / 2);
  const apronZOffset = halfD - (LEG_SIZE / 2);

  const apronGeoX = new THREE.BoxGeometry(apronLength, APRON_H, APRON_T);
  const apronGeoZ = new THREE.BoxGeometry(APRON_T, APRON_H, apronLength);

  const aprons = [
      { geo: apronGeoX, pos: new THREE.Vector3(0, apronY, apronZOffset) },
      { geo: apronGeoX, pos: new THREE.Vector3(0, apronY, -apronZOffset) },
      { geo: apronGeoZ, pos: new THREE.Vector3(-apronZOffset, apronY, 0) },
      { geo: apronGeoZ, pos: new THREE.Vector3( apronZOffset, apronY, 0) }
  ];

  aprons.forEach(a => {
      const mesh = new THREE.Mesh(a.geo, apronMaterial);
      mesh.position.copy(a.pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      stoolGroup.add(mesh);
  });

  // 4. Subtle Inner Corner Brackets (Structural realism underneath)
  const bracketGeo = new THREE.BoxGeometry(0.04, 0.015, 0.04);
  const bracketY = STOOL_H - SEAT_THICK - 0.01;
  const bOffset = legOffset - 0.025;
  const bracketCorners = [
      [-bOffset, -bOffset],
      [ bOffset, -bOffset],
      [-bOffset,  bOffset],
      [ bOffset,  bOffset]
  ];

  bracketCorners.forEach(([bx, bz]) => {
      const bMesh = new THREE.Mesh(bracketGeo, seatMaterial);
      bMesh.position.set(bx, bracketY, bz);
      bMesh.rotation.y = Math.PI / 4;
      bMesh.castShadow = true;
      stoolGroup.add(bMesh);
  });
  return stoolGroup;
}
