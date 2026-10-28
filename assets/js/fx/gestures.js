// « Les quatre gestes » : effleurage, pétrissage, friction, glissé profond,
// chacun tracé par une ligne qui imite le mouvement de la main.
/* global gsap */
import { GESTES } from "./gesture-paths.js?v=20261028";
import { state } from "../core.js?v=20261028";

const NS = "http://www.w3.org/2000/svg";
const STYLE = {
  effleurage: { w: 3, dur: 5.5 },
  petrissage: { w: 2.4, dur: 7 },
  friction: { w: 2, dur: 6 },
  glisse: { w: 9, dur: 6.5 },
};

export function initGestures(root) {
  root.querySelectorAll("[data-geste]").forEach((card, i) => {
    const key = card.dataset.geste;
    const svg = card.querySelector("svg");
    if (!svg || !GESTES[key]) return;
    svg.setAttribute("viewBox", "0 0 200 150");
    svg.innerHTML = `<path d="${GESTES[key]}" stroke-width="${STYLE[key].w}" opacity=".18"/><path class="g-live" d="${GESTES[key]}" stroke-width="${STYLE[key].w}"/><circle r="5"/>`;
    const live = svg.querySelector(".g-live");
    const dot = svg.querySelector("circle");
    const len = live.getTotalLength();
    const placeDot = (p) => { const pt = live.getPointAtLength(p * len); dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y); };

    if (state.calm) { placeDot(1); return; }

    live.style.strokeDasharray = `0 ${len}`;
    placeDot(0);
    const prog = { p: 0 };
    const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.6 });
    tl.to(prog, { p: 1, duration: STYLE[key].dur, ease: key === "glisse" ? "power1.inOut" : "none", onUpdate: () => { placeDot(prog.p); live.style.strokeDasharray = `${prog.p * len} ${len}`; } })
      .to(live, { opacity: 0.25, duration: 0.6 })
      .set(live, { opacity: 1 });
    live.style.strokeDashoffset = "0";
    gsap.timeline({ scrollTrigger: { trigger: card, start: "top 85%", once: true }, delay: i * 0.25 }).add(() => tl.play());
    card.addEventListener("pointerenter", () => tl.timeScale(1.8));
    card.addEventListener("pointerleave", () => tl.timeScale(1));
  });
}
