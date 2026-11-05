'use strict';
/* Current follows the same paths as the etched circuit board.
 * Earlier ThreeUI attribution is retained in assets/THREEUI-LICENSE.txt. */
(() => {
  const stage = document.getElementById('logo-stage');
  const canvas = document.getElementById('research-field');
  const logo = document.getElementById('logo-object');
  const coreElement = logo?.querySelector('.logo-core');
  const coreCanvas = document.getElementById('core-current');
  const toggle = document.getElementById('motion-toggle');
  if (!stage || !canvas || !logo || !toggle) return;
  const ctx = canvas.getContext('2d');
  const coreCtx = coreCanvas?.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const board = document.createElement('canvas');
  const boardCtx = board.getContext('2d');
  let width = 1, height = 1, dpr = 1, frame = 0, last = 0, time = 0;
  let visible = true, paused = reduced.matches;
  let outline = [], centerY = 0, impactAt = -Infinity, impactStrength = 0;
  let routes = [], pulses = [], nextSurge = .35, previousRoute = -1;
  let coreWidth = 1, coreHeight = 1, coreLeft = 0, coreTop = 0;
  let rimPath = null, trianglePath = null, ornamentPaths = [], exitPaths = [], coilMasks = [];
  let whitePackets = [], contacts = [], packetSerial = 0, pageField = null;
  let nextWhiteAt = 0;
  let coreExit = {x:0,y:0};
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const hash = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  let eventNumber = 0;
  const chance = () => hash(++eventNumber * 1.819);
  const updateToggle = () => {
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? 'Play motion ▷' : 'Pause motion Ⅱ';
    stage.classList.toggle('motion-paused', paused || !visible || document.hidden);
  };
  updateToggle();
  if (!ctx || !boardCtx) {
    toggle.disabled = true; toggle.textContent = 'Motion unavailable';
    stage.classList.add('motion-paused'); return;
  }

  function measure(points) {
    const stops = [0];
    for (let i = 1; i < points.length; i++) {
      stops.push(stops[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
    }
    return { points, stops, length: stops[stops.length - 1] };
  }
  function at(path, distance) {
    const d = clamp(distance, 0, path.length);
    for (let i = 1; i < path.points.length; i++) {
      if (d <= path.stops[i] || i === path.points.length - 1) {
        const a = path.points[i - 1], b = path.points[i];
        const f = (d - path.stops[i - 1]) / Math.max(.001, path.stops[i] - path.stops[i - 1]);
        return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, angle: Math.atan2(b.y - a.y, b.x - a.x) };
      }
    }
    return { ...path.points[0], angle: 0 };
  }
  // Retain every corner when clipping a moving current segment to its conductor.
  function section(path, start, end) {
    const a = clamp(start, 0, path.length), b = clamp(end, 0, path.length);
    if (b <= a) return [];
    const points = [at(path, a)];
    for (let i = 1; i < path.points.length - 1; i++) {
      if (path.stops[i] > a && path.stops[i] < b) points.push(path.points[i]);
    }
    points.push(at(path, b));
    return points;
  }
  function fitCoreOutline(stageRect) {
    const rect = logo.getBoundingClientRect();
    const cx = rect.left - stageRect.left + rect.width / 2;
    centerY = rect.top - stageRect.top + rect.height / 2;
    // The opaque hexagonal rim of the existing emblem, inside its transparent image.
    const artHeight = Math.min(rect.height, rect.width * 1168 / 1347);
    const artWidth = artHeight * 1347 / 1168;
    outline = [[0,-.475],[.36,-.25],[.36,.24],[0,.465],[-.36,.24],[-.36,-.25]]
      .map(([x,y]) => ({ x: cx + x * artWidth, y: centerY + y * artHeight }));
    coreWidth = rect.width; coreHeight = rect.height;
    coreLeft = rect.left - stageRect.left; coreTop = rect.top - stageRect.top;
    // Trace the chrome channels in the existing artwork, in its own image coordinates.
    // This canvas sits above the opaque emblem and scales with its impact pulse.
    const artworkPoint = ([x,y]) => ({
      x: coreWidth / 2 + (x - 1347 / 2) * artWidth / 1347,
      y: coreHeight / 2 + (y - 1168 / 2) * artHeight / 1168
    });
    const loop = points => measure([...points, points[0]].map(artworkPoint));
    rimPath = loop([[674,42],[1140,316],[1140,818],[674,1090],[208,818],[208,316]]);
    trianglePath = measure([[674,42],[674,132],[1058,765],[290,765],[674,132]].map(artworkPoint));
    // The six ornamental coils sit behind the three metal triangles and cross.
    coilMasks = [
      [[674,132],[487,451],[861,451]],
      [[489,454],[282,771],[665,771]],
      [[860,454],[682,771],[1066,771]],
      [[644,390],[706,390],[706,960],[644,960]],
      [[542,540],[806,540],[806,567],[542,567]]
    ].map(points => points.map(artworkPoint));
    const coil = (cx,cy,rx,ry,mirror) => {
      const points = [];
      for (const scale of [1,.76]) {
        for (let i = 0; i <= 52; i++) {
          const angle = -Math.PI / 2 + i / 52 * Math.PI * 2;
          const x = cx + Math.cos(angle) * rx * scale;
          points.push([mirror ? 1348 - x : x, cy + Math.sin(angle) * ry * scale]);
        }
      }
      return points;
    };
    ornamentPaths = [false,true].map(mirror => measure([
      [674,132], ...coil(519,350,79,79,mirror),
      ...coil(426,540,97,100,mirror), ...coil(535,783,89,71,mirror),
      [mirror ? 796 : 552,554]
    ].map(artworkPoint)));
    exitPaths = [552,796].map(x => measure([[x,554],[674,554],[674,960],[674,1090],[674,1168]].map(artworkPoint)));
    const exit = artworkPoint([674,1168]);
    coreExit = {x:exit.x + coreLeft,y:exit.y + coreTop};
    if (coreCtx) {
      coreCanvas.width = Math.round(coreWidth * dpr);
      coreCanvas.height = Math.round(coreHeight * dpr);
      coreCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    whitePackets = []; contacts = []; nextWhiteAt = time;
  }
  function nearestDistance(path, point) {
    let nearest = Infinity, distance = 0;
    for (let i = 1; i < path.points.length; i++) {
      const a = path.points[i - 1], b = path.points[i];
      const dx = b.x - a.x, dy = b.y - a.y;
      const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy), 0, 1);
      const gap = Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
      if (gap < nearest) { nearest = gap; distance = path.stops[i - 1] + t * (path.stops[i] - path.stops[i - 1]); }
    }
    return distance;
  }
  function endAtCore(route) {
    // Clip the conductor at the first rim contact. Arrival and the visible pulse agree.
    for (let i = 1; i < route.points.length; i++) {
      const a = route.points[i - 1], b = route.points[i];
      const dx = b.x - a.x, dy = b.y - a.y;
      let first = Infinity;
      for (let j = 0; j < outline.length; j++) {
        const c = outline[j], d = outline[(j + 1) % outline.length];
        const ex = d.x - c.x, ey = d.y - c.y, denominator = dx * ey - dy * ex;
        if (Math.abs(denominator) < .00001) continue;
        const rx = c.x - a.x, ry = c.y - a.y;
        const t = (rx * ey - ry * ex) / denominator;
        const u = (rx * dy - ry * dx) / denominator;
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) first = Math.min(first, t);
      }
      if (Number.isFinite(first)) {
        const distance = route.stops[i - 1] + Math.hypot(dx, dy) * first;
        return { ...route, ...measure(section(route, 0, distance)), hitsCore: true };
      }
    }
    return { ...route, hitsCore: false };
  }
  function coreCharge() {
    const age = time - impactAt;
    if (age < 0 || age >= .43) return 0;
    const envelope = age < .055 ? Math.sin(age / .055 * Math.PI / 2) : Math.pow(1 - (age - .055) / .375, 2);
    return envelope * impactStrength;
  }
  function receiveSurge(strength, contact) {
    impactStrength = Math.min(1, Math.max(coreCharge(), strength));
    impactAt = time;
    if (!coreCtx || !rimPath || !contact) return;
    const point = { x: contact.x - coreLeft, y: contact.y - coreTop };
    const entry = nearestDistance(rimPath, point);
    contacts.push({ start: time, point, rim: at(rimPath, entry), strength });
    // Nearby arrivals recharge the emblem; release only an occasional white packet.
    if (time < nextWhiteAt || whitePackets.length >= 2) return;
    nextWhiteAt = time + 3.2;
    const aroundRim = measure([point,...section(rimPath,entry,rimPath.length),...rimPath.points.slice(1)]);
    const side = point.x < coreWidth / 2 ? 0 : 1;
    const stages = [
      {path:aroundRim,duration:1.45,kind:'rim'},
      {path:trianglePath,duration:.8,kind:'triangle'},
      {path:ornamentPaths[side],duration:1.55,kind:'coils'},
      {path:exitPaths[side],duration:.65,kind:'exit'}
    ];
    let offset = 0;
    for (const step of stages) { step.offset = offset; offset += step.duration; }
    whitePackets.push({id:++packetSerial,start:time,strength,stages,duration:offset,emitted:false});
  }
  function paintCore() {
    if (!coreElement) return;
    const charge = coreCharge();
    coreElement.style.setProperty('--core-scale', String(1 + charge * .022));
    coreElement.style.setProperty('--core-brightness', String(1 + charge * .19));
    coreElement.style.setProperty('--core-glow', `${charge * 19}px`);
  }
  function stroke(target, points, color, weight) {
    if (points.length < 2) return;
    target.beginPath();
    points.forEach((p, i) => i ? target.lineTo(p.x, p.y) : target.moveTo(p.x, p.y));
    target.strokeStyle = color; target.lineWidth = weight; target.stroke();
  }
  function makeBoard() {
    routes = []; pulses = []; previousRoute = -1; nextSurge = time + .25;
    const cx = width / 2, cy = centerY, mobile = width < 680;
    const core = Math.min(width * .31, mobile ? 132 : 188);
    const lanes = mobile ? 4 : 6;
    // Bundles of manufactured 45-degree traces, with space between the routes.
    for (const side of [-1, 1]) {
      for (const band of [-1, 1]) {
        for (let lane = 0; lane < lanes; lane++) {
          const gap = mobile ? 9 : 11;
          const outerY = cy + band * (height * .30 + lane * gap);
          const shoulder = cx + side * (core + Math.max(18, width * .10) + lane * gap);
          const bend = mobile ? 23 + lane * 2 : 40 + lane * 3;
          const turnY = outerY - band * bend;
          const inwardX = cx + side * (core * .90 + lane * 4);
          const points = [
            { x: side < 0 ? -22 : width + 22, y: outerY },
            { x: shoulder, y: outerY },
            { x: shoulder - side * bend, y: turnY },
            { x: inwardX, y: turnY },
            { x: inwardX - side * 30, y: turnY - band * 30 },
            { x: cx + side * core * .48, y: turnY - band * 30 }
          ];
          const route = measure(points);
          route.key = routes.length + 1;
          if (lane % 3 === 1) {
            const tapDistance = route.stops[2] + (route.stops[3] - route.stops[2]) * .48;
            const p = at(route, tapDistance), offset = mobile ? 20 : 30;
            route.branchAt = tapDistance;
            route.branch = measure([p,
              { x: p.x - side * offset, y: p.y - band * offset },
              { x: p.x - side * (offset + 24), y: p.y - band * offset }
            ]);
          }
          routes.push(route);
        }
      }
    }
    // Vertical feeds keep the current visible above and below the emblem on phones.
    for (const band of [-1, 1]) {
      for (let lane = -3; lane <= 3; lane++) {
        const side = lane < 0 ? -1 : 1;
        const x = cx + lane * (mobile ? 18 : 25);
        const y = cy + band * height * .36;
        const route = measure([
          { x, y: band < 0 ? -15 : height + 15 },
          { x, y },
          { x: x + side * 26, y: y - band * 26 },
          { x: x + side * 26, y: cy + band * height * .20 }
        ]);
        route.key = routes.length + 1;
        routes.push(route);
      }
    }
    routes = routes.map(route => {
      // Reach the rim even when the emblem is smaller to make room on phones.
      const inward = { ...route, ...measure([...route.points, { x: cx, y: cy }]) };
      const clipped = endAtCore(inward);
      if (clipped.branch) {
        if (clipped.branchAt >= clipped.length) clipped.branch = null;
        else clipped.branch = endAtCore(clipped.branch);
      }
      return clipped;
    });
    board.width = canvas.width; board.height = canvas.height;
    boardCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    boardCtx.lineJoin = 'round'; boardCtx.lineCap = 'round';
    for (const route of routes) {
      const tracks = route.branch ? [route, route.branch] : [route];
      for (const track of tracks) {
        stroke(boardCtx, track.points, 'rgba(0,6,12,.6)', 3);
        stroke(boardCtx, track.points, 'rgba(61,137,164,.25)', 1);
        const p = track.points[track.points.length - 1];
        boardCtx.strokeStyle = 'rgba(91,173,196,.3)'; boardCtx.lineWidth = .8;
        boardCtx.strokeRect(p.x - 2, p.y - 2, 4, 4);
      }
    }
  }
  function launch(route, start = time, scale = 1) {
    const speed = (width < 680 ? 220 : 380) + chance() * 190;
    pulses.push({ route, start, speed, tail: Math.min(route.length * .34, (65 + chance() * 55) * scale), key: chance() * 900, strength: scale, branched: false, hit: false });
  }
  function spawnSurge() {
    let index = Math.floor(chance() * routes.length);
    if (index === previousRoute) index = (index + 7) % routes.length;
    previousRoute = index;
    launch(routes[index]);
    // Unlit intervals are intentional; only a few tracks carry current at once.
    nextSurge = time + 2.4 + chance() * 1.4;
  }
  function paintPulse(pulse, head, target = ctx) {
    const route = pulse.route, start = Math.max(0, head - pulse.tail), end = Math.min(route.length, head);
    if (end <= start) return;
    const visiblePoints = section(route, start, end);
    const alpha = pulse.strength;
    stroke(target, visiblePoints, `rgba(145,186,255,${.045 * alpha})`, 14);
    // Brightness is measured along the conductor, so the tail turns with every corner.
    const pieces = Math.ceil((end - start) / 4);
    for (let i = 0; i < pieces; i++) {
      const a = start + (end - start) * i / pieces;
      const b = start + (end - start) * (i + 1) / pieces;
      const progress = clamp((b - (head - pulse.tail)) / pulse.tail, 0, 1);
      const strength = Math.pow(progress, .8) * alpha;
      const points = section(route, a, b);
      const hue = 285 * (1 - progress);
      // The spectrum converges to cool white over the last few pixels at the rim.
      const merge = route.hitsCore ? clamp((b - route.length + 18) / 18, 0, 1) : 0;
      const saturation = 100 * (1 - merge), lightness = 60 + merge * 34;
      stroke(target, points, `hsla(${hue},${saturation}%,${lightness}%,${strength * .17})`, 9);
      stroke(target, points, `hsla(${hue},${saturation}%,${lightness}%,${strength * .95})`, 2.5);
      stroke(target, points, `rgba(244,250,255,${strength * .55})`, .6);
    }
    // Fine discharge texture stays confined to the short moving front.
    const frontStart = Math.max(start, end - 30), filament = [];
    const samples = Math.max(3, Math.ceil((end - frontStart) / 3));
    for (let i = 0; i <= samples; i++) {
      const d = frontStart + (end - frontStart) * i / samples, point = at(route, d);
      const jitter = (hash(pulse.key + i * 13 + Math.floor(time * 18)) - .5) * 2.2 * Math.sin(Math.PI * i / samples);
      filament.push({ x: point.x - Math.sin(point.angle) * jitter, y: point.y + Math.cos(point.angle) * jitter });
    }
    const fade = clamp((route.length + pulse.tail - head) / pulse.tail, 0, 1);
    stroke(target, filament, `rgba(179,242,255,${alpha * .65 * fade})`, .65);
  }
  function paintWhiteTrail(path, head, tail, strength, wrap = true, target = coreCtx) {
    // Split at the closed path seam instead of drawing a chord through the emblem.
    const pieces = Math.ceil(tail / 4);
    for (let i = 0; i < pieces; i++) {
      let a = head - tail + tail * i / pieces, b = head - tail + tail * (i + 1) / pieces;
      const alpha = Math.pow((i + 1) / pieces, 1.5) * strength;
      if (b <= 0) continue;
      a = Math.max(0, a);
      const segments = [];
      if (wrap) {
        const from = a % path.length, to = b % path.length;
        if (Math.floor(a / path.length) !== Math.floor(b / path.length)) {
          segments.push(section(path, from, path.length), section(path, 0, to));
        } else segments.push(section(path, from, to));
      } else segments.push(section(path, a, b));
      for (const points of segments) {
        stroke(target, points, `rgba(168,222,255,${alpha * .09})`, 10);
        stroke(target, points, `rgba(217,241,255,${alpha * .28})`, 4);
        stroke(target, points, `rgba(247,253,255,${alpha})`, 1.25);
      }
    }
  }
  function paintCirculation() {
    if (!coreCtx) return;
    coreCtx.clearRect(0, 0, coreWidth, coreHeight);
    coreCtx.lineJoin = 'round'; coreCtx.lineCap = 'round';
    for (const contact of contacts) {
      const age = time - contact.start, alpha = Math.max(0, 1 - age / .32) * contact.strength;
      if (!alpha) continue;
      stroke(coreCtx, [contact.point, contact.rim], `rgba(225,247,255,${alpha * .7})`, 1.3);
      coreCtx.beginPath(); coreCtx.arc(contact.point.x, contact.point.y, 2 + age * 12, 0, Math.PI * 2);
      coreCtx.fillStyle = `rgba(226,247,255,${alpha * .28})`; coreCtx.fill();
    }
    for (const packet of whitePackets) {
      for (const step of packet.stages) {
        const age = time - packet.start - step.offset;
        if (age < 0 || age > step.duration + .14) continue;
        const speed = step.path.length / step.duration;
        coreCtx.save();
        if (step.kind === 'coils') {
          // Current follows the exposed coils, disappearing beneath the metal faces.
          for (const polygon of coilMasks) {
            coreCtx.beginPath(); coreCtx.rect(0,0,coreWidth,coreHeight);
            polygon.forEach((point,index) => index ? coreCtx.lineTo(point.x,point.y) : coreCtx.moveTo(point.x,point.y));
            coreCtx.closePath();
            coreCtx.clip('evenodd');
          }
        }
        paintWhiteTrail(step.path,age * speed,Math.min(speed * .12,40),packet.strength * .72,false);
        coreCtx.restore();
      }
    }
  }
  function draw() {
    if (visible) {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(board, 0, 0, width, height);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const pulse of pulses) {
        const age = time - pulse.start;
        if (age < 0) continue;
        paintPulse(pulse, age * pulse.speed);
      }
      paintCirculation();
    }
    pageField?.draw(time);
  }
  function advance(dt) {
    time += dt;
    pageField?.advance(time);
    if (time >= nextSurge) spawnSurge();
    // A branch only energizes when its parent current reaches that junction.
    const branches = [];
    for (const pulse of pulses) {
      const head = (time - pulse.start) * pulse.speed;
      if (pulse.route.branch && !pulse.branched && head >= pulse.route.branchAt) {
        pulse.branched = true;
        branches.push({ ...pulse, route: pulse.route.branch, start: time, tail: 30, strength: .48, branched: true, hit: false });
      }
      if (pulse.route.hitsCore && !pulse.hit && head >= pulse.route.length) {
        pulse.hit = true;
        receiveSurge(pulse.strength, at(pulse.route, pulse.route.length));
      }
    }
    pulses = pulses.filter(p => (time - p.start) * p.speed < p.route.length + p.tail);
    pulses.push(...branches);
    contacts = contacts.filter(contact => time - contact.start < .32);
    for (const packet of whitePackets) {
      if (!packet.emitted && time - packet.start >= packet.duration) {
        packet.emitted = true;
        pageField?.emit(packet.strength,packet.start + packet.duration);
      }
    }
    whitePackets = whitePackets.filter(packet => time - packet.start < packet.duration + .16);
  }
  const size = () => {
    const rect = stage.getBoundingClientRect();
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    dpr = Math.min(devicePixelRatio || 1, width < 680 ? 1.35 : 1.5);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fitCoreOutline(rect);
    impactAt = -Infinity;
    makeBoard();
    pageField?.resize({stageRect:rect,heroRoutes:routes,exit:coreExit});
    if (paused) pageField?.clear();
    draw(); paintCore();
  };
  function animate(now) {
    frame = 0;
    if (paused || document.hidden) { last = 0; return; }
    if (!last || now - last >= 1000 / 30) {
      const dt = last ? Math.min((now - last) / 1000, .1) : 0;
      last = now; advance(dt); draw(); if (visible) paintCore();
    }
    frame = requestAnimationFrame(animate);
  }
  const stop = () => { if (frame) cancelAnimationFrame(frame); frame = 0; last = 0; };
  const resume = () => { if (!paused && !document.hidden && !frame) frame = requestAnimationFrame(animate); };
  toggle.addEventListener('click', () => { paused = !paused; updateToggle(); if (paused) stop(); else resume(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; updateToggle(); if (paused) { stop(); pulses = []; whitePackets = []; contacts = []; pageField?.clear(); impactAt = -Infinity; draw(); paintCore(); } else resume(); });
  let resizeFrame = 0;
  const queueSize = () => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; size(); });
  };
  new ResizeObserver(queueSize).observe(document.body);
  new ResizeObserver(queueSize).observe(stage);
  addEventListener('resize',queueSize);
  addEventListener('scroll',() => pageField?.draw(time),{passive:true});
  new IntersectionObserver(([entry]) => { visible = !!entry?.isIntersecting; updateToggle(); if (visible) { draw(); paintCore(); } }).observe(stage);
  document.addEventListener('visibilitychange', () => { updateToggle(); if (document.hidden) stop(); else resume(); });
  addEventListener('pagehide', stop); addEventListener('pageshow', resume);
  pageField = window.createLabCircuitField?.({measure,at,section,stroke,rainbow:paintPulse,white:paintWhiteTrail,onArrival:receiveSurge}) || null;
  size(); resume();
})();
