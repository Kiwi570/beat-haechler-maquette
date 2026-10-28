// Interface commune : curseur, boutons, en-tête, menu, transitions de page, copie, « aujourd'hui ».
/* global gsap, ScrollTrigger */
import { state, setCalm, session, scrollToTarget } from "./core.js?v=20261028";
import { aujourdhui, texteAujourdhui, DATA, JOURS } from "./data.js?v=20261028";

/* ---------- Curseur « pulpe du doigt » ---------- */
export function initCursor() {
  if (!state.fine || state.calm) return;
  const html = document.documentElement;
  const cursor = document.createElement("div");
  cursor.className = "cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML = '<div class="cursor-dot"></div><div class="cursor-label"></div>';
  document.body.appendChild(cursor);
  html.classList.add("has-cursor");
  const dot = cursor.querySelector(".cursor-dot");
  const label = cursor.querySelector(".cursor-label");
  const xTo = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
  const yTo = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
  gsap.set(cursor, { x: -100, y: -100 });

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    xTo(e.clientX); yTo(e.clientY);
  }, { passive: true });

  window.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    gsap.to(dot, { scaleX: 1.35, scaleY: 0.72, duration: 0.18, ease: "power2.out" });
    const ring = document.createElement("div");
    ring.className = "cursor-ring";
    ring.style.left = e.clientX + "px"; ring.style.top = e.clientY + "px";
    if (cursor.classList.contains("is-dark")) ring.classList.add("is-dark");
    document.body.appendChild(ring);
    gsap.fromTo(ring, { scale: 0.6, opacity: 0.9 }, { scale: 4.2, opacity: 0, duration: 1.1, ease: "power2.out", onComplete: () => ring.remove() });
  });
  window.addEventListener("pointerup", () => gsap.to(dot, { scaleX: 1, scaleY: 1, duration: 0.6, ease: "elastic.out(1, .45)" }));

  const DARK = ".on-dark, .section--deep, .site-footer, .menu, .trigger-stage, .map-wrap, .band";
  document.addEventListener("pointerover", (e) => {
    cursor.classList.toggle("is-dark", !!(e.target.closest && e.target.closest(DARK)));
    const t = e.target.closest("[data-cursor], a, button, .zone, .tp, label.opt");
    if (!t) { cursor.classList.remove("is-hover", "is-label"); return; }
    const txt = t.getAttribute("data-cursor");
    if (txt) { label.textContent = txt; cursor.classList.add("is-label"); cursor.classList.remove("is-hover"); }
    else { cursor.classList.add("is-hover"); cursor.classList.remove("is-label"); }
  });
  document.addEventListener("mouseleave", () => gsap.set(cursor, { x: -100, y: -100 }));
}

/* ---------- Boutons : onde au survol, effet magnétique ---------- */
/** Onde au survol d'un bouton (aussi pour les boutons ajoutés après coup). */
export function bindButton(btn) {
  if (btn.dataset.bound) return;
  btn.dataset.bound = "1";
  if (!btn.querySelector(".btn-ripple")) {
    const r = document.createElement("span");
    r.className = "btn-ripple"; r.setAttribute("aria-hidden", "true");
    btn.prepend(r);
  }
  const ripple = btn.querySelector(".btn-ripple");
  btn.addEventListener("pointerenter", (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const size = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y)) * 2.2 / 10;
    gsap.killTweensOf(ripple);
    gsap.set(ripple, { left: x, top: y });
    gsap.to(ripple, { scale: size, duration: state.calm ? 0 : 0.6, ease: "power2.out" });
  });
  btn.addEventListener("pointerleave", (e) => {
    const rect = btn.getBoundingClientRect();
    gsap.set(ripple, { left: e.clientX - rect.left, top: e.clientY - rect.top });
    gsap.to(ripple, { scale: 0, duration: state.calm ? 0 : 0.5, ease: "power2.in" });
  });
}

export function initButtons() {
  document.querySelectorAll(".btn").forEach(bindButton);

  if (!state.fine || state.calm) return;
  document.querySelectorAll(".magnetic").forEach((el) => {
    const label = el.querySelector(".btn-label") || el;
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, .5)" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, .5)" });
    const lx = gsap.quickTo(label, "x", { duration: 0.6, ease: "elastic.out(1, .5)" });
    const ly = gsap.quickTo(label, "y", { duration: 0.6, ease: "elastic.out(1, .5)" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      xTo(dx * 0.28); yTo(dy * 0.35);
      if (label !== el) { lx(dx * 0.12); ly(dy * 0.15); }
    });
    el.addEventListener("pointerleave", () => { xTo(0); yTo(0); if (label !== el) { lx(0); ly(0); } });
  });
}

