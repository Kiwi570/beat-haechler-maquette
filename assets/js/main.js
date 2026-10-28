// Point d'entrée : orchestre l'ouverture, les effets communs et les effets propres à chaque page.
/* global gsap, ScrollTrigger, SplitText */
import { initCore, state, session } from "./core.js?v=20261028-2";
import { initWater } from "./water.js?v=20261028-2";
import * as ui from "./ui.js?v=20261028-2";
import { initReveals, initOdometers, initHScroll } from "./reveal.js?v=20261028-2";
import { initGuide } from "./fx/bodymap.js?v=20261028-2";
import { initTriggers } from "./fx/trigger.js?v=20261028-2";
import { initTecar } from "./fx/tecar.js?v=20261028-2";
import { initLakeMap } from "./fx/lakemap.js?v=20261028-2";
import { initGestures } from "./fx/gestures.js?v=20261028-2";
import { initBreath } from "./fx/breath.js?v=20261028-2";
import { initBooking, initWaitlist, initGiftOrder } from "./fx/forms.js?v=20261028-2";
import { initGift } from "./fx/gift.js?v=20261028-2";

const html = document.documentElement;
const safety = setTimeout(() => html.classList.remove("is-first", "is-veiled"), 6000);

function safe(name, fn) {
  try { return fn(); } catch (e) { console.error(`[${name}]`, e); return null; }
}

initCore();

safe("calm", ui.initCalmToggles);
safe("copy", ui.initCopy);
safe("today", ui.initToday);
safe("header", ui.initHeader);
safe("menu", ui.initMenu);
safe("buttons", ui.initButtons);
safe("tilt", ui.initTilt);
safe("cursor", ui.initCursor);
const revealPage = safe("transitions", ui.initTransitions) || (() => Promise.resolve());
safe("breath-dialog", () => ui.initBreathDialog(initBreath));

const hero = document.querySelector(".hero");
const water = hero ? safe("water", () => initWater(hero)) : null;

// effets propres aux pages
document.querySelectorAll("[data-guide]").forEach((el) => safe("guide", () => initGuide(el)));
document.querySelectorAll("[data-triggers]").forEach((el) => safe("triggers", () => initTriggers(el)));
document.querySelectorAll("[data-tecar]").forEach((el) => safe("tecar", () => initTecar(el)));
document.querySelectorAll("[data-lakemap]").forEach((el) => safe("lakemap", () => initLakeMap(el)));
document.querySelectorAll("[data-gestures]").forEach((el) => safe("gestures", () => initGestures(el)));
document.querySelectorAll(".breath[data-inline]").forEach((el) => safe("breath", () => initBreath(el)));
document.querySelectorAll("form[data-booking]").forEach((el) => safe("booking", () => initBooking(el)));
document.querySelectorAll("form[data-waitlist]").forEach((el) => safe("waitlist", () => initWaitlist(el)));

const giftStage = document.querySelector("[data-gift]");
const gift = giftStage ? safe("gift", () => initGift(giftStage)) : null;
document.querySelectorAll("form[data-giftorder]").forEach((el) => safe("giftorder", () => initGiftOrder(el, (v) => gift && gift.setName && gift.setName(v))));

// témoignages : boutons précédent / suivant
document.querySelectorAll("[data-quotes]").forEach((wrap) => safe("quotes", () => {
  const list = wrap.querySelector(".quotes");
  const step = () => (list.querySelector(".quote")?.getBoundingClientRect().width || 300) + 18;
  wrap.querySelector("[data-q-prev]")?.addEventListener("click", () => list.scrollBy({ left: -step(), behavior: state.calm ? "auto" : "smooth" }));
  wrap.querySelector("[data-q-next]")?.addEventListener("click", () => list.scrollBy({ left: step(), behavior: state.calm ? "auto" : "smooth" }));
}));

if (!state.calm) {
  gsap.utils.toArray("[data-float]").forEach((el, i) => {
    gsap.to(el, { y: i % 2 ? 10 : -10, duration: 3 + (i % 3), yoyo: true, repeat: -1, ease: "sine.inOut" });
  });
}

safe("reveals", initReveals);
safe("odometers", initOdometers);
safe("hscroll", initHScroll);

/* ---------- Ouverture ---------- */
function heroIntro() {
  const first = html.classList.contains("is-first");
  const done = () => { clearTimeout(safety); html.classList.remove("is-first"); session("bh-visited", "1"); };
  if (!hero) { revealPage().then(done); return; }

  const title = hero.querySelector("[data-split]");
  const rest = hero.querySelectorAll("[data-hero-in]");
  const header = document.querySelector(".site-header");

  if (state.calm) { if (water) water.reveal(); done(); return; }

  // le titre reste masqué jusqu'aux polices (800 ms au plus), pour découper les lignes avec Fraunces
  if (title) gsap.set(title, { visibility: "hidden" });
  gsap.set(rest, { y: 26, opacity: 0 });
  // pendant l'entrée, GSAP seul anime l'en-tête : la transition CSS sur transform est suspendue
  if (header) header.classList.add("is-intro");
  gsap.set(header, { yPercent: -110, opacity: 0 });
  const fontsReady = document.fonts && document.fonts.ready
    ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 800))])
    : Promise.resolve();

  let split = null;
  const splitTitle = () => {
    if (!title || split) return;
    split = SplitText.create(title, { type: "lines", mask: "lines", linesClass: "line" });
    gsap.set(split.lines, { yPercent: 112 });
    gsap.set(title, { visibility: "visible" });
  };

  const play = (delay = 0) => {
    splitTitle();
    const tl = gsap.timeline({ delay, onComplete: () => { if (split) split.revert(); gsap.set(header, { clearProps: "transform,opacity" }); if (header) header.classList.remove("is-intro"); } });
    if (split) tl.to(split.lines, { yPercent: 0, duration: 1.25, stagger: 0.1, ease: "power4.out" }, 0);
    tl.to(rest, { y: 0, opacity: 1, duration: 1, stagger: 0.08, ease: "power3.out" }, 0.25);
    tl.to(header, { yPercent: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, 0.35);
    return tl;
  };

  fontsReady.then(() => {
    splitTitle();
    if (first) {
      const intro = document.querySelector(".intro");
      const drop = intro && intro.querySelector(".intro-drop");
      const word = intro && intro.querySelector(".intro-word");
      if (!intro || !drop) { if (water) water.reveal(); play(0.1); done(); return; }
      const tl = gsap.timeline({ onComplete: done });
      tl.to(word, { opacity: 1, duration: 0.5 }, 0)
        .to(drop, { opacity: 1, duration: 0.25 }, 0.1)
        .to(drop, { y: 0, duration: 0.7, ease: "power2.in" }, 0.15)
        .to(drop, { scaleX: 2.6, scaleY: 0.2, opacity: 0, duration: 0.25, ease: "power2.out" }, 0.85)
        .to(word, { opacity: 0, duration: 0.4 }, 0.8)
        .add(() => { if (water) { water.drop(1.4); water.reveal({ duration: 1.5 }); } }, 0.85)
        .to(intro, { opacity: 0, duration: 0.7, ease: "power2.out", onComplete: () => { intro.style.display = "none"; } }, 0.9)
        .add(() => play(0), 1.15);
    } else {
      revealPage().then(() => {
        if (water) { water.reveal({ duration: 1.3 }); water.drop(0.7); }
        play(0.05);
        done();
      });
    }
  });
}
safe("intro", heroIntro);

// recalculer les déclencheurs une fois polices et images chargées
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
window.addEventListener("load", () => ScrollTrigger.refresh());
