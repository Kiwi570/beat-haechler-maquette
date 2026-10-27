// « Où sont vos tensions ? » : une silhouette de dos dont chaque zone oriente vers le bon massage.
/* global gsap */
import { BODY_PATH, HEAD } from "./body-shape.js";
import { state } from "../core.js";
import { bindButton } from "../ui.js";

const NS = "http://www.w3.org/2000/svg";

export function bodyBase(extraDefs = "") {
  return `
  <defs>
    <radialGradient id="glow"><stop offset="0" stop-color="#E08F6B" stop-opacity=".85"/><stop offset=".6" stop-color="#E08F6B" stop-opacity=".25"/><stop offset="1" stop-color="#E08F6B" stop-opacity="0"/></radialGradient>
    ${extraDefs}
  </defs>
  <ellipse class="body" cx="${HEAD.cx}" cy="${HEAD.cy}" rx="${HEAD.rx}" ry="${HEAD.ry}"/>
  <path class="body" d="${BODY_PATH}"/>
  <path class="detail" d="M120 98 C119 140 121 200 120 266"/>
  <path class="detail" d="M94 124 C86 146 88 170 100 184"/>
  <path class="detail" d="M146 124 C154 146 152 170 140 184"/>
  <path class="detail" d="M86 250 C100 258 140 258 154 250"/>
  <path class="detail" d="M92 384 C96 388 102 388 106 384"/>
  <path class="detail" d="M134 384 C138 388 144 388 148 384"/>`;
}

const ZONES = [
  { id: "tete", label: "Tête et esprit : stress, besoin de décrocher", shape: '<ellipse cx="120" cy="46" rx="32" ry="38"/>',
    massage: "Massage relaxant", href: "massage-relaxant.html",
    why: "Des mouvements lents et enveloppants pour relâcher le stress du quotidien et retrouver la sensation d'habiter son corps." },
  { id: "nuque", label: "Nuque et épaules", shape: '<ellipse cx="120" cy="104" rx="66" ry="22"/>',
    massage: "Massage anti-tensions", href: "massage-anti-tensions.html",
    why: "Nuque, épaules et trapèzes comptent parmi les zones de tension les plus fréquentes. Le massage cible les nœuds musculaires avec des pressions soutenues." },
  { id: "haut-dos", label: "Haut du dos", shape: '<ellipse cx="120" cy="160" rx="46" ry="32"/>',
    massage: "Massage anti-tensions", href: "massage-anti-tensions.html",
    why: "Entre les omoplates, les points gâchettes sont traités par pression, pétrissage et glissé profond, puis étirements." },
  { id: "bas-dos", label: "Bas du dos", shape: '<ellipse cx="120" cy="228" rx="44" ry="30"/>',
    massage: "Massage anti-tensions", href: "massage-anti-tensions.html",
    why: "Un travail ciblé sur les zones contractées du dos, que j'adapte à ce que vous ressentez." },
  { id: "jambes", label: "Jambes lourdes", shape: '<rect x="70" y="292" width="100" height="214" rx="40"/>',
    massage: "Drainage lymphatique", href: "drainage-lymphatique.html",
    why: "Un massage doux et rythmé qui procure une sensation de légèreté, souvent apprécié quand les jambes sont lourdes." },
];

export function initGuide(root) {
  const svg = root.querySelector(".bodymap");
  const result = root.querySelector(".guide-result");
  const chips = root.querySelectorAll(".zchip");
  if (!svg || !result) return;
  svg.innerHTML = bodyBase();
  const zoneEls = {};
  ZONES.forEach((z) => {
    const g = document.createElementNS(NS, "g");
    g.innerHTML = z.shape.replace(/^<(\w+)/, `<$1 class="zone" tabindex="0" role="button" aria-pressed="false" data-zone="${z.id}" aria-label="${z.label}"`) +
      z.shape.replace(/^<(\w+)/, `<$1 class="glow"`);
    svg.appendChild(g);
    zoneEls[z.id] = g.querySelector(".zone");
  });
  const ring = document.createElementNS(NS, "circle");
  ring.setAttribute("class", "zone-ring"); ring.setAttribute("r", "6"); ring.setAttribute("opacity", "0");
  svg.appendChild(ring);

  function centerOf(el) {
    const b = el.getBBox();
    return [b.x + b.width / 2, b.y + b.height / 2];
  }

  function select(id, fromChip) {
    const z = ZONES.find((x) => x.id === id);
    Object.values(zoneEls).forEach((el) => el.setAttribute("aria-pressed", String(el.dataset.zone === id)));
    chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.zone === id)));
    if (!z) {
      result.innerHTML = `<p class="eyebrow">Je ne sais pas</p><p class="h3">Parlons-en ensemble</p><p class="why">Chaque séance s'adapte à vos besoins. Un appel suffit pour choisir ensemble\u202f: <a class="num" href="tel:+41793812467">079 381 24 67</a>.</p><p class="actions"><a class="btn btn--small" href="rendez-vous.html"><span class="btn-label">Voir les lieux et les jours</span></a></p>`;
    } else {
      result.innerHTML = `<p class="eyebrow">${z.label}</p><p class="h3">Je vous conseille\u202f: ${z.massage.toLowerCase().replace(/^m/, "le m").replace(/^d/, "le d")}</p><p class="why">${z.why}</p><p class="actions"><a class="btn btn--small" href="${z.href}"><span class="btn-label">Découvrir ce massage</span></a><a class="wlink" href="rendez-vous.html">Prendre rendez-vous</a></p>`;
      if (!state.calm) {
        const [cx, cy] = centerOf(zoneEls[id]);
        ring.setAttribute("cx", cx); ring.setAttribute("cy", cy);
        gsap.fromTo(ring, { attr: { r: 6 }, opacity: 1 }, { attr: { r: 70 }, opacity: 0, duration: 1.4, ease: "power2.out" });
      }
    }
    result.querySelectorAll(".btn").forEach(bindButton);
    if (!state.calm) gsap.fromTo(result.children, { y: 16, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.7 });
    if (!fromChip && window.matchMedia("(max-width: 860px)").matches) {
      result.scrollIntoView({ behavior: state.calm ? "auto" : "smooth", block: "nearest" });
    }
  }

  Object.values(zoneEls).forEach((el) => {
    el.addEventListener("click", () => select(el.dataset.zone));
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(el.dataset.zone); } });
  });
  chips.forEach((c) => c.addEventListener("click", () => select(c.dataset.zone, true)));

  // état de départ : la zone la plus fréquente est déjà choisie
  const initial = root.dataset.initial || "nuque";
  Object.values(zoneEls).forEach((el) => el.setAttribute("aria-pressed", String(el.dataset.zone === initial)));
  chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.zone === initial)));
}
