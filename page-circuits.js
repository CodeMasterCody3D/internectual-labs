'use strict';
// A viewport-sized canvas renders a connected circuit field in document coordinates.
// All motion is driven by experience.js's single pause/reduced-motion clock.
window.createLabCircuitField = ({ measure, at, section, stroke, rainbow, white, onArrival }) => {
  const canvas = document.getElementById('page-circuits');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return null;
  const selectors = [
    '.hero-support a[href*="github.com/sponsors/"]',
    '.hero-support a[href*="cash.app/"]',
    '.hero-support a[href*="paypal.com/"]',
    '.hero-support a[href*="venmo.com/"]',
    '#motion-toggle', '.nav-support', '.nav-right a[href="#about"]',
    '.nav-left a[href="#research"]', '.nav-left a[href="#work"]'
  ];
  const targets = selectors.map(selector => document.querySelector(selector)).filter(Boolean);
  targets.forEach(element => element.classList.add('circuit-target'));
  let viewWidth = 1, viewHeight = 1, docHeight = 1, now = 0;
  let feeds = [], packets = [], outputs = [], outgoing = [];
  let outputIndex = 0;
  let stageX = 0, stageY = 0, serial = 0;
  const hash = n => { const value = Math.sin(n * 127.1 + 311.7) * 43758.5453; return value - Math.floor(value); };
  const rect = element => {
    const r = element.getBoundingClientRect();
    return { left:r.left, right:r.right, top:r.top + scrollY, bottom:r.bottom + scrollY, width:r.width, height:r.height };
  };
  function makePacket(route, start = now) {
    const speed = viewWidth < 680 ? 230 : 330;
    packets.push({ route, start, speed, tail: viewWidth < 680 ? 58 : 85, strength:.72, key:++serial * 31, hit:false });
  }
  function resize({ stageRect, heroRoutes, exit }) {
    viewWidth = document.documentElement.clientWidth; viewHeight = innerHeight;
    docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    stageX = stageRect.left; stageY = stageRect.top + scrollY;
    const dpr = Math.min(devicePixelRatio || 1, 1.35);
    canvas.width = Math.round(viewWidth * dpr); canvas.height = Math.round(viewHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    feeds = []; packets = []; outgoing = []; outputs = [];
    const mobile = viewWidth < 680, lanes = mobile ? 4 : 6;
    const bottomFeeds = heroRoutes.filter(route => route.points[0].y >= stageRect.height);
    for (let lane = 0; lane < lanes; lane++) {
      const side = lane < lanes / 2 ? -1 : 1, rank = lane % (lanes / 2);
      const margin = mobile ? 5 + rank * 5 : 10 + rank * 13;
      const gutter = side < 0 ? margin : viewWidth - margin;
      const inner = side < 0 ? viewWidth * (.18 + rank * .055) : viewWidth * (.82 - rank * .055);
      const inlet = bottomFeeds[Math.floor(lane / lanes * bottomFeeds.length)];
      if (!inlet) continue;
      const points = [{x:gutter, y:docHeight + 30}];
      let x = gutter;
      for (let y = docHeight - 130 - lane * 40; y > stageY + stageRect.height + 160; y -= mobile ? 330 : 390) {
        const nextX = x === gutter ? inner : gutter;
        const cut = Math.min(24, Math.abs(nextX - x) / 2);
        const direction = Math.sign(nextX - x);
        points.push({x, y}, {x:x + direction * cut, y:y - cut}, {x:nextX - direction * cut, y:y - cut}, {x:nextX, y:y - cut * 2});
        x = nextX;
      }
      const inletPoints = inlet.points.map(p => ({x:p.x + stageX, y:p.y + stageY}));
      const joinY = inletPoints[0].y + 55 + rank * 12;
      points.push({x, y:joinY + 24}, {x:x - side * 24, y:joinY}, {x:inletPoints[0].x, y:joinY}, ...inletPoints);
      const spacing = mobile ? 2200 : 4200, speed = mobile ? 230 : 330;
      const firstHead = (lane + .2 + hash(lane + 9) * .6) / lanes * spacing;
      const route = { ...measure(points), hitsCore:true, next:now + (spacing - firstHead) / speed };
      feeds.push(route);
      // Stagger the lanes so the bottom edge never launches a synchronized burst.
      for (let head = firstHead; head < route.length; head += spacing) makePacket(route, now - head / speed);
    }
    const support = rect(document.querySelector('.hero-support'));
    const header = rect(document.querySelector('.site-header'));
    const origin = { x:exit.x + stageX, y:exit.y + stageY };
    const busY = Math.max(origin.y + 10, support.top - 10);
    for (let index = 0; index < targets.length; index++) {
      const element = targets[index], box = rect(element), cx = (box.left + box.right) / 2;
      const points = [origin, {x:origin.x,y:busY}];
      let endpoint;
      if (index < 4) {
        endpoint = {x:cx,y:box.top - 3};
        const firstRow = rect(targets[0]);
        if (box.top > firstRow.bottom) {
          const edge = index % 2 ? support.right - 3 : support.left + 3;
          points.push({x:edge,y:busY},{x:edge,y:box.top - 8},{x:cx,y:box.top - 8});
        } else points.push({x:cx,y:busY});
      } else if (index === 4) {
        endpoint = {x:cx,y:box.bottom + 3};
        points.push({x:cx,y:busY});
      } else {
        const left = cx < viewWidth / 2, lane = index % 2;
        const edge = left ? Math.max(7,stageX + 10 + lane * 8) : Math.min(viewWidth - 7,stageX + stageRect.width - 10 - lane * 8);
        const y = header.bottom + 11 + lane * 9;
        endpoint = {x:cx,y:box.bottom + 3};
        points.push({x:edge,y:busY},{x:edge,y:y + 16},{x:edge + (left ? 16 : -16),y},{x:cx,y});
      }
      points.push(endpoint);
      outputs.push({ ...measure(points), element, target:selectors[index] });
    }
  }
  function advance(time) {
    now = time;
    for (const route of feeds) {
      if (now >= route.next) {
        makePacket(route);
        route.next = now + (viewWidth < 680 ? 2200 / 230 : 4200 / 330);
      }
    }
    for (const packet of packets) {
      if (!packet.hit && (now - packet.start) * packet.speed >= packet.route.length) {
        packet.hit = true;
        const end = packet.route.points.at(-1);
        onArrival(packet.strength, {x:end.x - stageX,y:end.y - stageY});
      }
    }
    packets = packets.filter(p => (now - p.start) * p.speed < p.route.length + p.tail);
    outgoing = outgoing.filter(p => (now - p.start) * p.speed < p.route.length + p.tail);
  }
  function emit(strength, time) {
    if (!outputs.length) return;
    // Visit every permitted control in turn instead of multiplying each exit ninefold.
    const route = outputs[outputIndex++ % outputs.length];
    const speed = Math.max(viewWidth < 680 ? 280 : 420,route.length / 1.25);
    outgoing.push({route,start:time,speed,tail:viewWidth < 680 ? 24 : 32,strength:strength * .56});
  }
  function draw(time) {
    now = time;
    const viewY = scrollY;
    ctx.clearRect(0,0,viewWidth,viewHeight);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.save(); ctx.translate(0,-viewY);
    for (const route of feeds) stroke(ctx,route.points,'rgba(58,138,171,.15)',.8);
    for (const packet of packets) {
      const head = (now - packet.start) * packet.speed;
      const front = at(packet.route,head), back = at(packet.route,head - packet.tail);
      if (Math.max(front.y,back.y) < viewY - 20 || Math.min(front.y,back.y) > viewY + viewHeight + 20) continue;
      rainbow(packet,head,ctx);
    }
    // DOM content is above this canvas. Its actual alpha handles occlusion, preserving
    // the transparent space around glyphs and within transparent image pixels.
    for (const route of outputs) {
      if (route.points[0].y < viewY - 70) continue;
      stroke(ctx,route.points,'rgba(168,209,226,.085)',.8);
    }
    for (const packet of outgoing) {
      if (packet.route.points[0].y < viewY - 70) continue;
      white(packet.route,(now - packet.start) * packet.speed,packet.tail,packet.strength,false,ctx);
    }
    ctx.restore();
  }
  function clear() { packets = []; outgoing = []; }
  return { resize, advance, draw, emit, clear };
};
