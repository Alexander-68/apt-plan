// Coordinates trace assets/plan.png. The labeled 188 cm bed is approximately 160 px long.
export const SCALE = 1.88 / 160;
// Plan-pixel origin, exported so metre-to-plan inverses are never hand-written in consumers.
export const ORIGIN_X = 850, ORIGIN_Z = 650;
export const X = x => (x - ORIGIN_X) * SCALE;
export const Z = z => (z - ORIGIN_Z) * SCALE;
// Inverse of X/Z: metres back to plan pixels.
export const unX = m => m / SCALE + ORIGIN_X;
export const unZ = m => m / SCALE + ORIGIN_Z;
// Finished ceiling from the 2026-10-07 renderings; built-ins stop at 2.35 m below a bulkhead.
export const CEILING = 2.65;
export const outline = [[520,270],[1390,270],[1390,640],[1440,640],[1440,875],[970,875],[970,940],[900,940],[900,1095],[380,1095],[380,935],[270,935],[270,750],[520,750]];
export const rooms = [
  {id:'living',name:'Living & dining',cn:'客廳 / 餐廳',point:[660,580],look:[775,380],poly:[[525,275],[820,275],[820,935],[630,935],[630,865],[460,865],[460,755],[525,755]],floor:'oak'},
  {id:'entry',name:'Entrance',cn:'玄關',point:[405,820],look:[660,700],poly:[[275,755],[460,755],[460,870],[565,870],[565,935],[275,935]],floor:'stone'},
  {id:'daughter',name:'Daughter’s room',cn:'女兒房',point:[870,440],look:[990,370],poly:[[825,275],[1080,275],[1080,555],[905,555],[905,585],[825,585]],floor:'oak'},
  {id:'master',name:'Main bedroom',cn:'主臥室',point:[1165,440],look:[1390,440],poly:[[1085,275],[1385,275],[1385,634],[1219,634],[1219,646],[1085,646]],floor:'oak'},
  {id:'study',name:'Study',cn:'書房',point:[1090,770],look:[1219,720],poly:[[1010,658],[1219,658],[1219,870],[1010,870]],floor:'oak'},
  {id:'kitchen',name:'Kitchen',cn:'廚房',point:[850,790],look:[925,790],poly:[[825,585],[905,585],[905,555],[1080,555],[1080,640],[1010,640],[1010,870],[960,870],[960,935],[825,935]],floor:'oak'},
  {id:'bath',name:'Main bathroom',cn:'主臥浴間',point:[1306,755],look:[1390,710],poly:[[1230,645],[1435,645],[1435,870],[1230,870]],floor:'marble'},
  {id:'guest',name:'Guest bathroom',cn:'客浴間',point:[595,980],look:[490,1055],poly:[[385,940],[570,940],[570,868],[630,868],[630,1090],[385,1090]],floor:'tile'},
  {id:'utility',name:'Utility balcony',cn:'工作陽台',point:[780,1000],look:[675,1025],poly:[[645,940],[895,940],[895,1090],[645,1090]],floor:'tile'},
];
// Solid wall runs, with gaps for doors and glazing. Walk-through openings have lintels.
// Thickness is in plan px. Two rules keep the joined corner lines clean, because app.js extends
// each wall end by half its own thickness and draws one seam per derived corner:
//   1. every run on one wall line shares a thickness, and each window's `depth` matches the run
//      it interrupts (otherwise the sill and the wall faces split into parallel double lines);
//   2. walls meeting end-to-end at a junction use the same thickness where the mismatch would
//      exceed 1 px. Below that a step is inherent to a traced plan, not a defect.
export const walls = [
 [520,270,520,750,18],[270,750,520,750,17],[270,750,270,786,16],[270,866,270,935,16],
 [270,935,570,935,18],[380,935,380,1095,17],[380,1095,570,1095,17],[630,1095,640,1095,17],
 [640,935,640,1095,18],[630,935,818,935,16],[900,935,970,935,17],
 [970,875,970,935,16],[900,935,900,1095,12],[970,875,1030,875,18],[1195,875,1440,875,18],
 [1440,640,1440,655,17],[1440,770,1440,875,17],[1390,270,1390,300,14],[1390,601,1390,640,14],
 [520,270,540,270,16],[800,270,862,270,16],[1042,270,1105,270,16],[1372,270,1390,270,16],
 [640,1095,650,1095,17],[894,1095,900,1095,17],
 [820,270,820,585,12],[905,555,1080,555,12],[905,555,905,585,12],
 [1080,270,1080,555,12],[1080,555,1080,574,12],
 // 2026-10-28 plan: bedroom vestibule; study entrance moves south of the bath wall line.
 [1225,640,1290,640,12],[1350,640,1440,640,12],[1080,640,1080,652,12],[1010,646,1080,646,12],
 [1225,640,1225,875,12],[900,640,1010,640,10],[960,640,960,875,10],
 [460,870,570,870,12],[570,870,570,935,12],[630,868,630,935,12],
];
export const doors = [[270,786,270,866,{head:2.2,style:'entrance'}],[826,585,905,585],[1080,574,1080,640,{head:2.35,style:'hidden'}],[1290,640,1350,640,{head:2.4,style:'slide'}],[1086,652,1219,652,{head:2.42,style:'reeded'}],[818,935,900,935,{head:2.2,style:'balcony'}],[570,868,630,868,{head:2.35,style:'flush'}]];
// ref_photos: positions follow the plan; widths are photo estimates in plan pixels.
// Sill/head follow the 2026-10-07 plan's W height/sill annotations (cm); panels count main sections.
// `depth` is the thickness of the wall run this opening interrupts, in plan px. Without it the
// sill invents its own thickness and the shared corner line splits into two parallel seams.
export const windows = [
 [540,270,800,270,{id:'living',depth:16,blinds:[[1.15,1.6],[1.45,1.95],[1.15,1.6]],sill:.215,head:2.445,panels:3,rail:.78,sashes:[0],sashBottom:1.08}],
 [862,270,1042,270,{id:'daughter',depth:16,blinds:[[.55,1.9],[.55,1.9]],sill:.23,head:2.45,panels:2,rail:.78,sashes:[0],sashBottom:1.08}],
 [1105,270,1372,270,{id:'master-north',depth:16,blinds:[[1.35,1.95],[1.35,1.95],[1.35,1.95]],sill:.22,head:2.45,panels:3,rail:.78,sashes:[0],sashBottom:1.08}],
 [1390,300,1390,601,{id:'master-east',depth:14,sill:.89,head:2.455,panels:4,sashes:[0,3],sashBottom:1.12}],
 [1440,655,1440,770,{id:'bath',depth:17,sill:.89,head:2.44,panels:2,rail:1.25}],
 [570,1095,630,1095,{id:'guest',depth:17,sill:1.48,head:2.26,panels:2}],
 [650,1095,894,1095,{id:'utility',depth:17,sill:1.22,head:2.26,panels:0,open:true}],
 [1030,875,1195,875,{id:'study',depth:18,blinds:[[1.5,2],[1.5,2]],sill:1.185,head:2.465,panels:2}],
];
export function inside(x,z,polygon=outline) {
  let hit=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const [ax,az]=polygon[i], [bx,bz]=polygon[j];
    if((az>z)!==(bz>z) && x<(bx-ax)*(z-az)/(bz-az)+ax) hit=!hit;
  }
  return hit;
}

// The plan has only horizontal and vertical boundary edges.
export function fitsFurniture([x1,z1,x2,z2],obstacles,polygon=outline) {
  const overlaps=([a,b,c,d])=>x1<c&&x2>a&&z1<d&&z2>b;
  if(![[x1,z1],[x1,z2],[x2,z1],[x2,z2]].every(([x,z])=>inside(x,z,polygon)))return false;
  if(obstacles.some(overlaps))return false;
  // Corner checks alone miss a footprint spanning a notch in a concave outline.
  return !polygon.some(([x,z],i)=>{
    const [a,b]=polygon[(i+1)%polygon.length];
    return overlaps([Math.min(x,a),Math.min(z,b),Math.max(x,a),Math.max(z,b)]);
  });
}
