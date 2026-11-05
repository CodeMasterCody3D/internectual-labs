/* Shape viewers for the lab's existing geometric model directions. */
(() => {
  'use strict';
  const TAU=Math.PI*2, PHI=(1+Math.sqrt(5))/2;
  const add=(a,b)=>a.map((v,i)=>v+b[i]);
  const sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
  const mul=(a,s)=>a.map(v=>v*s);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=a=>mul(a,1/Math.hypot(...a));
  function rotate(p,rx,ry,rz=0){
    const y=p[1]*Math.cos(rx)-p[2]*Math.sin(rx),z=p[1]*Math.sin(rx)+p[2]*Math.cos(rx);
    const x=p[0]*Math.cos(ry)+z*Math.sin(ry);
    return [x*Math.cos(rz)-y*Math.sin(rz),x*Math.sin(rz)+y*Math.cos(rz),-p[0]*Math.sin(ry)+z*Math.cos(ry)];
  }
  function surface(vertices,faces){
    return {vertices,faces:faces.map(indices=>({indices,normal:unit(cross(sub(vertices[indices[1]],vertices[indices[0]]),sub(vertices[indices[2]],vertices[indices[0]])))}))};
  }
  function dodecahedron(){
    const vertices=[];
    for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])vertices.push([x,y,z]);
    for(const a of [-1,1])for(const b of [-1,1])vertices.push([0,a/PHI,b*PHI],[a/PHI,b*PHI,0],[a*PHI,0,b/PHI]);
    const planes=[];
    for(let i=0;i<18;i++)for(let j=i+1;j<19;j++)for(let k=j+1;k<20;k++){
      let n=cross(sub(vertices[j],vertices[i]),sub(vertices[k],vertices[i]));
      if(Math.hypot(...n)<1e-7)continue;n=unit(n);if(dot(n,vertices[i])<0)n=mul(n,-1);
      const d=dot(n,vertices[i]);
      if(vertices.some(p=>dot(n,p)>d+1e-6)||planes.some(p=>Math.hypot(...sub(p.n,n))<1e-5))continue;
      planes.push({n,d});
    }
    const faces=planes.map(({n,d})=>{
      const f=vertices.map((p,i)=>Math.abs(dot(n,p)-d)<1e-5?i:-1).filter(i=>i>=0);
      const center=mul(f.reduce((s,i)=>add(s,vertices[i]),[0,0,0]),1/f.length),u=unit(sub(vertices[f[0]],center)),v=cross(n,u);
      return f.sort((a,b)=>Math.atan2(dot(sub(vertices[a],center),v),dot(sub(vertices[a],center),u))-Math.atan2(dot(sub(vertices[b],center),v),dot(sub(vertices[b],center),u)));
    });
    return surface(vertices.map(p=>mul(p,1/Math.sqrt(3))),faces);
  }
  function torus(segments=36,tube=16){
    const vertices=[],faces=[];
    for(let i=0;i<segments;i++)for(let j=0;j<tube;j++){
      const u=i/segments*TAU,v=j/tube*TAU,r=.67+.27*Math.cos(v);
      vertices.push([r*Math.cos(u),r*Math.sin(u),.27*Math.sin(v)]);
      faces.push([i*tube+j,((i+1)%segments)*tube+j,((i+1)%segments)*tube+(j+1)%tube,i*tube+(j+1)%tube]);
    }
    return surface(vertices,faces);
  }
  function fractalCross(depth=3){
    const offsets=[[0,0,0],[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    let cells=[[0,0,0]];
    for(let level=0;level<depth;level++)cells=cells.flatMap(c=>offsets.map(o=>add(mul(c,3),o)));
    const occupied=new Set(cells.map(c=>c.join(','))),size=2/(3**depth),vertices=[],faces=[];
    const sides=[
      {n:[1,0,0],p:[[1,-1,-1],[1,1,-1],[1,1,1],[1,-1,1]]},
      {n:[-1,0,0],p:[[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,-1,-1]]},
      {n:[0,1,0],p:[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]]},
      {n:[0,-1,0],p:[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]},
      {n:[0,0,1],p:[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]},
      {n:[0,0,-1],p:[[-1,1,-1],[1,1,-1],[1,-1,-1],[-1,-1,-1]]}
    ];
    cells.forEach(c=>sides.forEach(({n,p})=>{
      if(occupied.has(add(c,n).join(',')))return;
      const start=vertices.length;vertices.push(...p.map(q=>mul(add(c,mul(q,.5)),size)));faces.push([start,start+1,start+2,start+3]);
    }));
    return {...surface(vertices,faces),cellCount:cells.length};
  }
  function waveModel(){
    // Reference: two four-arm planar crosses sharing their middle chamber.
    // The arms have smaller cross forms; there are no front/back branching arms.
    const vertices=[],faces=[],branches=[],chambers=[],poly=dodecahedron();
    const centers=[[-1.05,0,0],[1.05,0,0]],seenChambers=new Set();
    const boxFaces=[[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]];
    function append(mesh,center,scale,material){
      const offset=vertices.length;
      vertices.push(...mesh.vertices.map(p=>add(center,mul(p,scale))));
      faces.push(...mesh.faces.map(f=>({...f,indices:f.indices.map(i=>i+offset),material})));
    }
    function beam(a,b,width){
      const x0=Math.min(a[0],b[0])-width/2,x1=Math.max(a[0],b[0])+width/2;
      const y0=Math.min(a[1],b[1])-width/2,y1=Math.max(a[1],b[1])+width/2;
      const z=width*.55;
      append(surface([[x0,y0,-z],[x1,y0,-z],[x1,y1,-z],[x0,y1,-z],[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]],boxFaces),[0,0,0],1,'branch');
      branches.push({a,b});
    }
    for(const center of centers){
      for(const direction of [[0,-1,0],[0,1,0],[-1,0,0],[1,0,0]]){
        beam(center,add(center,mul(direction,.8)),.105);
        const side=[-direction[1],direction[0],0];
        for(const [distance,reach,width] of [[.25,.12,.085],[.54,.19,.12]]){
          const joint=add(center,mul(direction,distance));
          beam(add(joint,mul(side,-reach)),add(joint,mul(side,reach)),width);
          beam(add(joint,mul(direction,-reach*.7)),add(joint,mul(direction,reach*.7)),width);
        }
        const chamber=add(center,mul(direction,1.05)),key=chamber.map(x=>x.toFixed(3)).join(',');
        if(!seenChambers.has(key)){
          seenChambers.add(key);chambers.push(chamber);append(poly,chamber,.4,'chamber');
        }
      }
    }
    // Sample the actual chamber and cross surfaces, retaining their faceted silhouette.
    const samples=new Map();
    function sample(p,normal){
      const key=p.map(x=>x.toFixed(4)).join(','),existing=samples.get(key);
      if(existing){existing.normal=add(existing.normal,normal);return;}
      const noise=Math.sin(dot(p,[12.9898,78.233,37.719]))*43758.5453;
      samples.set(key,{p,normal:[...normal],phase:noise-Math.floor(noise)});
    }
    for(const face of faces){
      const points=face.indices.map(i=>vertices[i]);
      if(points.length===4){
        const u=sub(points[1],points[0]),v=sub(points[3],points[0]);
        const nu=Math.max(1,Math.ceil(Math.hypot(...u)/.09)),nv=Math.max(1,Math.ceil(Math.hypot(...v)/.09));
        for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++)sample(add(points[0],add(mul(u,i/nu),mul(v,j/nv))),face.normal);
      }else{
        const center=mul(points.reduce(add,[0,0,0]),1/points.length);
        for(let edge=0;edge<points.length;edge++){
          const a=sub(points[edge],center),b=sub(points[(edge+1)%points.length],center);
          const steps=Math.ceil(Math.max(Math.hypot(...a),Math.hypot(...b),Math.hypot(...sub(a,b)))/.09);
          for(let i=0;i<=steps;i++)for(let j=0;j<=steps-i;j++)sample(add(center,add(mul(a,i/steps),mul(b,j/steps))),face.normal);
        }
      }
    }
    const points=[...samples.values()].map(p=>({...p,normal:Math.hypot(...p.normal)>1e-6?unit(p.normal):[0,0,1]}));
    return {vertices,faces,branches,chambers,centers,points,source:[-2.1,0,.4],target:[2.1,0,.4]};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={dodecahedron,torus,fractalCross,waveModel};
  if(typeof document==='undefined')return;
  const cards=[...document.querySelectorAll('[data-model-shape]')];
  if(!cards.length)return;
  const globalMotion=document.getElementById('motion-toggle'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const models={cross:fractalCross(),dodecahedron:dodecahedron(),torus:torus(),wave:waveModel()};
  const light=unit([-.45,-.65,1]);
  let paused=globalMotion?globalMotion.getAttribute('aria-pressed')==='true':reduced.matches,frame=0,last=0,lastPaint=0;
  const views=[];
  function paintWave(view){
    const {ctx,width,height,model,rx,ry,clock}=view,rz=.24;
    const transform=p=>rotate(p,rx,ry,rz);
    const transformed=model.vertices.map(transform);
    const bounds=transformed.reduce((b,p)=>[Math.min(b[0],p[0]),Math.max(b[1],p[0]),Math.min(b[2],p[1]),Math.max(b[3],p[1])],[Infinity,-Infinity,Infinity,-Infinity]);
    const scale=Math.min((width-48)/(bounds[1]-bounds[0]),(height-64)/(bounds[3]-bounds[2]));
    const middle=[(bounds[0]+bounds[1])/2,(bounds[2]+bounds[3])/2];
    const project=p=>[width/2+(p[0]-middle[0])*scale,height/2+(p[1]-middle[1])*scale-5];
    // This is illustrative wave activity, not a replay of training measurements.
    const amplitude=p=>{
      const decay=.24+.76/(1+Math.exp((p[0]-.4)*5));
      return decay*(.91+.09*Math.cos(clock*.7-(p[0]+2.1)*1.3));
    };
    const visible=model.faces.map(face=>({...face,n:transform(face.normal),z:face.indices.reduce((s,i)=>s+transformed[i][2],0)/face.indices.length})).filter(f=>f.n[2]>.03).sort((a,b)=>a.z-b.z);
    ctx.lineJoin='round';ctx.lineWidth=.5;
    for(const face of visible){
      ctx.beginPath();face.indices.forEach((j,i)=>i?ctx.lineTo(...project(transformed[j])):ctx.moveTo(...project(transformed[j])));ctx.closePath();
      ctx.fillStyle='#09212bd9';ctx.fill();ctx.strokeStyle='#56829135';ctx.stroke();
    }
    const dots=model.points.map(point=>({...point,q:transform(point.p),n:transform(point.normal)})).filter(p=>p.n[2]>-.12).sort((a,b)=>a.q[2]-b.q[2]);
    for(const point of dots){
      const a=amplitude(point.p),[x,y]=project(point.q),hue=(point.phase*360+clock*22)%360;
      const light=(20+a*38)*(.7+.3*Math.max(0,point.n[2]));
      ctx.beginPath();ctx.arc(x,y,Math.max(.8,scale*.034*(.58+.42*a)),0,TAU);
      ctx.fillStyle=`hsl(${hue.toFixed(0)} 94% ${light.toFixed(0)}%)`;ctx.fill();
    }
    ctx.font=`${width<400?10:11}px ui-monospace, monospace`;
    for(const [label,p] of [['Source',model.source],['Target',model.target]]){
      const [x,y]=project(transform(p));
      ctx.beginPath();ctx.arc(x,y,6,0,TAU);ctx.strokeStyle='#e2f9ff';ctx.lineWidth=1.3;ctx.stroke();
      const labelX=Math.min(x+10,width-48);
      ctx.lineWidth=3;ctx.strokeStyle='#07151ed9';ctx.strokeText(label,labelX,y-9);ctx.fillStyle='#e5f8ff';ctx.fillText(label,labelX,y-9);
    }
  }
  function paint(view){
    const {ctx,width,height,dpr,model,rx,ry,kind}=view;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    if(kind==='wave'){paintWave(view);return;}
    const scale=Math.min(width*.37,height*.40),transformed=model.vertices.map(p=>rotate(p,rx,ry));
    const points=transformed.map(([x,y,z])=>{const perspective=4/(4-z*.28);return [width/2+x*scale*perspective,height/2+y*scale*perspective];});
    const visible=model.faces.map(face=>{
      const normal=rotate(face.normal,rx,ry);
      return {...face,normal,z:face.indices.reduce((s,i)=>s+transformed[i][2],0)/face.indices.length};
    }).filter(face=>face.normal[2]>.001).sort((a,b)=>a.z-b.z);
    ctx.lineJoin='round';
    for(const face of visible){
      const lighting=.24+.76*Math.max(0,dot(face.normal,light));
      ctx.beginPath();face.indices.forEach((j,i)=>i?ctx.lineTo(...points[j]):ctx.moveTo(...points[j]));ctx.closePath();
      const color=kind==='cross'?[30,131,163]:kind==='torus'?[36,143,172]:[38,113,162];
      const rgb=color.map((c,i)=>Math.round(c*(.5+.6*lighting)+lighting*(i===0?50:32)));
      ctx.fillStyle=`rgb(${rgb.join(',')})`;ctx.fill();ctx.lineWidth=kind==='dodecahedron'?1.2:.45;
      ctx.strokeStyle=`rgba(174,226,243,${kind==='dodecahedron'?.6:kind==='cross'?.22:.16})`;ctx.stroke();
    }
  }
  function stop(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;lastPaint=0;}
  function active(){return !paused&&!document.hidden&&views.some(v=>v.visible&&!v.manual);}
  function resume(){if(!frame&&active())frame=requestAnimationFrame(tick);}
  function tick(now){
    frame=0;if(!active()){last=0;return;}
    const dt=last?Math.min((now-last)/1000,.1):0;last=now;
    for(const view of views)if(view.visible&&!view.manual){
      if(view.kind==='wave'){
        view.clock+=dt;
        view.ry=.6+Math.sin(view.clock*.18)*.08;
      }else view.ry+=dt*.14;
    }
    if(now-lastPaint>1000/24){for(const view of views)if(view.visible&&!view.manual)paint(view);lastPaint=now;}
    frame=requestAnimationFrame(tick);
  }
  function sync(){paused=globalMotion?globalMotion.getAttribute('aria-pressed')==='true':reduced.matches;if(paused)stop();else resume();}
  for(const card of cards){
    const canvas=card.querySelector('canvas'),ctx=canvas.getContext('2d');if(!ctx)continue;
    const kind=card.dataset.modelShape;
    const view={canvas,ctx,kind,model:models[kind],width:1,height:1,dpr:1,rx:kind==='wave'?.4:kind==='torus'?-.62:-.38,ry:kind==='wave'?.6:kind==='torus'?.25:.58,clock:0,visible:false,manual:false,pointer:null};
    const initial={rx:view.rx,ry:view.ry};views.push(view);
    function resize(){const box=canvas.getBoundingClientRect();view.width=box.width;view.height=box.height;view.dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(box.width*view.dpr);canvas.height=Math.round(box.height*view.dpr);paint(view);}
    function turn(dx,dy=0){view.manual=true;view.ry+=dx;view.rx=Math.max(-1.4,Math.min(1.4,view.rx+dy));paint(view);}
    function reset(){view.rx=initial.rx;view.ry=initial.ry;view.clock=0;view.manual=false;paint(view);resume();}
    card.querySelectorAll('[data-turn]').forEach(b=>b.addEventListener('click',()=>turn(Number(b.dataset.turn)*.22)));
    card.querySelector('[data-reset]').addEventListener('click',reset);
    canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;view.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,type:e.pointerType};view.manual=true;canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{const p=view.pointer;if(!p||p.id!==e.pointerId)return;turn((e.clientX-p.x)*.009,p.type==='mouse'?(e.clientY-p.y)*.009:0);p.x=e.clientX;p.y=e.clientY;});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{view.pointer=null;});
    canvas.addEventListener('keydown',e=>{const directions={ArrowLeft:[-.14,0],ArrowRight:[.14,0],ArrowUp:[0,-.14],ArrowDown:[0,.14]};if(directions[e.key]){e.preventDefault();turn(...directions[e.key]);}else if(e.key==='Home'){e.preventDefault();reset();}});
    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(entries=>{view.visible=entries[0].isIntersecting;if(active())resume();else stop();},{threshold:.05}).observe(canvas);
    resize();
  }
  if(globalMotion)new MutationObserver(sync).observe(globalMotion,{attributes:true,attributeFilter:['aria-pressed']});else reduced.addEventListener('change',sync);
  document.addEventListener('visibilitychange',()=>document.hidden?stop():resume());
  sync();
})();
