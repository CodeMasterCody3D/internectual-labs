'use strict';
/* Constellation node/link motion adapted from ThreeUI, Copyright (c) 2026
 * Meng To, MIT. See assets/THREEUI-LICENSE.txt. Projected geometry, circuit
 * pulses and the layered Internectual emblem are custom to this page. */
(() => {
  const stage = document.getElementById('logo-stage');
  const canvas = document.getElementById('research-field');
  const logo = document.getElementById('logo-object');
  const toggle = document.getElementById('motion-toggle');
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width=1,height=1,frame=0,last=0,time=0,visible=true,paused=reduced.matches;
  let px=0,py=0,tx=0,ty=0,nodes=[];
  let seed=41477;
  const random=() => {seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  const updateToggle=() => {
    toggle.setAttribute('aria-pressed',String(paused));
    toggle.textContent=paused?'Play motion ▷':'Pause motion Ⅱ';
    stage.classList.toggle('motion-paused',paused);
  };
  updateToggle();
  if(!ctx){toggle.disabled=true;toggle.textContent='Motion unavailable';stage.classList.add('motion-paused');return;}
  const size=()=>{
    const r=stage.getBoundingClientRect();width=r.width;height=r.height;
    const dpr=Math.min(devicePixelRatio||1,width<680?1.35:1.5);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    seed=41477;nodes=Array.from({length:width<680?35:62},()=>({x:random()*width,y:random()*height,vx:(random()-.5)*.18,vy:(random()-.5)*.18,r:random()*1.3+.5,phase:random()*6.28}));
    draw();
  };
  const point=(x,y,z,ax,ay,az)=>{
    const cy=Math.cos(ax),sy=Math.sin(ax);let y1=y*cy-z*sy,z1=y*sy+z*cy;
    const cx=Math.cos(ay),sx=Math.sin(ay);let x1=x*cx+z1*sx,z2=-x*sx+z1*cx;
    const cz=Math.cos(az),sz=Math.sin(az);let x2=x1*cz-y1*sz,y2=x1*sz+y1*cz;
    const f=900/(900+z2);return{x:width/2+x2*f+px*13,y:height*.47+y2*f+py*9,z:z2};
  };
  const line=(points,color,lineWidth=1)=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.stroke();};
  const glow=(x,y,r,alpha=.7)=>{ctx.shadowColor='#42d6ff';ctx.shadowBlur=12;ctx.fillStyle=`rgba(141,235,255,${alpha})`;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;};
  const ring=(radius,ax,ay,az,opacity)=>{
    const vertices=[];for(let j=0;j<=6;j++){const a=j*Math.PI/3-Math.PI/2;vertices.push(point(radius*Math.cos(a),radius*Math.sin(a),0,ax,ay,az));}
    line(vertices,`rgba(90,185,218,${opacity})`,1.1);
    const inner=[];for(let j=0;j<=6;j++){const a=j*Math.PI/3-Math.PI/2;inner.push(point((radius-5)*Math.cos(a),(radius-5)*Math.sin(a),-5,ax,ay,az));}
    line(inner,`rgba(151,204,222,${opacity*.45})`,.65);
    for(let j=0;j<6;j++){
      line([vertices[j],inner[j]],`rgba(166,226,242,${opacity*.7})`,1);
      const u=(time*.16+j/6)%1,a=u*Math.PI*2-Math.PI/2,edge=Math.floor(u*6),f=u*6-edge;
      const p={x:vertices[edge].x*(1-f)+vertices[edge+1].x*f,y:vertices[edge].y*(1-f)+vertices[edge+1].y*f};
      if(j<2)glow(p.x,p.y,1.7,opacity+.15);
    }
  };
  const trace=(side,index,radius)=>{
    const cx=width/2,cy=height*.47;
    const sy=cy+(index-3.5)*34;
    const a={x:cx+side*radius*.72,y:sy};
    const b={x:cx+side*(radius+42+index*5),y:sy};
    const c={x:b.x+side*(30+index*3),y:sy+(index<4?-1:1)*(35+index*4)};
    const d={x:side<0?-30:width+30,y:c.y};
    line([a,b,c,d],'rgba(56,152,187,.19)',.7);
    const lengths=[Math.hypot(b.x-a.x,b.y-a.y),Math.hypot(c.x-b.x,c.y-b.y),Math.hypot(d.x-c.x,d.y-c.y)];
    let travel=((time*.13+index*.117+(side>0?.31:0))%1)*lengths.reduce((s,x)=>s+x,0);
    const ps=[a,b,c,d];for(let k=0;k<3;k++){if(travel<=lengths[k]){const f=travel/Math.max(lengths[k],1);const x=ps[k].x+(ps[k+1].x-ps[k].x)*f,y=ps[k].y+(ps[k+1].y-ps[k].y)*f;glow(x,y,1.2,.8);line([{x:x-side*13,y},{x,y}],'rgba(127,222,249,.6)',1.2);break;}travel-=lengths[k];}
    glow(b.x,b.y,1,.35);
  };
  function draw(){
    ctx.clearRect(0,0,width,height);ctx.lineCap='round';
    const radius=Math.min(width<680?width*.44:width*.27,height*.51);
    const centerGlow=ctx.createRadialGradient(width/2,height*.47,20,width/2,height*.47,radius*1.65);
    centerGlow.addColorStop(0,'rgba(27,172,215,.04)');centerGlow.addColorStop(.5,'rgba(0,104,157,.08)');centerGlow.addColorStop(1,'rgba(0,55,98,0)');ctx.fillStyle=centerGlow;ctx.fillRect(0,0,width,height);
    for(let i=0;i<nodes.length;i++){
      const n=nodes[i];for(let j=i+1;j<nodes.length;j++){const o=nodes[j],d=Math.hypot(n.x-o.x,n.y-o.y);if(d<110)line([n,o],`rgba(62,160,193,${(1-d/110)*.15})`,.6);}
      ctx.fillStyle=`rgba(126,206,231,${.22+Math.sin(time*.7+n.phase)*.15})`;ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,6.283);ctx.fill();
    }
    for(let j=0;j<8;j++){trace(-1,j,radius);trace(1,j,radius);}
    ring(radius*1.02,.12+py*.08,.18+px*.08,.02+Math.sin(time*.12)*.035,.5);
    ring(radius*1.19,.25+py*.06,.33+px*.06,time*.025,.23);
    ring(radius*1.37,.99+Math.sin(time*.13)*.1,-.35,time*.05+.3,.3);
    ring(radius*1.27,.85,-.5,-time*.04-.3,.24);
    // Arc segments orbit around the mark; the mark itself stays readable.
    for(let j=0;j<3;j++){
      const points=[];for(let k=0;k<=42;k++){const a=time*.07+j*2.094+k*.013;points.push(point(radius*1.32*Math.cos(a),radius*1.32*Math.sin(a),0,.23,-.24,0));}
      line(points,'rgba(101,207,240,.55)',1.4);const p=points[points.length-1];glow(p.x,p.y,2,.85);
    }
  }
  function animate(now){
    frame=0;if(paused||!visible||document.hidden){last=0;return;}
    if(!last||now-last>=1000/30){const dt=last?Math.min((now-last)/1000,.1):0;last=now;time+=dt;px+=(tx-px)*.08;py+=(ty-py)*.08;
      for(const n of nodes){n.x+=n.vx*dt*30;n.y+=n.vy*dt*30;if(n.x<0||n.x>width)n.vx*=-1;if(n.y<0||n.y>height)n.vy*=-1;}
      logo.style.setProperty('--logo-rx',`${-py*7}deg`);logo.style.setProperty('--logo-ry',`${px*10}deg`);draw();
    }frame=requestAnimationFrame(animate);
  }
  const stop=()=>{if(frame)cancelAnimationFrame(frame);frame=0;last=0;};
  const resume=()=>{if(!paused&&visible&&!document.hidden&&!frame)frame=requestAnimationFrame(animate);};
  stage.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||paused)return;const r=stage.getBoundingClientRect();tx=((e.clientX-r.left)/r.width-.5)*2;ty=((e.clientY-r.top)/r.height-.5)*2;},{passive:true});
  stage.addEventListener('pointerleave',()=>{tx=0;ty=0;});
  toggle.addEventListener('click',()=>{paused=!paused;updateToggle();if(paused)stop();else resume();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;updateToggle();if(paused){stop();draw();}else resume();});
  new ResizeObserver(size).observe(stage);
  new IntersectionObserver(([entry])=>{visible=!!entry?.isIntersecting;stage.classList.toggle('motion-paused',paused||!visible);if(visible)resume();else stop();}).observe(stage);
  document.addEventListener('visibilitychange',()=>{stage.classList.toggle('motion-paused',paused||document.hidden||!visible);if(document.hidden)stop();else resume();});
  addEventListener('pagehide',stop);addEventListener('pageshow',resume);
  size();resume();
})();
