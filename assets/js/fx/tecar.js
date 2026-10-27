// « Ondes Tecar » : cercles concentriques qui émanent de l'électrode,
// et tracé illustratif des courants TENS et EMS.
import { state, onVisible } from "../core.js";

export function initTecar(root) {
  const canvas = root.querySelector("canvas");
  const img = root.querySelector("img");
  if (!canvas || !img) return;
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0, ox = 0, oy = 0;
  let speed = 1;
  let t0 = performance.now();
  let visible = false;

  function size() {
    const r = root.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ir = img.getBoundingClientRect();
    // électrode ronde, en haut à droite de l'appareil
    ox = ir.left - r.left + ir.width * 0.545;
    oy = ir.top - r.top + ir.height * 0.155;
    if (state.calm) frame(4000);
  }

  function frame(ms) {
    ctx.clearRect(0, 0, w, h);
    const t = ms / 1000;
    const maxR = Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy));
    const n = 9;
    for (let i = 0; i < n; i++) {
      const p = ((t * 0.16 * speed + i / n) % 1);
      const r = 18 + p * maxR;
      const a = (1 - p) * 0.55;
      ctx.beginPath();
      ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.strokeStyle = i % 3 === 0 ? `rgba(224,143,107,${a})` : `rgba(36,64,79,${a * 0.6})`;
      ctx.lineWidth = i % 3 === 0 ? 2 : 1;
      ctx.stroke();
    }
    const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, 120);
    g.addColorStop(0, "rgba(224,143,107,0.35)");
    g.addColorStop(1, "rgba(224,143,107,0)");
    ctx.fillStyle = g;
    ctx.fillRect(ox - 120, oy - 120, 240, 240);
  }

  function loop() {
    requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    frame(performance.now() - t0);
  }

  new ResizeObserver(size).observe(root);
  if (img.complete) size(); else img.addEventListener("load", size);
  if ("IntersectionObserver" in window) new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(root);
  else visible = true;
  if (!state.calm) {
    root.addEventListener("pointerenter", () => { speed = 2.6; });
    root.addEventListener("pointerleave", () => { speed = 1; });
    loop();
  }
}

export function initScope(root) {
  const canvas = root.querySelector("canvas");
  const buttons = root.querySelectorAll("[data-wave]");
  const desc = root.querySelector("[data-wave-desc]");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let mode = "tens";
  let w = 0, h = 0, visible = false;
  const texts = {
    tens: "TENS : des impulsions brèves et régulières qui stimulent les nerfs, utilisées pour leur effet apaisant.",
    ems: "EMS : des trains d'impulsions qui font travailler le muscle par contractions, puis le laissent se reposer.",
  };

  function size() {
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(state.calm ? 0 : performance.now());
  }

  function signal(x) {
    if (mode === "tens") {
      const period = 34;
      const p = ((x % period) + period) % period;
      if (p < 3) return 0.85;
      if (p < 6) return -0.55;
      return 0;
    }
    const cycle = 420;
    const c = ((x % cycle) + cycle) % cycle;
    let env = 0;
    if (c < 80) env = c / 80;
    else if (c < 220) env = 1;
    else if (c < 300) env = 1 - (c - 220) / 80;
    const p = ((x % 9) + 9) % 9;
    const pulse = p < 2 ? 1 : (p < 4 ? -0.6 : 0);
    return pulse * env * 0.9;
  }

  function draw(ms) {
    ctx.clearRect(0, 0, w, h);
    const mid = h / 2;
    ctx.strokeStyle = "rgba(238,242,240,0.12)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < w; gx += 28) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
    const shift = state.calm ? 0 : (ms / 1000) * 90;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 1) {
      const y = mid - signal(x + shift) * (h * 0.4);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#E08F6B";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function loop() {
    requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    draw(performance.now());
  }

  buttons.forEach((b) => b.addEventListener("click", () => {
    mode = b.dataset.wave;
    buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    if (desc) desc.textContent = texts[mode];
    if (state.calm) draw(0);
  }));
  new ResizeObserver(size).observe(canvas);
  if ("IntersectionObserver" in window) new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(canvas);
  else visible = true;
  if (!state.calm) onVisible(canvas, loop, "100px");
}
