// « De Nyon à Genève » : carte simplifiée du Petit-Lac ; la rive se dessine au défilement
// entre les deux lieux et le lieu du jour pulse.
/* global gsap */
import { state } from "../core.js?v=20261028-2";
import { aujourdhui } from "../data.js?v=20261028-2";

export const LAKE_SVG = `
<svg class="lakemap" viewBox="0 0 600 500" role="img" aria-labelledby="lakemap-t lakemap-d">
  <title id="lakemap-t">Carte du Petit-Lac, de Genève à Nyon</title>
  <desc id="lakemap-d">Beat consulte le jeudi à Nyon, sur la rive nord du lac, et le mercredi et le vendredi aux Bains des Pâquis, à Genève, au bout du lac.</desc>
  <defs>
    <linearGradient id="lakeFill" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#3C5A69"/><stop offset=".55" stop-color="#4E6E7C"/><stop offset="1" stop-color="#6F8E99"/>
    </linearGradient>
  </defs>
  <rect class="land" width="600" height="500"/>
  <path class="water" d="M96 440 C104 424 122 400 140 380 C156 364 168 352 172 350 C186 336 200 324 205 320 C222 304 236 292 245 285 C262 268 280 252 290 240 C300 228 312 214 318 205 C330 190 342 180 350 175 C368 162 384 150 400 140 C430 122 450 110 470 100 C500 86 520 78 540 70 C560 62 584 52 600 48 L600 215 C580 220 556 226 540 230 C510 238 494 246 480 250 C450 256 436 260 420 260 C400 262 388 264 375 262 C362 260 356 254 352 250 C348 254 346 258 345 262 C336 278 330 290 320 300 C306 318 296 334 285 345 C268 360 254 372 240 380 C226 390 214 400 205 405 C190 414 174 424 160 430 C146 437 134 446 120 452 C110 456 100 452 96 440 Z"/>
  <path class="shore" d="M96 440 C104 424 122 400 140 380 C156 364 168 352 172 350 C186 336 200 324 205 320 C222 304 236 292 245 285 C262 268 280 252 290 240 C300 228 312 214 318 205 C330 190 342 180 350 175 C368 162 384 150 400 140 C430 122 450 110 470 100 C500 86 520 78 540 70 C560 62 584 52 600 48"/>
  <path class="shore" d="M600 215 C580 220 556 226 540 230 C510 238 494 246 480 250 C450 256 436 260 420 260 C400 262 388 264 375 262 C362 260 356 254 352 250 C348 254 346 258 345 262 C336 278 330 290 320 300 C306 318 296 334 285 345 C268 360 254 372 240 380 C226 390 214 400 205 405 C190 414 174 424 160 430 C146 437 134 446 120 452 C110 456 100 452 96 440"/>
  <path class="shore" d="M100 452 C88 466 72 474 40 486" stroke-dasharray="3 5"/>
  <text class="lake-label" x="430" y="188">Lac Léman</text>
  <text class="river" x="44" y="478" font-size="11" fill="rgba(238,242,240,.5)" style="font-weight:500">Rhône</text>
  <path class="route" d="M108 424 C126 400 150 376 172 356 C196 334 222 312 246 292 C270 270 292 248 306 230 C312 222 316 214 318 208"/>
  <path class="route-draw" d="M108 424 C126 400 150 376 172 356 C196 334 222 312 246 292 C270 270 292 248 306 230 C312 222 316 214 318 208"/>
  <g class="pin" data-place="geneve" transform="translate(108 424)">
    <circle class="pin-halo" r="10"/><circle class="pin-core" r="6.5"/>
  </g>
  <g class="pin" data-place="nyon" transform="translate(318 206)">
    <circle class="pin-halo" r="10"/><circle class="pin-core" r="6.5"/>
  </g>
  <text x="300" y="196" text-anchor="end">Nyon</text>
  <text class="sub" x="300" y="214" text-anchor="end" font-size="11.5" fill="rgba(238,242,240,.7)" style="font-weight:500">jeudi</text>
  <text x="128" y="430">Genève</text>
  <text class="sub" x="128" y="447" font-size="11.5" fill="rgba(238,242,240,.7)" style="font-weight:500">Bains des Pâquis · mer. et ven.</text>
</svg>`;

export function initLakeMap(root) {
  root.insertAdjacentHTML("afterbegin", LAKE_SVG);
  const svg = root.querySelector(".lakemap");
  const info = aujourdhui();
  // sur téléphone, on resserre le cadre sur les deux lieux pour garder des noms lisibles
  const narrow = window.matchMedia("(max-width: 600px)");
  const fit = () => svg.setAttribute("viewBox", narrow.matches ? "24 150 384 320" : "0 0 600 500");
  fit();
  if (narrow.addEventListener) narrow.addEventListener("change", fit);
  svg.querySelectorAll(".pin").forEach((p) => p.classList.toggle("is-today", p.dataset.place === info.lieu));
  const draw = svg.querySelector(".route-draw");
  if (state.calm) return;
  gsap.fromTo(draw, { drawSVG: "0%" }, {
    drawSVG: "100%", ease: "none",
    scrollTrigger: { trigger: root, start: "top 80%", end: "bottom 50%", scrub: 0.6 },
  });
  gsap.from(svg.querySelectorAll(".pin"), { scale: 0, transformOrigin: "center", duration: 1, stagger: 0.25, ease: "back.out(2)", scrollTrigger: { trigger: root, start: "top 75%", once: true } });
}
