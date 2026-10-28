// « La main sur l'eau » : l'image d'ouverture rendue en WebGL (OGL).
// Le curseur ou le doigt crée des ondes ; une brume qui respire passe sur l'image ;
// à l'ouverture, la brume se retire en cercle depuis le point où tombe la goutte.
import { Renderer, Program, Mesh, Triangle, Texture } from "../vendor/ogl.min.mjs";
import { state } from "./core.js?v=20261028-2";

const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform sampler2D uDisp;
uniform vec2 uRes;
uniform vec2 uTexSize;
uniform vec2 uFocus;
uniform vec2 uDrop;
uniform float uTime;
uniform float uReveal;
uniform float uTexMix;
uniform float uHasDisp;
uniform float uWaterLine;
uniform float uScroll;
uniform float uBreath;
uniform float uCalm;
uniform float uFlow;
uniform float uWarm;
uniform vec3 uFog;
uniform vec3 uTint;
uniform vec4 uRipples[10];
varying vec2 vUv;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }

vec2 coverUv(vec2 uv) {
  float ra = uRes.x / uRes.y;
  float ta = uTexSize.x / uTexSize.y;
  vec2 s = vec2(1.0);
  if (ra > ta) { s.y = ta / ra; } else { s.x = ra / ta; }
  vec2 c = s * 0.5 + uFocus * (1.0 - s);
  return c + (uv - 0.5) * s;
}

float ripples(vec2 uv, float aspect, out vec2 dir) {
  float h = 0.0; dir = vec2(0.0);
  for (int i = 0; i < 10; i++) {
    vec4 r = uRipples[i];
    float age = uTime - r.z;
    if (r.w <= 0.0 || age < 0.0 || age > 5.0) continue;
    vec2 d = uv - r.xy; d.x *= aspect;
    float dist = length(d);
    float front = age * 0.3;
    float env = exp(-abs(dist - front) * 11.0) * exp(-age * 0.85) * r.w;
    float w = sin((dist - front) * 58.0) * env;
    h += w;
    dir += d / (dist + 0.0001) * w;
  }
  return h;
}