/* ---------- Cartes qui s'inclinent ---------- */
export function initTilt() {
  if (!state.fine || state.calm) return;
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    const max = Number(card.dataset.tilt) || 7;
    const rx = gsap.quickTo(card, "rotationX", { duration: 0.8, ease: "power3" });
    const ry = gsap.quickTo(card, "rotationY", { duration: 0.8, ease: "power3" });
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * max * 2); rx((0.5 - py) * max * 2);
      card.style.setProperty("--mx", px * 100 + "%"); card.style.setProperty("--my", py * 100 + "%");
    });
    card.addEventListener("pointerleave", () => { rx(0); ry(0); });
  });
}

/* ---------- En-tête : se cache en descendant, revient en remontant ---------- */
export function initHeader() {
  const header = document.querySelector(".site-header");
  const callbar = document.querySelector(".callbar");
  if (!header) return;
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 30);
    const down = y > lastY && y > 240;
    if (Math.abs(y - lastY) > 6) {
      header.classList.toggle("is-hidden", down && !document.documentElement.classList.contains("menu-open"));
      if (callbar) callbar.classList.toggle("is-hidden", !down && y < 200);
    }
    lastY = y;
  };
  if (callbar) callbar.classList.add("is-hidden");
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---------- Menu plein écran ---------- */
export function initMenu() {
  const btn = document.querySelector(".menu-toggle");
  const menu = document.getElementById("menu");
  if (!btn || !menu) return;
  const html = document.documentElement;
  const links = menu.querySelectorAll("a, button");
  let open = false;

  function setOpen(v) {
    open = v;
    btn.setAttribute("aria-expanded", String(v));
    btn.querySelector(".menu-label").textContent = v ? "Fermer" : "Menu";
    html.classList.toggle("menu-open", v);
    if (v) {
      menu.hidden = false;
      if (state.lenis) state.lenis.stop();
      gsap.fromTo(menu, { clipPath: "circle(0% at calc(100% - 60px) 38px)" }, { clipPath: "circle(150% at calc(100% - 60px) 38px)", duration: state.calm ? 0 : 0.9, ease: "power3.inOut" });
      gsap.fromTo(menu.querySelectorAll(".menu-list li"), { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: state.calm ? 0 : 0.8, delay: state.calm ? 0 : 0.25 });
      setTimeout(() => links[0] && links[0].focus(), 50);
    } else {
      if (state.lenis) state.lenis.start();
      gsap.to(menu, { clipPath: "circle(0% at calc(100% - 60px) 38px)", duration: state.calm ? 0 : 0.6, ease: "power3.inOut", onComplete: () => { menu.hidden = true; } });
      btn.focus();
    }
  }
  btn.addEventListener("click", () => setOpen(!open));
  document.addEventListener("keydown", (e) => {
    if (!open) return;
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Tab") {
      const items = [btn, ...links];
      const i = items.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
    }
  });
}

/* ---------- Transitions de page : une vague monte, couvre, puis redescend ---------- */
export function initTransitions() {
  const veil = document.querySelector(".veil");
  const html = document.documentElement;
  const wave = veil && veil.querySelector("path");
  const flat = "M0 120 C 240 120 480 120 720 120 S 1200 120 1440 120 V 120 H 0 Z";
  const curved = "M0 120 C 240 20 480 20 720 70 S 1200 130 1440 40 V 120 H 0 Z";

  function leave(href) {
    if (state.calm || !veil) { window.location.href = href; return; }
    session("bh-veil", "1");
    veil.classList.add("is-active");
    gsap.timeline({ onComplete: () => { window.location.href = href; } })
      .set(veil, { yPercent: 105, y: 0 })
      .to(veil, { yPercent: 0, duration: 0.75, ease: "power3.inOut" }, 0)
      .fromTo(wave, { attr: { d: flat } }, { attr: { d: curved }, duration: 0.4, ease: "sine.out" }, 0)
      .to(wave, { attr: { d: flat }, duration: 0.35, ease: "sine.in" }, 0.4);
  }

  // arrivée : si on vient d'une autre page, la vague se retire
  const arrived = html.classList.contains("is-veiled");
  session("bh-veil", "0");
  const revealPage = () => {
    if (!arrived || !veil) return Promise.resolve();
    return new Promise((res) => {
      gsap.timeline({ onComplete: () => { html.classList.remove("is-veiled"); veil.classList.remove("is-active"); gsap.set(veil, { clearProps: "all" }); res(); } })
        .set(veil, { yPercent: 0 })
        .to(veil, { yPercent: -125, duration: 0.85, ease: "power3.inOut", delay: 0.05 })
        .fromTo(wave, { attr: { d: flat } }, { attr: { d: curved }, duration: 0.5 }, 0);
    });
  };

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (a.target === "_blank" || a.hasAttribute("download")) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || /^https?:/i.test(href)) {
      if (href && href.startsWith("#") && href.length > 1) {
        const target = document.querySelector(href);
        if (target) { e.preventDefault(); scrollToTarget(target); }
      }
      return;
    }
    e.preventDefault();
    leave(href);
  });

  // retour arrière depuis le cache du navigateur : retirer le voile
  window.addEventListener("pageshow", (e) => { if (e.persisted && veil) { gsap.set(veil, { clearProps: "all" }); veil.classList.remove("is-active"); html.classList.remove("is-veiled"); } });

  return revealPage;
}

