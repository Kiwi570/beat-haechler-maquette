// « Pression et relâchement » : maintenir l'appui sur un point gâchette remplit un anneau ;
// au relâchement, une onde chaude se diffuse (l'afflux qui suit la pression ischémique).
/* global gsap */
import { bodyBase } from "./bodymap.js?v=20261027";
import { state } from "../core.js?v=20261027";

const NS = "http://www.w3.org/2000/svg";
const POINTS = [
  { id: "nuque", x: 120, y: 86, label: "nuque" },
  { id: "trap-g", x: 92, y: 106, label: "trapèze gauche" },
  { id: "trap-d", x: 148, y: 106, label: "trapèze droit" },
  { id: "omo-g", x: 103, y: 152, label: "entre l'omoplate gauche et la colonne" },
  { id: "omo-d", x: 137, y: 152, label: "entre l'omoplate droite et la colonne" },
  { id: "lomb-g", x: 108, y: 230, label: "bas du dos, à gauche" },
  { id: "lomb-d", x: 132, y: 230, label: "bas du dos, à droite" },
];
const HOLD = 2.2; // secondes de pression pour relâcher un point

export function initTriggers(root) {
  build(root);
}

function build(root) {
  const svg = root.querySelector(".bodymap");
  const hintEl = root.querySelector("[data-tp-hint]");
  if (!svg) return;
  gsap.killTweensOf(svg.querySelectorAll("circle"));
  svg.innerHTML = bodyBase('<radialGradient id="warm"><stop offset="0" stop-color="#E08F6B" stop-opacity=".7"/><stop offset=".55" stop-color="#E08F6B" stop-opacity=".22"/><stop offset="1" stop-color="#E08F6B" stop-opacity="0"/></radialGradient>');
  const waves = document.createElementNS(NS, "g");
  svg.appendChild(waves);
  const C = 2 * Math.PI * 11;

  POINTS.forEach((p) => {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "tp");
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", `Point gâchette, ${p.label}. Maintenez l'appui pour presser.`);
    g.setAttribute("data-cursor", "Maintenir");
    g.innerHTML = `<circle class="tp-hit" cx="${p.x}" cy="${p.y}" r="17"/><circle class="tp-track" cx="${p.x}" cy="${p.y}" r="11"/><circle class="tp-fill" cx="${p.x}" cy="${p.y}" r="11" transform="rotate(-90 ${p.x} ${p.y})" stroke-dasharray="${C}" stroke-dashoffset="${C}"/><circle class="tp-core" cx="${p.x}" cy="${p.y}" r="4.6"/>`;
    svg.appendChild(g);
    const fill = g.querySelector(".tp-fill");
    const core = g.querySelector(".tp-core");
    let tween = null;
    let done = false;
    const breathe = state.calm ? null : gsap.to(core, { attr: { r: 6 }, duration: 1.4, yoyo: true, repeat: -1, ease: "sine.inOut", delay: Math.random() });

    function press(e) {
      if (e && e.preventDefault) e.preventDefault();
      if (done) return;
      g.classList.add("is-pressing");
      if (breathe) breathe.pause();
      if (hintEl) hintEl.textContent = "Pression ischémique : on maintient jusqu'au relâchement du point…";
      tween = gsap.to(fill, { attr: { "stroke-dashoffset": 0 }, duration: state.calm ? HOLD : HOLD, ease: "none", onComplete: releaseOk });
      gsap.to(core, { attr: { r: 3 }, duration: 0.6 });
    }
    function cancel() {
      if (done) return;
      g.classList.remove("is-pressing");
      if (tween) tween.kill();
      gsap.to(fill, { attr: { "stroke-dashoffset": C }, duration: 0.5 });
      gsap.to(core, { attr: { r: 4.6 }, duration: 0.5 });
      if (breathe) breathe.resume();
      if (hintEl) hintEl.textContent = "Relâché trop tôt : maintenez un peu plus longtemps.";
    }
    function releaseOk() {
      done = true;
      g.classList.remove("is-pressing");
      g.classList.add("is-released");
      g.setAttribute("aria-label", `Point gâchette, ${p.label} : relâché.`);
      if (hintEl) hintEl.textContent = "Relâché\u202f: le sang afflue à nouveau, le muscle se détend.";
      const w = document.createElementNS(NS, "circle");
      w.setAttribute("class", "tp-wave"); w.setAttribute("cx", p.x); w.setAttribute("cy", p.y); w.setAttribute("r", "8");
      waves.appendChild(w);
      gsap.fromTo(w, { attr: { r: 8 }, opacity: 1 }, { attr: { r: state.calm ? 40 : 70 }, opacity: 0, duration: state.calm ? 0.01 : 2.4, ease: "power2.out", onComplete: () => w.remove() });
      gsap.to(fill, { opacity: 0, duration: 0.8, delay: 0.3 });
      gsap.to(core, { attr: { r: 5 }, duration: 0.8, ease: "elastic.out(1,.4)" });
      // le point se réarme doucement : on peut recommencer quand on veut
      setTimeout(() => {
        done = false;
        g.classList.remove("is-released");
        g.setAttribute("aria-label", `Point gâchette, ${p.label}. Maintenez l'appui pour presser.`);
        gsap.set(fill, { attr: { "stroke-dashoffset": C }, opacity: 1 });
        gsap.to(core, { attr: { r: 4.6 }, duration: 0.6 });
        if (breathe) breathe.resume();
      }, 6000);
    }

    g.addEventListener("pointerdown", (e) => { g.setPointerCapture && g.setPointerCapture(e.pointerId); press(e); });
    g.addEventListener("pointerup", () => { if (tween && tween.progress() < 1) cancel(); });
    g.addEventListener("pointercancel", cancel);
    g.addEventListener("lostpointercapture", () => { if (tween && tween.progress() < 1 && !done) cancel(); });
    g.addEventListener("contextmenu", (e) => e.preventDefault());
    g.addEventListener("keydown", (e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) press(e); });
    g.addEventListener("keyup", (e) => { if ((e.key === " " || e.key === "Enter") && tween && tween.progress() < 1) cancel(); });
  });

  if (hintEl) hintEl.textContent = "Maintenez l'appui sur un point pendant deux secondes.";
}
