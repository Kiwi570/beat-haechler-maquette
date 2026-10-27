// « Respiration guidée » : 4 secondes d'inspiration, 6 secondes d'expiration, pendant une minute.
/* global gsap */
import { state } from "../core.js?v=20261027b";

export function initBreath(root) {
  const circle = root.querySelector(".breath-circle");
  const word = root.querySelector(".breath-word");
  const count = root.querySelector(".breath-count");
  const btn = root.querySelector("[data-breath-toggle]");
  if (!circle || !btn) return null;
  const lbl = btn.querySelector(".btn-label") || btn;
  const CYCLES = 6; // 6 × 10 s = 1 minute
  let tl = null;
  let cycle = 0;
  let running = false;

  function label(text) {
    if (state.calm) { word.textContent = text; return; }
    gsap.to(word, { opacity: 0, duration: 0.3, onComplete: () => { word.textContent = text; gsap.to(word, { opacity: 1, duration: 0.5 }); } });
  }

  function start() {
    running = true;
    cycle = 0;
    lbl.textContent = "Arrêter";
    btn.setAttribute("aria-pressed", "true");
    count.textContent = `Cycle 1 sur ${CYCLES}`;
    tl = gsap.timeline({ repeat: CYCLES - 1, onRepeat: () => { cycle++; count.textContent = `Cycle ${cycle + 1} sur ${CYCLES}`; }, onComplete: done });
    tl.add(() => label("Inspirez"))
      .to(circle, { scale: 1, duration: 4, ease: "sine.inOut" })
      .add(() => label("Expirez"))
      .to(circle, { scale: 0.55, duration: 6, ease: "sine.inOut" });
    const rings = root.querySelectorAll(".breath-ring");
    if (!state.calm) gsap.to(rings, { scale: 1.06, opacity: 0.3, duration: 4, yoyo: true, repeat: -1, ease: "sine.inOut", stagger: 0.6 });
  }

  function stop() {
    running = false;
    if (tl) tl.kill();
    gsap.killTweensOf(root.querySelectorAll(".breath-ring"));
    gsap.to(circle, { scale: 0.55, duration: state.calm ? 0 : 1.2 });
    lbl.textContent = "Commencer";
    btn.setAttribute("aria-pressed", "false");
    word.textContent = "Prêt ?";
    count.textContent = "Une minute, six respirations lentes.";
  }

  function done() {
    stop();
    word.textContent = "Merci";
    count.textContent = "Une minute pour vous. Vous pouvez recommencer quand vous voulez.";
  }

  btn.addEventListener("click", () => (running ? stop() : start()));
  return { stop };
}