vec2 mirror(vec2 p) { return abs(fract(p * 0.5) * 2.0 - 1.0); }

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  float t = uTime;
  float moving = 1.0 - uCalm;

  vec2 dir;
  float h = ripples(uv, aspect, dir);
  vec2 duv = uv + dir * 0.011;

  float wmask = (1.0 - smoothstep(uWaterLine - 0.06, uWaterLine + 0.03, uv.y)) * moving;
  if (uHasDisp > 0.5) {
    vec2 dd = texture2D(uDisp, mirror(uv * vec2(aspect, 1.0) * 1.15 + vec2(t * 0.009, t * 0.013))).rg - 0.5;
    duv += dd * 0.014 * wmask;
  }
  duv.y += sin(uv.x * 5.0 + t * 0.55) * 0.0016 * moving;
  duv.y += uScroll * 0.07;

  vec3 tex = texture2D(uTex, coverUv(duv)).rgb;

  vec3 col = tex;
  if (uTexMix < 0.999) {
    vec3 base = mix(uFog, uTint, smoothstep(0.0, 1.0, 1.0 - uv.y) * 0.55);
    base = mix(base, uFog, fbm(vec2(uv.x * 3.0 + t * 0.02, uv.y * 5.0)) * 0.6);
    col = mix(base, tex, uTexMix);
  }

  if (uFlow > 0.0) {
    float f = fbm(vec2(uv.x * 2.4 - t * 0.06, uv.y * 13.0 + sin(uv.x * 3.0) * 0.6));
    float streak = smoothstep(0.6, 0.92, f) * (0.35 + 0.65 * (1.0 - uv.y));
    col += vec3(1.0, 0.93, 0.86) * streak * 0.22 * uFlow;
  }
  if (uWarm > 0.0) {
    col += vec3(0.88, 0.56, 0.42) * max(h, 0.0) * 0.12 * uWarm;
  }

  col += h * 0.05;

  float mist = fbm(vec2(uv.x * 2.4 + t * 0.016, uv.y * 4.0 - t * 0.011));
  col = mix(col, uFog, mist * (0.08 + 0.07 * uBreath) * moving + mist * 0.05 * uCalm);

  vec2 dp = uv - uDrop; dp.x *= aspect;
  float dist = length(dp);
  float R = uReveal * (1.2 + aspect * 0.8);
  float edge = 1.0 - smoothstep(R - 0.14, R, dist);
  float ring = exp(-abs(dist - R) * 28.0) * (1.0 - uReveal) * step(0.001, uReveal);
  col = mix(uFog, col, edge) + ring * 0.14;

  col += (hash(uv * uRes + fract(t * 7.0)) - 0.5) * 0.022 * moving;
  gl_FragColor = vec4(col, 1.0);
}
`;

const hex = (h) => {
  const n = parseInt(h.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

function breathAt(t) {
  // 4 s d'inspiration, 6 s d'expiration
  const p = t % 10;
  if (p < 4) return 0.5 - 0.5 * Math.cos((p / 4) * Math.PI);
  return 0.5 + 0.5 * Math.cos(((p - 4) / 6) * Math.PI);
}

export function initWater(section) {
  const canvas = section.querySelector(".hero-gl");
  if (!canvas) return null;

  let renderer;
  try {
    renderer = new Renderer({ canvas, dpr: 1, alpha: false, antialias: false, powerPreference: "high-performance" });
  } catch (e) {
    section.classList.add("no-webgl");
    return null;
  }
  const gl = renderer.gl;
  if (!gl) { section.classList.add("no-webgl"); return null; }

  const ds = section.dataset;
  const focus = (ds.focus || "0.5,0.5").split(",").map(Number);
  const drop = (ds.drop || "0.5,0.55").split(",").map(Number);
  const ripplesArr = new Array(40).fill(0); // tableau simple : OGL le transmet tel quel au shader
  let rIndex = 0;

  const texture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });
  const disp = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });

  const uniforms = {
    uTex: { value: texture },
    uDisp: { value: disp },
    uRes: { value: [1, 1] },
    uTexSize: { value: [16, 9] },
    uFocus: { value: [focus[0], 1 - focus[1]] },
    uDrop: { value: [drop[0], 1 - drop[1]] },
    uTime: { value: 0 },
    uReveal: { value: state.calm ? 1 : 0 },
    uTexMix: { value: 0 },
    uHasDisp: { value: 0 },
    uWaterLine: { value: ds.water ? 1 - Number(ds.water) : -1 },
    uScroll: { value: 0 },
    uBreath: { value: 0 },
    uCalm: { value: state.calm ? 1 : 0 },
    uFlow: { value: Number(ds.flow || 0) },
    uWarm: { value: Number(ds.warm || 0) },
    uFog: { value: hex(ds.fog || "#E9EDEC") },
    uTint: { value: hex(ds.tint || "#9DB2BA") },
    uRipples: { value: ripplesArr },
  };

  let program;
  try {
    program = new Program(gl, { vertex, fragment, uniforms });
  } catch (e) {
    section.classList.add("no-webgl");
    return null;
  }
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

  const start = performance.now();
  const now = () => (performance.now() - start) / 1000;
  // contexte graphique perdu (onglet en arrière-plan sur mobile, pilote) : on bascule sur l'image fixe
  let lost = false;
  let dprScale = 1;
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); lost = true; section.classList.add("no-webgl"); });
  canvas.addEventListener("webglcontextrestored", () => { window.location.reload(); });
  let visible = true;
  let raf = 0;
  let needsFrame = true;

  // Résolution de rendu adaptée à l'image : au-delà de la définition de la texture, on calcule des pixels
  // que l'œil ne voit pas. On reste entre 0,75 et 1,5 pixel physique par pixel CSS.
  function fitDpr(r) {
    const [tw, th] = uniforms.uTexSize.value;
    const ra = r.width / Math.max(1, r.height), ta = tw / th;
    const cssCover = ra > ta ? r.width : r.height * ta; // largeur CSS de l'image une fois recadrée
    const ideal = tw / Math.max(1, cssCover);
    return Math.max(0.75, Math.min(1.5, ideal * 1.15, window.devicePixelRatio || 1));
  }
  function resize() {
    const r = section.getBoundingClientRect();
    chooseSource();
    renderer.dpr = Math.max(0.5, fitDpr(r) * dprScale);
    renderer.setSize(Math.max(1, r.width), Math.max(1, r.height));
    uniforms.uRes.value = [gl.canvas.width, gl.canvas.height];
    placeDrop();
    needsFrame = true;
    if (state.calm) draw();
  }

  // point d'impact de la goutte : donné en coordonnées de l'image, converti en coordonnées d'écran
  let dropImg = drop;
  function placeDrop() {
    const [rw, rh] = uniforms.uRes.value;
    const [tw, th] = uniforms.uTexSize.value;
    const ra = rw / rh, ta = tw / th;
    let sx = 1, sy = 1;
    if (ra > ta) sy = ta / ra; else sx = ra / ta;
    const fx = uniforms.uFocus.value[0], fy = uniforms.uFocus.value[1];
    const cx = sx * 0.5 + fx * (1 - sx), cy = sy * 0.5 + fy * (1 - sy);
    const ix = dropImg[0], iy = 1 - dropImg[1];
    uniforms.uDrop.value = [(ix - cx) / sx + 0.5, (iy - cy) / sy + 0.5];
  }

  let currentSrc = "";
  function chooseSource() {
    const r = section.getBoundingClientRect();
    const portrait = r.width / Math.max(1, r.height) < 0.9;
    const src = (portrait && ds.texM) ? ds.texM : ds.tex;
    dropImg = ((portrait && ds.dropM) ? ds.dropM : (ds.drop || "0.5,0.55")).split(",").map(Number);
    const ratio = ((portrait && ds.ratioM) ? ds.ratioM : (ds.ratio || "1168,784")).split(",").map(Number);
    uniforms.uTexSize.value = ratio;
    placeDrop();
    if (!src || src === currentSrc) return;
    currentSrc = src;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      texture.image = img;
      uniforms.uTexSize.value = [img.naturalWidth, img.naturalHeight];
      placeDrop();
      if (state.calm || !window.gsap) { uniforms.uTexMix.value = 1; draw(); }
      else window.gsap.to(uniforms.uTexMix, { value: 1, duration: 1.2, ease: "sine.out" });
      needsFrame = true;
    };
    img.src = src;
  }

  if (ds.disp && !state.calm) {
    const dimg = new Image();
    dimg.onload = () => { disp.image = dimg; uniforms.uHasDisp.value = 1; };
    dimg.src = ds.disp;
  }

  function draw() {
    uniforms.uTime.value = state.calm ? 6 : now();
    uniforms.uBreath.value = breathAt(uniforms.uTime.value);
    renderer.render({ scene: mesh });
    needsFrame = false;
  }

  // Au repos (aucune onde récente), la brume bouge si lentement que 30 images par seconde suffisent.
  let frame = 0;
  let lastRipple = -10;
  // Régulateur : si l'appareil peine (images trop lentes), on baisse la résolution, puis la cadence.
  let quality = 2; // 2 = normal, 1 = allégé, 0 = image fixe hors interaction
  let samples = 0, sum = 0, prevT = 0;
  function govern(t) {
    if (prevT) { sum += Math.min(100, t - prevT); samples++; }
    prevT = t;
    if (samples < 24) return;
    const avg = sum / samples;
    samples = 0; sum = 0;
    if (avg > 30 && quality > 0) {
      quality--;
      dprScale = quality === 1 ? 0.7 : 0.55;
      resize();
    }
  }
  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (!visible || document.hidden || lost) { prevT = 0; return; }
    govern(t || performance.now()); // mesure l'intervalle réel entre deux images du navigateur
    frame++;
    const busy = now() - lastRipple < 4 || uniforms.uReveal.value < 1 || uniforms.uTexMix.value < 1;
    // après un redimensionnement, le tampon est vide : on redessine toujours au moins une image
    if (!needsFrame) {
      if (!busy && quality === 0) return;
      if (!busy && frame % 2) return;
      if (quality === 1 && frame % 2) return;
    }
    draw();
  }

  function addRipple(x, y, strength = 0.4) {
    if (state.calm) return;
    const i = (rIndex++ % 10) * 4;
    lastRipple = now();
    ripplesArr[i] = x; ripplesArr[i + 1] = y; ripplesArr[i + 2] = lastRipple; ripplesArr[i + 3] = strength;
  }

  // pointeur : petites ondes en mouvement, grande onde à l'appui
  let last = { x: -1, y: -1, t: 0 };
  function toUv(e) {
    const r = section.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
  }
  if (!state.calm) {
    section.addEventListener("pointermove", (e) => {
      const [x, y] = toUv(e);
      const t = performance.now();
      const dx = (x - last.x) * (section.clientWidth / section.clientHeight);
      const dist = Math.hypot(dx, y - last.y);
      if (dist > 0.045 && t - last.t > 110) {
        addRipple(x, y, e.pointerType === "touch" ? 0.5 : 0.32);
        last = { x, y, t };
      }
    }, { passive: true });
    section.addEventListener("pointerdown", (e) => {
      if (e.target.closest("a, button, input, select, textarea")) return;
      const [x, y] = toUv(e);
      addRipple(x, y, 1);
    }, { passive: true });
  }

  const ro = new ResizeObserver(resize);
  ro.observe(section);
  resize();

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }, { rootMargin: "60px" }).observe(section);
  }

  if (state.calm) {
    draw();
  } else {
    loop();
  }

  // défilement : l'image glisse légèrement et la brume monte
  if (window.ScrollTrigger && !state.calm) {
    window.ScrollTrigger.create({
      trigger: section, start: "top top", end: "bottom top", scrub: true,
      onUpdate: (self) => { uniforms.uScroll.value = self.progress; needsFrame = true; },
    });
  }

  return {
    uniforms,
    ripple: addRipple,
    drop(strength = 1.2) { addRipple(uniforms.uDrop.value[0], uniforms.uDrop.value[1], strength); },
    reveal(opts = {}) {
      if (state.calm || !window.gsap) { uniforms.uReveal.value = 1; draw(); return null; }
      return window.gsap.to(uniforms.uReveal, { value: 1, duration: opts.duration || 1.5, delay: opts.delay || 0, ease: "power2.out" });
    },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); },
  };
}
