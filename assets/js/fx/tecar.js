// « Ondes Tecar » : cercles concentriques qui émanent de l'électrode.
import { state } from "../core.js?v=20261027";

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
