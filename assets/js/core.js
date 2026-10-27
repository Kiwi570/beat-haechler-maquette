// Socle : préférences de mouvement, défilement fluide, enregistrement des extensions GSAP.
/* global gsap, ScrollTrigger, SplitText, CustomEase, DrawSVGPlugin, Lenis */

export const state = {
  calm: false,
  reduced: false,
  fine: false,
  touch: false,
  lenis: null,
  page: document.documentElement.dataset.page || "",
};

export function store(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch (e) { /* stockage indisponible : aucune conséquence */ }
  return null;
}

export function session(key, value) {
  try {
    if (value === undefined) return sessionStorage.getItem(key);
    sessionStorage.setItem(key, value);
  } catch (e) { /* idem */ }
  return null;
}

export function initCore() {
  const html = document.documentElement;
  html.classList.add("app-ready");
  state.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  state.calm = html.classList.contains("calm");
  state.fine = window.matchMedia("(pointer: fine)").matches;
  state.touch = !state.fine;

  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, DrawSVGPlugin);
  CustomEase.create("eau", "0.22,0.61,0.36,1");
  CustomEase.create("houle", "M0,0 C0.3,0 0.2,1 1,1");
  gsap.defaults({ ease: "eau", duration: 1 });

  if (state.calm) {
    gsap.globalTimeline.timeScale(1);
    ScrollTrigger.config({ ignoreMobileResize: true });
    return;
  }

  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95, anchors: false });
    state.lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export function setCalm(on) {
  store("bh-calm", on ? "1" : "0");
  window.location.reload();
}

export function scrollToTarget(target, offset = -90) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;
  if (state.lenis) state.lenis.scrollTo(el, { offset, duration: 1.4 });
  else el.scrollIntoView({ behavior: state.calm ? "auto" : "smooth", block: "start" });
}

/** Petit utilitaire : exécute fn quand l'élément entre à l'écran (une seule fois). */
export function onVisible(el, fn, rootMargin = "0px 0px -10% 0px") {
  if (!("IntersectionObserver" in window)) { fn(); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { io.disconnect(); fn(); } });
  }, { rootMargin });
  io.observe(el);
}
