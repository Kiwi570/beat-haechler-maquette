// Révélations au défilement : titres ligne par ligne, images qui ondulent puis se figent,
// parallaxe, chiffres à rouleaux, galerie horizontale épinglée.
/* global gsap, ScrollTrigger, SplitText */
import { state } from "./core.js?v=20261028-2";

let filterId = 0;
let svgDefs = null;

function ensureDefs() {
  if (svgDefs) return svgDefs;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", "0"); svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  svgDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  svg.appendChild(svgDefs);
  document.body.appendChild(svg);
  return svgDefs;
}

/** Filtre de déplacement « eau » propre à une image (ondule puis se fige). */
function makeRipple(img) {
  const id = "rip-" + (++filterId);
  const defs = ensureDefs();
  const f = document.createElementNS("http://www.w3.org/2000/svg", "filter");
  f.setAttribute("id", id);
  f.setAttribute("x", "-5%"); f.setAttribute("y", "-5%"); f.setAttribute("width", "110%"); f.setAttribute("height", "110%");
  f.innerHTML = `<feTurbulence type="fractalNoise" baseFrequency="0.008 0.026" numOctaves="2" seed="${filterId * 7}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/>`;
  defs.appendChild(f);
  return { id, map: f.querySelector("feDisplacementMap"), turb: f.querySelector("feTurbulence") };
}

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export function initReveals() {
  if (state.calm) return;

  // titres : lignes qui montent derrière un masque
  document.querySelectorAll("[data-split]").forEach((el) => {
    if (el.closest(".hero")) return; // les titres d'ouverture sont gérés par l'ouverture
    SplitText.create(el, {
      type: "lines", mask: "lines", linesClass: "line", autoSplit: true,
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 112, duration: 1.15, stagger: 0.09, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      },
    });
  });

  // blocs de texte et éléments
  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    const kids = el.dataset.reveal === "stagger" ? Array.from(el.children) : [el];
    gsap.from(kids, {
      y: 36, opacity: 0, duration: 1.1, stagger: 0.08, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });

  // images : rideau qui s'ouvre, image qui se pose, eau qui se calme
  gsap.utils.toArray(".reveal-img").forEach((frame) => {
    const img = frame.querySelector("img");
    const tl = gsap.timeline({ scrollTrigger: { trigger: frame, start: "top 88%", once: true } });
    tl.fromTo(frame, { clipPath: "inset(18% 8% 18% 8% round 40px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1.5, ease: "power3.out", clearProps: "clipPath" });
    if (img) tl.from(img, { scale: 1.22, duration: 1.8, ease: "power3.out" }, 0);
    if (img && state.fine && !isSafari) {
      const r = makeRipple(img);
      img.style.filter = `url(#${r.id})`;
      tl.fromTo(r.map, { attr: { scale: 70 } }, { attr: { scale: 0 }, duration: 1.9, ease: "power2.out", onComplete: () => { img.style.filter = ""; } }, 0);
      frame._ripple = r;
    }
  });

  // survol : l'image se trouble comme une surface d'eau effleurée
  if (state.fine && !isSafari) {
    document.querySelectorAll("[data-water-hover]").forEach((wrap) => {
      const img = wrap.querySelector("img");
      if (!img) return;
      const r = wrap._ripple || makeRipple(img);
      wrap.addEventListener("pointerenter", () => {
        img.style.filter = `url(#${r.id})`;
        gsap.to(r.map, { attr: { scale: 22 }, duration: 0.6, ease: "power2.out" });
        gsap.fromTo(r.turb, { attr: { baseFrequency: "0.008 0.026" } }, { attr: { baseFrequency: "0.012 0.04" }, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
      });
      wrap.addEventListener("pointerleave", () => {
        gsap.killTweensOf(r.turb);
        gsap.to(r.map, { attr: { scale: 0 }, duration: 0.9, ease: "power2.out", onComplete: () => { img.style.filter = ""; } });
      });
    });
  }

  // parallaxe douce
  gsap.utils.toArray("[data-speed]").forEach((el) => {
    const s = Number(el.dataset.speed) || 0.1;
    gsap.fromTo(el, { yPercent: s * 50 }, { yPercent: -s * 50, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
  });

  // bandes plein écran : l'image glisse plus lentement que la page et se resserre
  gsap.utils.toArray("[data-band]").forEach((band) => {
    const media = band.querySelector(".band-media");
    if (!media) return;
    gsap.fromTo(media, { yPercent: -7, scale: 1.12 }, { yPercent: 7, scale: 1, ease: "none", scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: true } });
  });

  // ligne de frise qui se dessine
  gsap.utils.toArray(".tl-line").forEach((line) => {
    gsap.to(line, { scaleY: 1, ease: "none", scrollTrigger: { trigger: line.parentElement, start: "top 70%", end: "bottom 60%", scrub: true } });
  });
}

/* ---------- Chiffres à rouleaux ---------- */
export function initOdometers() {
  document.querySelectorAll(".odo").forEach((el) => {
    const value = el.dataset.value || el.textContent.trim();
    el.setAttribute("aria-label", value);
    el.textContent = "";
    const cols = [];
    value.split("").forEach((ch) => {
      const col = document.createElement("span");
      col.className = "odo-col"; col.setAttribute("aria-hidden", "true");
      if (/\d/.test(ch)) {
        for (let i = 0; i <= 9; i++) { const s = document.createElement("span"); s.textContent = i; col.appendChild(s); }
        cols.push({ col, n: Number(ch) });
      } else { const s = document.createElement("span"); s.textContent = ch; col.appendChild(s); }
      el.appendChild(col);
    });
    if (state.calm) { el.textContent = value; return; }
    gsap.set(cols.map((c) => c.col), { y: 0 });
    gsap.to(cols.map((c) => c.col), {
      y: (i) => `${-cols[i].n * 1.15}em`,
      duration: 1.8, stagger: 0.12, ease: "power3.inOut",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
      onComplete: () => { el.textContent = value; }, // texte simple ensuite : crénage naturel
    });
  });
}

/* ---------- Galerie horizontale épinglée (accueil) ---------- */
export function initHScroll() {
  const sec = document.querySelector("[data-hscroll]");
  if (!sec || state.calm) return;
  const track = sec.querySelector(".hscroll-track");
  const mm = gsap.matchMedia();
  mm.add("(min-width: 900px)", () => {
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 },
    });
    // chaque carte se redresse en entrant
    track.querySelectorAll(".mcard").forEach((card) => {
      gsap.fromTo(card.querySelector(".frame"), { rotate: 3, scale: 0.92 }, {
        rotate: 0, scale: 1, ease: "none",
        scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 95%", end: "left 45%", scrub: true },
      });
    });
    return () => {};
  });
}
