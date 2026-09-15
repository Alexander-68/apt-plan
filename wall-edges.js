// Corners of the union of axis-aligned wall footprints, including inside corners.
export function wallCorners(rectangles) {
  const xs=[...new Set(rectangles.flatMap(r=>[r[0],r[2]]))];
  const zs=[...new Set(rectangles.flatMap(r=>[r[1],r[3]]))];
  const corners=[];
  for(const x of xs)for(const z of zs) {
    const quadrants=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([dx,dz])=>
      rectangles.some(([x1,z1,x2,z2])=>x+dx*.001>x1&&x+dx*.001<x2&&z+dz*.001>z1&&z+dz*.001<z2));
    const count=quadrants.filter(Boolean).length;
    if(count===1||count===3)corners.push([x,z]);
  }
  return corners;
}

export function cornerSpan(x,z,doors,windows,halfThickness) {
  const beside=([x1,z1,x2,z2])=>z1===z2
    ? x>x1&&x<x2&&Math.abs(z-z1)<=halfThickness
    : z>z1&&z<z2&&Math.abs(x-x1)<=halfThickness;
  if(doors.some(beside))return [0,2.25];
  if(windows.some(beside))return [.48,2.25];
  return [0,2.8];
}
