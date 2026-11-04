'use strict';
// Interactive example follows the least-significant-trit-first packing in the TK Integers report.
const trits = [-1, 0, 1, 0, -1];
const tritNames = { '-1': 'minus one', '0': 'zero', '1': 'plus one' };
const tritSymbols = { '-1': '−1', '0': '0', '1': '+1' };
document.querySelectorAll('[data-trit]').forEach(button => {
  button.addEventListener('click', () => {
    const index = Number(button.dataset.trit);
    trits[index] = trits[index] === 1 ? -1 : trits[index] + 1;
    button.textContent = tritSymbols[trits[index]];
    button.className = 'trit ' + (trits[index] < 0 ? 'minus' : trits[index] > 0 ? 'plus' : 'zero');
    button.setAttribute('aria-label', `Trit ${index + 1}: ${tritNames[trits[index]]}. Activate to change.`);
    const byte = trits.reduce((total, digit, i) => total + (digit + 1) * 3 ** i, 0);
    document.getElementById('packed-binary').textContent = byte.toString(2).padStart(8, '0');
    document.getElementById('packed-decimal').textContent = `${byte} / 242`;
  });
});

// Adapted from ThreeUI Liquid Form, Copyright (c) 2026 Meng To, MIT.
// The source shaders are preserved. This host adds mobile resolution limits, a
// 30 FPS cap, reduced motion, a pause button, and tab-visibility resumption.
(() => {
  const host = document.getElementById('liquid-host');
  const canvas = document.getElementById('liquid');
  const toggle = document.getElementById('motion-toggle');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reducedMotion.matches, visible = true, frame = 0, lastFrame = 0, elapsed = 0;
  let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0, available = false;
  let gl, program, uniforms, buffer, vertex, fragment;
  const updateButton = () => {
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? 'Play motion ▷' : 'Pause motion Ⅱ';
  };
  const stop = () => { if (frame) cancelAnimationFrame(frame); frame = 0; lastFrame = 0; };
  const draw = () => {
    if (!available) return;
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.time, elapsed * .4 + 8);
    gl.uniform2f(uniforms.mouse, mouseX, mouseY);
    gl.uniform1f(uniforms.morph, 1.4); gl.uniform1f(uniforms.noise, .9);
    gl.uniform1f(uniforms.mouseAmount, .12); gl.uniform1f(uniforms.metal, 1);
    gl.uniform1f(uniforms.camera, 5.5);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const render = now => {
    frame = 0;
    if (!available || paused || !visible || document.hidden) { lastFrame = 0; return; }
    if (!lastFrame || now - lastFrame >= 1000 / 30) {
      elapsed += lastFrame ? Math.min((now - lastFrame) / 1000, .1) : 0;
      lastFrame = now;
      mouseX += (targetX - mouseX) * .065; mouseY += (targetY - mouseY) * .065;
      draw();
    }
    frame = requestAnimationFrame(render);
  };
  const resume = () => { if (available && !paused && visible && !document.hidden && !frame) frame = requestAnimationFrame(render); };
  const fallback = () => {
    available = false; stop(); host.classList.remove('webgl-ready');
    toggle.textContent = 'Still image'; toggle.disabled = true; toggle.setAttribute('aria-pressed', 'true');
  };
  const compile = (type, source) => {
    const shader = gl.createShader(type); if (!shader) throw new Error('Shader unavailable');
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); throw new Error('Shader compilation failed'); }
    return shader;
  };
  const resize = () => {
    if (!available) return;
    const bounds = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, innerWidth < 680 ? .85 : 1.15);
    canvas.width = Math.max(1, Math.round(bounds.width * dpr)); canvas.height = Math.max(1, Math.round(bounds.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height); draw();
  };
  try {
    gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
    if (!gl) { console.warn('Liquid Form: WebGL is unavailable; using the static fallback.'); fallback(); return; }
    vertex = compile(gl.VERTEX_SHADER, VELOX_VERTEX_SHADER); fragment = compile(gl.FRAGMENT_SHADER, VELOX_FRAGMENT_SHADER);
    program = gl.createProgram(); if (!program) throw new Error('Program unavailable');
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Shader link failed');
    gl.useProgram(program); buffer = gl.createBuffer(); if (!buffer) throw new Error('Buffer unavailable');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a_pos'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    uniforms = Object.fromEntries(Object.entries({resolution:'u_res',time:'u_time',mouse:'u_mouse',morph:'u_morph',noise:'u_noise_scale',mouseAmount:'u_mouse_amount',metal:'u_metal',camera:'u_camera'}).map(([key,value]) => [key,gl.getUniformLocation(program,value)]));
    available = true; resize(); host.classList.add('webgl-ready');
  } catch (error) { console.warn('Liquid Form fallback: ' + error.message); fallback(); return; }
  updateButton();
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(([entry]) => { visible = !!entry?.isIntersecting; if (visible) resume(); else stop(); }).observe(host);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else resume(); });
  toggle.addEventListener('click', () => { paused = !paused; updateButton(); if (paused) stop(); else resume(); });
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; updateButton(); if (paused) { stop(); draw(); } else resume(); });
  canvas.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || reducedMotion.matches || paused) return;
    const rect = canvas.getBoundingClientRect(); targetX = ((event.clientX - rect.left) / rect.width) * 2 - 1; targetY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }, { passive: true });
  canvas.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); fallback(); });
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', resume);
  resume();
})();
