/* A contained geometric study: a hinged net, a polyhedral morph, then the lab emblem. */
(() => {
  'use strict';
  const TAU = Math.PI * 2, R3 = Math.sqrt(3), HEIGHT = Math.sqrt(2 / 3);
  const clamp = x => Math.max(0, Math.min(1, x));
  const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const mix = (a, b, t) => a + (b - a) * t;
  const add = (a, b) => a.map((v, i) => v + b[i]);
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const mul = (a, s) => a.map(v => v * s);
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const unit = a => mul(a, 1 / Math.hypot(...a));
  const lerp = (a, b, t) => a.map((v, i) => mix(v, b[i], t));
  const BASE = [[-.5, -R3/6, 0], [.5, -R3/6, 0], [0, R3/3, 0]];
  const OUTER = [[0, -2*R3/3, 0], [1, R3/3, 0], [-1, R3/3, 0]];
  const NET_FACES = [[0,1,2], [0,1,3], [1,2,4], [2,0,5]];
  function hinge(point, a, b, angle) {
    const axis = unit(sub(b, a)), v = sub(point, a);
    return add(a, add(add(mul(v, Math.cos(angle)), mul(cross(axis, v), Math.sin(angle))), mul(axis, dot(axis, v)*(1-Math.cos(angle)))));
  }
  function foldedNet(amount) {
    return BASE.concat(OUTER.map((p, i) => hinge(p, BASE[i], BASE[(i+1)%3], -Math.acos(-1/3)*amount)));
  }
  const TETRA = BASE.concat([[0, 0, HEIGHT]]).map(p => mul(sub(p, [0,0,HEIGHT/4]), 1/(Math.sqrt(6)/4)));
  const PHI = (1 + Math.sqrt(5)) / 2;
  const ICO = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    ICO.push(unit([0, a, b*PHI]), unit([a, b*PHI, 0]), unit([b*PHI, 0, a]));
  }
  const START = ICO.map(p => TETRA.reduce((best, v) => dot(v,p)>dot(best,p) ? v : best));
  function morphVertices(t) { return ICO.map((p, i) => lerp(START[i], p, t)); }
  const SQUARE = [[-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0]];
  const SQUARE_ARMS = [
    [SQUARE[0],SQUARE[1],[.5,-1.5,0],[-.5,-1.5,0]],
    [SQUARE[1],SQUARE[2],[1.5,.5,0],[1.5,-.5,0]],
    [SQUARE[2],SQUARE[3],[-.5,1.5,0],[.5,1.5,0]],
    [SQUARE[3],SQUARE[0],[-1.5,-.5,0],[-1.5,.5,0]]
  ];
  const SQUARE_TAIL = [[.5,1.5,0],[-.5,1.5,0],[-.5,2.5,0],[.5,2.5,0]];
  const CUBE_NET_FACES = Array.from({length:6},(_,i)=>[0,1,2,3].map(j=>i*4+j));
  // Fold the four arms at the base edges; the sixth square hinges on the lower arm.
  function cubeNet(fold) {
    const angle=-Math.PI/2*fold;
    const arms=SQUARE_ARMS.map((face,i)=>face.map(p=>hinge(p,SQUARE[i],SQUARE[(i+1)%4],angle)));
    const tail=SQUARE_TAIL.map(p=>hinge(hinge(p,SQUARE_TAIL[0],SQUARE_TAIL[1],angle),SQUARE[2],SQUARE[3],angle));
    return SQUARE.concat(...arms,tail);
  }
  const CUBE=[];
  for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])CUBE.push([x/R3,y/R3,z/R3]);
  const CUBE_TARGET=[], available=new Set(ICO.map((_,i)=>i));
  // Give every cube corner a vertex, then collapse the four remaining vertices onto corners.
  CUBE.forEach(corner=>{
    const index=[...available].reduce((best,i)=>dot(ICO[i],corner)>dot(ICO[best],corner)?i:best);
    CUBE_TARGET[index]=corner;available.delete(index);
  });
  available.forEach(i=>{CUBE_TARGET[i]=CUBE.reduce((best,p)=>dot(ICO[i],p)>dot(ICO[i],best)?p:best);});
  function morphToCube(t) {return ICO.map((p,i)=>lerp(p,CUBE_TARGET[i],t));}
  // Small convex hull, with coplanar triangles merged into polygonal faces.
  function hull(input) {
    const vertices = input.filter((p, i) => input.findIndex(q => Math.hypot(...sub(p,q)) < 1e-6) === i);
    const center = mul(vertices.reduce(add, [0,0,0]), 1/vertices.length), planes = [];
    for (let i=0; i<vertices.length-2; i++) for (let j=i+1; j<vertices.length-1; j++) for (let k=j+1; k<vertices.length; k++) {
      let n = cross(sub(vertices[j], vertices[i]), sub(vertices[k], vertices[i]));
      if (Math.hypot(...n) < 1e-7) continue;
      n = unit(n);
      if (dot(n, sub(vertices[i], center)) < 0) n = mul(n, -1);
      const d = dot(n, vertices[i]);
      if (vertices.some(p => dot(n,p)-d > 1e-6)) continue;
      if (planes.some(p => Math.hypot(...sub(p.n,n))<1e-5 && Math.abs(p.d-d)<1e-5)) continue;
      planes.push({n, d});
    }
    const faces = planes.map(({n,d}) => {
      const indices = vertices.map((p,i) => Math.abs(dot(n,p)-d)<1e-5 ? i : -1).filter(i=>i>=0);
      const c = mul(indices.reduce((s,i)=>add(s,vertices[i]),[0,0,0]),1/indices.length);
      const u = unit(sub(vertices[indices[0]],c)), v = cross(n,u);
      indices.sort((a,b)=>Math.atan2(dot(sub(vertices[a],c),v),dot(sub(vertices[a],c),u))-Math.atan2(dot(sub(vertices[b],c),v),dot(sub(vertices[b],c),u)));
      return indices;
    });
    return {vertices, faces};
  }
  function rotate(p, rx, ry, rz=0) {
    const x=p[0], y=p[1]*Math.cos(rx)-p[2]*Math.sin(rx), z=p[1]*Math.sin(rx)+p[2]*Math.cos(rx);
    const xx=x*Math.cos(ry)+z*Math.sin(ry), zz=-x*Math.sin(ry)+z*Math.cos(ry);
    return [xx*Math.cos(rz)-y*Math.sin(rz), xx*Math.sin(rz)+y*Math.cos(rz), zz];
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {foldedNet, morphVertices, cubeNet, morphToCube, CUBE_NET_FACES, hull, ICO, TETRA};
  if (typeof document === 'undefined') return;
  const canvas = document.getElementById('geometry-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const stage = document.getElementById('geometry-stage');
  const phase = document.getElementById('geometry-phase');
  const caption = document.getElementById('geometry-caption');
  const steps = [...document.querySelectorAll('[data-geometry-time]')];
  const globalMotion = document.getElementById('motion-toggle');
  const motion = document.getElementById('geometry-motion');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width=1, height=1, dpr=1, clock=0, frame=0, last=0, lastPaint=0, visible=false, selected=-1;
  let paused = globalMotion ? globalMotion.getAttribute('aria-pressed') === 'true' : reduced.matches;
  const icoMesh=hull(ICO);
  const flatOrder=ICO.map((p,i)=>({i,a:Math.atan2(rotate(p,-.45,.6)[1],rotate(p,-.45,.6)[0])})).sort((a,b)=>a.a-b.a);
  const FLAT=[];
  flatOrder.forEach(({i},j)=>{const a=-Math.PI/2+j*TAU/12,r=j%2?.53:1;FLAT[i]=[Math.cos(a)*r,Math.sin(a)*r,0];});
  function project(p, scale) {
    const perspective = 4/(4-p[2]*.3);
    return [width/2+p[0]*scale*perspective, height/2+p[1]*scale*perspective, p[2]];
  }
  function path(points, close=true) {
    ctx.beginPath(); points.forEach((p,i)=>i ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1])); if(close) ctx.closePath();
  }
  function mesh(vertices, faces, scale, alpha=1, fill=1, baseDim=false) {
    const points=vertices.map(p=>project(p,scale));
    const ordered=faces.map((f,i)=>({f,i,z:f.reduce((s,j)=>s+vertices[j][2],0)/f.length})).sort((a,b)=>a.z-b.z);
    ctx.save(); ctx.lineJoin='round';
    ordered.forEach(({f,i})=>{
      const normal=unit(cross(sub(vertices[f[1]],vertices[f[0]]),sub(vertices[f[2]],vertices[f[0]])));
      const lit=.35+.65*Math.abs(dot(normal,unit([-.4,-.6,1])));
      path(f.map(j=>points[j]));
      const dim=baseDim&&i===0 ? .18 : 1;
      ctx.fillStyle=`rgba(${Math.round(15+lit*20)},${Math.round(70+lit*58)},${Math.round(95+lit*63)},${alpha*fill*.73*dim})`;
      ctx.fill(); ctx.strokeStyle=`rgba(152,222,240,${alpha*(.45+lit*.4)*dim})`; ctx.lineWidth=1.25; ctx.stroke();
    });
    ctx.fillStyle=`rgba(220,250,255,${alpha*.8})`;
    points.forEach(p=>{ctx.beginPath();ctx.arc(p[0],p[1],1.65,0,TAU);ctx.fill();});
    ctx.restore();
  }
  function guides(alpha) {
    if(alpha<=0) return;
    const r=Math.min(width*.37,height*.43);
    ctx.save();ctx.strokeStyle=`rgba(100,177,200,${alpha*.17})`;ctx.lineWidth=.7;
    ctx.beginPath();ctx.arc(width/2,height/2,r,0,TAU);ctx.stroke();
    for(let i=0;i<6;i++) {const a=i*TAU/6-Math.PI/2;ctx.beginPath();ctx.arc(width/2+Math.cos(a)*r*.73,height/2+Math.sin(a)*r*.73,r*.23,0,TAU);ctx.stroke();}
    ctx.restore();
  }
  // Keep the same icosahedron on screen while the cube and cross develop within it.
  // Its vertices then flatten into the nested pattern used by the earlier emblem transition.
  function framework(t,scale) {
    const emerge=smooth((t-12.5)/2.5),flatten=smooth((t-19.5)/6.5),fade=smooth((t-24)/4);
    const alpha=mix(1,.64,emerge)*(1-fade);
    if(alpha<=0)return;
    const vertices=ICO.map((p,i)=>lerp(rotate(p,-.45,1.35,.035),FLAT[i],flatten));
    const outerScale=mix(scale,Math.min(width*.38,height*.425)*524/550,emerge);
    mesh(vertices,icoMesh.faces,outerScale,alpha,1-emerge);
    guides(flatten*(1-fade));
  }
  function emblem(alpha, assemble=1, includeCross=true) {
    if(alpha<=0) return;
    const scale=Math.min(width*.38,height*.425);
    const xy=(x,y)=>[width/2+(x-674)/550*scale,height/2+(y-566)/550*scale];
    ctx.save();ctx.globalAlpha=alpha;ctx.lineCap='round';ctx.lineJoin='round';
    const coils=[[519,350,79,79],[828,350,79,79],[426,540,97,100],[921,540,97,100],[535,783,89,71],[806,783,89,71]];
    coils.forEach(([x,y,rx,ry],i)=>{
      const p=xy(x,y); ctx.strokeStyle='#72bacb';ctx.lineWidth=.85;ctx.globalAlpha=alpha*.5;
      ctx.beginPath();
      for(let j=0;j<=80;j++) {const a=j/80*TAU*2.2*(i%2 ? -1 : 1), r=.1+.9*j/80;const xx=p[0]+Math.cos(a)*rx/550*scale*r, yy=p[1]+Math.sin(a)*ry/550*scale*r; if(j)ctx.lineTo(xx,yy);else ctx.moveTo(xx,yy);}
      ctx.stroke();
    });
    ctx.globalAlpha=alpha;
    const hex=[[674,42],[1140,316],[1140,818],[674,1090],[208,818],[208,316]].map(p=>xy(...p));
    path(hex);ctx.strokeStyle='#467a8b';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle='#bfdae2';ctx.lineWidth=1.6;ctx.stroke();
    const triangles=[[[674,150],[492,447],[855,447]],[[494,459],[303,751],[653,751]],[[855,459],[694,751],[1033,751]]];
    triangles.forEach((triangle,i)=>{
      const center=triangle.reduce((s,p)=>[s[0]+p[0]/3,s[1]+p[1]/3],[0,0]);
      const offset=(1-assemble)*(i===0 ? -100 : 75);
      const points=triangle.map(p=>xy(center[0]+(p[0]-center[0])*(.85+.15*assemble),p[1]+offset));
      path(points);ctx.fillStyle='#0b2330';ctx.fill();ctx.strokeStyle='#bddce6';ctx.lineWidth=3;ctx.stroke();
      const inner=triangle.map(p=>xy(center[0]+(p[0]-center[0])*.72,center[1]+(p[1]-center[1])*.72+offset));
      path(inner);ctx.strokeStyle='#4b98af';ctx.lineWidth=1;ctx.stroke();
    });
    if(includeCross){
      ctx.globalAlpha=alpha*assemble;ctx.strokeStyle='#c6e8f0';ctx.lineWidth=4;
      path([xy(674,390),xy(674,960)],false);ctx.stroke();path([xy(542,550),xy(806,550)],false);ctx.stroke();
      ctx.strokeStyle='#64c8e6';ctx.lineWidth=1;path([xy(674,390),xy(674,960)],false);ctx.stroke();path([xy(542,550),xy(806,550)],false);ctx.stroke();
    }
    ctx.restore();
  }
  function crossToEmblem(amount,alpha=1) {
    const netScale=Math.min(width*.26,height*.215), emblemScale=Math.min(width*.38,height*.425);
    const crossY=-16/550*emblemScale, bottomY=394/550*emblemScale;
    const yTargets=[-176/550*emblemScale,crossY-2,crossY+2,(crossY+bottomY)/2,bottomY];
    const points=cubeNet(0).map(([x,y])=>{
      const start=[width/2+x*netScale,height/2+(y-.5)*netScale];
      const targetX=Math.abs(x)===.5?x*4:Math.sign(x)*132/550*emblemScale;
      const target=[width/2+targetX,height/2+yTargets[Math.round(y+1.5)]];
      return lerp(start,target,amount);
    });
    ctx.save();ctx.globalAlpha=alpha;ctx.lineJoin='round';ctx.lineWidth=1.25;
    CUBE_NET_FACES.forEach(face=>{
      path(face.map(i=>points[i]));
      ctx.fillStyle=`rgba(${Math.round(mix(32,198,amount))},${Math.round(mix(116,232,amount))},${Math.round(mix(156,240,amount))},${mix(.45,1,amount)})`;
      ctx.fill();ctx.strokeStyle=`rgba(152,222,240,${1-amount})`;ctx.stroke();
    });
    ctx.restore();
  }
  function describe(index, title, text) {
    if(selected===index&&phase.textContent===title) return;
    selected=index;phase.textContent=title;caption.textContent=text;
    steps.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
  }
  function draw() {
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    const t=clock%32, scale=Math.min(width*.29,height*.37)*1.7*Math.sqrt(6)/4;
    if(t<7) {
      const fold=smooth((t-1.5)/4), rotation=fold;
      const center=[0,-R3/6*(1-fold),HEIGHT/4*fold];
      const vertices=foldedNet(fold).map(p=>rotate(sub(p,center),.22*rotation,.3*rotation+.1*smooth(t-5.5),Math.PI*rotation));
      mesh(vertices,NET_FACES,Math.min(width*.29,height*.37)*(1+.7*fold),1,1,fold<.05);
      describe(fold<.99 ? 0:1,fold<.99?'Triangle net → tetrahedron':'Tetrahedron',fold<.99?'Three outer triangles fold around a fourth face.':'Four faces meet to form a three-dimensional structure.');
    } else if(t<12.5) {
      const amount=smooth((t-7)/3.5), model=hull(morphVertices(amount));
      // The starting tetrahedron keeps the same camera and apparent size as the fold.
      const vertices=model.vertices.map(p=>rotate(p,mix(.22,-.45,amount),.4+(t-7)*.95/5.5,mix(Math.PI,.035,amount)));
      mesh(vertices,model.faces,scale);
      describe(amount<.98?1:2,amount<.98?'Tetrahedron → icosahedron':'Icosahedron',amount<.98?'The vertices spread into a more intricate geometric form.':'Twenty triangular faces, one connected structure.');
    } else if(t<15) {
      const amount=smooth((t-12.5)/2.5), model=hull(morphToCube(amount));
      framework(t,scale);
      mesh(model.vertices.map(p=>rotate(p,mix(-.45,-.4,amount),mix(1.35,.65,amount),mix(.035,0,amount))),model.faces,scale*mix(1,.72,amount),amount,.62);
      describe(2,'Icosahedron + cube','A cube forms inside the continuing icosahedral framework.');
    } else if(t<21.5) {
      framework(t,scale);
      const open=smooth((t-16)/4.5), fold=1-open, center=[0,.5*open,.5*fold];
      const vertices=cubeNet(fold).map(p=>rotate(sub(p,center),-.4*fold,.65*fold));
      mesh(vertices,CUBE_NET_FACES,mix(scale*.72*2/R3,Math.min(width*.26,height*.215),open),1,.62);
      if(t<16)describe(3,'Cube within the geometry','The cube and icosahedron share the same view.');
      else if(open<.999)describe(3,'Unfolding within the geometry','The cube opens while the surrounding framework stays visible.');
      else describe(4,'Cross + icosahedron','The unfolded cross remains connected to the surrounding geometry.');
    } else if(t<30) {
      framework(t,scale);
      const assemble=smooth((t-22.5)/5);
      emblem(assemble,assemble,false);crossToEmblem(smooth((t-21.5)/4));
      if(t<24.5)describe(4,'Cross joins the geometry','The cross shrinks inward as the icosahedron opens into the emblem’s pattern.');
      else if(t<28)describe(5,'Geometry → emblem','Cross, nested lines, triangles, and loops merge into one emblem.');
      else describe(5,'Internectual Labs','The connected geometry resolves into the lab emblem.');
    } else {
      const reset=smooth((t-30)/2);
      emblem(1-reset,1,false);crossToEmblem(1,1-reset);const center=[0,-R3/6,0];
      mesh(foldedNet(0).map(p=>sub(p,center)),NET_FACES,Math.min(width*.29,height*.37),reset,1,true);
      describe(5,'A new cycle','One shape opens the way to the next experiment.');
    }
  }
  function stop() { if(frame)cancelAnimationFrame(frame);frame=0;last=0;lastPaint=0; }
  function tick(now) {
    frame=0;
    if(paused||!visible||document.hidden) {last=0;return;}
    if(last)clock+=Math.min((now-last)/1000,.1);last=now;
    if(now-lastPaint>=1000/30){draw();lastPaint=now;}
    frame=requestAnimationFrame(tick);
  }
  function resume() {if(!frame&&!paused&&visible&&!document.hidden)frame=requestAnimationFrame(tick);}
  function syncMotion() {
    if(globalMotion)paused=globalMotion.getAttribute('aria-pressed')==='true';
    motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'Play motion ▷':'Pause motion Ⅱ';
    if(paused)stop();else resume();
  }
  motion.addEventListener('click',()=>{if(globalMotion)globalMotion.click();else paused=!paused;syncMotion();});
  if(globalMotion)new MutationObserver(syncMotion).observe(globalMotion,{attributes:true,attributeFilter:['aria-pressed']});
  else reduced.addEventListener('change',()=>{paused=reduced.matches;syncMotion();});
  steps.forEach(b=>b.addEventListener('click',()=>{clock=Number(b.dataset.geometryTime);selected=-1;last=0;draw();}));
  document.getElementById('geometry-replay').addEventListener('click',()=>{clock=0;selected=-1;last=0;draw();resume();});
  function resize() {
    const box=stage.getBoundingClientRect();width=box.width;height=box.height;dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(width*dpr));canvas.height=Math.max(1,Math.round(height*dpr));draw();
  }
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)resume();else stop();},{threshold:.05}).observe(stage);
  document.addEventListener('visibilitychange',()=>document.hidden?stop():resume());
  resize();syncMotion();
})();