/* ---------- Mode calme ---------- */
export function initCalmToggles() {
  document.querySelectorAll(".calm-toggle").forEach((b) => {
    b.setAttribute("aria-pressed", String(state.calm));
    b.addEventListener("click", () => setCalm(!state.calm));
  });
}

/* ---------- Copier téléphone / e-mail ---------- */
export function initCopy() {
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    const icon = btn.classList.contains("copy--icon");
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy;
      const oldHtml = btn.innerHTML;
      const oldLabel = btn.getAttribute("aria-label");
      let msg = "Copié";
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        const val = btn.parentElement.querySelector(".val");
        if (val) {
          const range = document.createRange(); range.selectNodeContents(val);
          const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        }
        msg = "Sélectionné";
      }
      btn.classList.add("is-done");
      if (icon) { btn.innerHTML = CHECK; btn.setAttribute("aria-label", msg); }
      else btn.textContent = msg;
      setTimeout(() => {
        btn.classList.remove("is-done");
        btn.innerHTML = oldHtml;
        if (oldLabel) btn.setAttribute("aria-label", oldLabel);
      }, 1600);
    });
  });
}

/* ---------- Aujourd'hui : Nyon, Genève ou pas de consultation ---------- */
export function initToday() {
  const info = aujourdhui();
  const page = document.documentElement.dataset.page;
  // le lieu « utile » : celui du jour, sinon le prochain
  const cible = info.lieu || info.prochain.lieu;
  document.querySelectorAll("[data-today]").forEach((el) => {
    el.textContent = texteAujourdhui(info);
    const chip = el.closest("a.chip");
    if (chip) chip.setAttribute("href", `rendez-vous.html#${cible}`);
  });
  document.querySelectorAll("[data-today-date]").forEach((el) => {
    try {
      el.textContent = "Aujourd'hui · " + new Intl.DateTimeFormat("fr-CH", { weekday: "long", day: "numeric", month: "long", timeZone: DATA.fuseau }).format(new Date());
    } catch (e) { /* le texte par défaut reste */ }
  });
  document.querySelectorAll("[data-today-title]").forEach((el) => {
    if (info.lieu === "nyon") el.textContent = "Aujourd'hui, je suis au cabinet de Nyon.";
    else if (info.lieu === "geneve") el.textContent = "Aujourd'hui, je suis aux Bains des Pâquis.";
    else {
      const p = info.prochain;
      const quand = p.dans === 1 ? "demain" : JOURS[p.jour];
      el.textContent = `Prochains massages ${quand}, à ${DATA.lieux[p.lieu].nom}.`;
    }
  });
  document.querySelectorAll("[data-today-next]").forEach((el) => {
    el.textContent = cible === "nyon"
      ? "À Nyon, on réserve par téléphone : appelez-moi, je vous dis s'il reste un créneau."
      : "À Genève, on réserve en ligne sur l'agenda de l'association Mains des Bains.";
  });
  // l'action principale suit le lieu du jour
  document.querySelectorAll("[data-rdv-actions]").forEach((wrap) => {
    wrap.querySelectorAll("[data-act]").forEach((b) => {
      const main = b.dataset.act === cible;
      b.classList.toggle("is-primary", main);
      b.classList.toggle("btn--ghost", !main);
    });
  });
  document.querySelectorAll("[data-place]").forEach((el) => {
    el.classList.toggle("is-today", el.dataset.place === info.lieu);
  });
  // barre d'appel : sur la page rendez-vous, le second bouton mène à l'agenda de Genève
  const cta = document.querySelector("[data-callbar-cta]");
  if (cta && page === "rendez-vous") {
    cta.setAttribute("href", DATA.lieux.geneve.agenda);
    cta.setAttribute("target", "_blank");
    cta.setAttribute("rel", "noopener");
    cta.querySelector(".btn-label").textContent = "Genève en ligne";
  }
  return info;
}

/* ---------- Respiration : fenêtre ouverte depuis n'importe quelle page ---------- */
export function initBreathDialog(startBreath) {
  const dlg = document.getElementById("breath-dialog");
  if (!dlg) return;
  let ctrl = null;
  let opener = null;
  const close = () => {
    dlg.hidden = true;
    if (ctrl) ctrl.stop();
    if (state.lenis) state.lenis.start();
    if (opener) opener.focus();
  };
  document.querySelectorAll("[data-breath-open]").forEach((b) => b.addEventListener("click", () => {
    opener = b;
    dlg.hidden = false;
    if (state.lenis) state.lenis.stop();
    if (!ctrl) ctrl = startBreath(dlg.querySelector(".breath"));
    dlg.querySelector(".close").focus();
  }));
  dlg.querySelector(".close").addEventListener("click", close);
  dlg.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
    if (e.key === "Tab") { // le focus reste dans la fenêtre
      const items = Array.from(dlg.querySelectorAll("button"));
      const i = items.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
    }
  });
}
