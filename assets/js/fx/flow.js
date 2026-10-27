// « Flux de lumière » (page drainage) : des filets lumineux coulent doucement le long de la page,
// des bords vers le centre ; le défilement accélère leur course.
import { state } from "../core.js?v=20261027";

const NS = "http://www.w3.org/2000/svg";

export function initFlow() {
  if (state.calm) return;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "flow-layer");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("viewBox", "0 0 1000 1000");
  svg.innerHTML = `<defs><linearGradient id="flowG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E08F6B" stop-opacity="0"/><stop offset=".4" stop-color="#E08F6B" stop-opacity=".55"/><stop offset="1" stop-color="#24404F" stop-opacity=".35"/></linearGradient></defs>`;
  const curves = [
    "M-20 -20 C 90 220, 30 460, 110 680 S 200 900, 250 1040",
    "M60 -20 C 150 280, 80 520, 170 720 S 240 940, 300 1040",
    "M1020 -20 C 910 220, 970 460, 890 680 S 800 900, 750 1040",
    "M940 -20 C 850 280, 920 520, 830 720 S 760 940, 700 1040",
  ];
  const paths = [];
  curves.forEach((d, i) => {
    const base = document.createElementNS(NS, "path");
    base.setAttribute("d", d);
    base.setAttribute("stroke", "url(#flowG)");
    base.setAttribute("stroke-width", "1.3");
    base.setAttribute("opacity", ".7");
    base.setAttribute("vector-effect", "non-scaling-stroke");
    svg.appendChild(base);
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d);
    p.setAttribute("stroke", "#E08F6B");
    p.setAttribute("stroke-width", i % 2 ? "1.6" : "2.4");
    p.setAttribute("vector-effect", "non-scaling-stroke");
    p.setAttribute("stroke-dasharray", i % 2 ? "90 520" : "160 640");
    p.setAttribute("stroke-linecap", "round");
    p.setAttribute("opacity", ".8");
    svg.appendChild(p);
    paths.push({ el: p, off: Math.random() * 300, v: 0.5 + (i % 3) * 0.2 });
  });
  document.body.prepend(svg);

  let lastY = window.scrollY;
  let boost = 0;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    boost = Math.min(18, boost + Math.abs(y - lastY) * 0.08);
    lastY = y;
  }, { passive: true });

  function loop() {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    boost *= 0.92;
    paths.forEach((p) => {
      p.off -= p.v + boost * 0.4;
      p.el.setAttribute("stroke-dashoffset", p.off.toFixed(1));
    });
  }
  loop();
}
