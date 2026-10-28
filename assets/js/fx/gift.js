// Bon cadeau : la carte postale (vrais visuels) sort de son enveloppe, s'incline sous le curseur
// et se retourne d'un clic pour montrer le verso.
/* global gsap */
import { state } from "../core.js?v=20261028-2";

export function initGift(root) {
  const env = root.querySelector(".envelope");
  const flap = root.querySelector(".env-flap");
  const card = root.querySelector(".gcard");
  const name = root.querySelector(".env-name");
  if (!env || !card) return {};
  let flipped = false;

  const flip = () => {
    flipped = !flipped;
    card.setAttribute("aria-pressed", String(flipped));
    gsap.to(card, { rotationY: flipped ? 180 : 0, duration: state.calm ? 0 : 1.1, ease: "power3.inOut" });
  };
  card.addEventListener("click", flip);
  card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });

  if (state.calm) {
    gsap.set(flap, { rotationX: 180 });
    gsap.set(card, { yPercent: -62 });
  } else {
    gsap.timeline({ delay: 0.6 })
      .fromTo(env, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "power3.out" })
      .to(flap, { rotationX: 180, duration: 0.9, ease: "power2.inOut" }, "-=0.2")
      .set(flap, { zIndex: 1 })
      .fromTo(card, { yPercent: 0 }, { yPercent: -62, duration: 1.3, ease: "power3.out" }, "-=0.2")
      .to(card, { rotationZ: -3, duration: 1.2, ease: "sine.inOut" }, "-=0.6");

    if (state.fine) {
      const rx = gsap.quickTo(env, "rotationX", { duration: 0.9, ease: "power3" });
      const ry = gsap.quickTo(env, "rotationY", { duration: 0.9, ease: "power3" });
      root.addEventListener("pointermove", (e) => {
        const r = root.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 14);
        rx((0.5 - (e.clientY - r.top) / r.height) * 10);
      });
      root.addEventListener("pointerleave", () => { rx(0); ry(0); });
    }
  }

  return {
    setName(v) {
      if (!name) return;
      name.textContent = v.trim() ? `Pour ${v.trim()}` : "";
    },
  };
}
