// Formulaires simulés : demande de rendez-vous à Nyon, liste d'attente du cours, commande de bon cadeau.
// Rien n'est envoyé : chaque formulaire se termine par un récapitulatif clairement marqué « démonstration ».
/* global gsap */
import { state } from "../core.js";
import { DATA, prochainsJeudis, formatDate, chf } from "../data.js";

function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

/** Formulaire en étapes : chaque <fieldset data-step> est une étape. */
function stepper(form, { onFinish, validate }) {
  const steps = Array.from(form.querySelectorAll("[data-step]"));
  const nav = form.querySelector(".form-steps");
  const prev = form.querySelector("[data-prev]");
  const next = form.querySelector("[data-next]");
  const nextLabel = next ? next.textContent : "";
  let i = 0;

  function show(n, dir = 1) {
    steps.forEach((s, k) => { s.hidden = k !== n; });
    if (nav) nav.querySelectorAll("li").forEach((li, k) => {
      li.classList.toggle("done", k < n);
      if (k === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    if (prev) prev.hidden = n === 0;
    if (next) next.querySelector(".btn-label").textContent = n === steps.length - 1 ? (next.dataset.last || "Envoyer") : nextLabel.trim();
    if (!state.calm) gsap.fromTo(steps[n], { x: 30 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6 });
    const first = steps[n].querySelector("input, select, textarea, button");
    if (first && i !== n) first.focus({ preventScroll: true });
    i = n;
  }

  function check(n) {
    const errs = [];
    steps[n].querySelectorAll(".err").forEach((e) => e.remove());
    steps[n].querySelectorAll("[required]").forEach((el) => {
      const field = el.closest(".field") || el.closest(".fieldset");
      let ok = el.type === "radio" ? !!form.querySelector(`input[name="${el.name}"]:checked`) : el.checkValidity();
      if (!ok && field && !field.querySelector(".err")) {
        const p = document.createElement("p");
        p.className = "err";
        p.textContent = el.type === "email" ? "Indiquez une adresse e-mail valide, par exemple prenom@exemple.ch." : (el.type === "radio" ? "Choisissez une option pour continuer." : "Ce champ est nécessaire pour continuer.");
        field.appendChild(p);
        errs.push(el);
      }
    });
    if (validate) validate(n, errs);
    if (errs.length) errs[0].focus();
    return errs.length === 0;
  }

  if (prev) prev.addEventListener("click", () => show(Math.max(0, i - 1), -1));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!check(i)) return;
    if (i < steps.length - 1) show(i + 1, 1);
    else onFinish(new FormData(form));
  });
  show(0);
  return { reset: () => { form.reset(); show(0); } };
}

function finish(form, html) {
  const done = document.createElement("div");
  done.className = "form-done";
  done.setAttribute("role", "status");
  done.innerHTML = html + `<p><button type="button" class="btn btn--ghost btn--small" data-again><span class="btn-label">Recommencer</span></button></p>`;
  form.hidden = true;
  form.after(done);
  if (!state.calm) gsap.from(done, { y: 20, opacity: 0, duration: 0.7 });
  done.querySelector("[data-again]").addEventListener("click", () => { done.remove(); form.hidden = false; form._stepper && form._stepper.reset(); });
  done.focus && done.setAttribute("tabindex", "-1");
  done.focus();
}

/* ---------- Rendez-vous à Nyon ---------- */
export function initBooking(form) {
  const dates = form.querySelector("[data-dates]");
  if (dates) {
    dates.innerHTML = prochainsJeudis(6).map((d, k) => {
      const iso = d.toISOString().slice(0, 10);
      return `<label class="opt"><input type="radio" name="date" value="${iso}" ${k === 0 ? "required" : ""} data-label="${formatDate(d)}"><span><b>${formatDate(d)}</b><small>Nyon · créneau à confirmer</small></span></label>`;
    }).join("");
  }
  form._stepper = stepper(form, {
    onFinish(fd) {
      const dateInput = form.querySelector('input[name="date"]:checked');
      const items = [
        ["Massage", fd.get("massage")],
        ["Durée", fd.get("duree") ? `${fd.get("duree")} min · ${chf(fd.get("duree") === "60" ? 100 : 70)}` : "—"],
        ["Jour", dateInput ? dateInput.dataset.label : "—"],
        ["Moment", fd.get("moment") || "—"],
        ["Nom", `${fd.get("prenom")} ${fd.get("nom")}`],
        ["Téléphone", fd.get("tel")],
      ];
      finish(form, `<p class="demo-flag">Démonstration · rien n'a été envoyé</p>
        <p class="h3">Votre demande est prête, ${esc(fd.get("prenom"))}.</p>
        <ul class="summary">${items.map(([k, v]) => `<li><span>${k}</span><span>${esc(v)}</span></li>`).join("")}</ul>
        <p class="small">Sur le vrai site, Beat recevrait cette demande et confirmerait l'heure. Pour réserver aujourd'hui : <strong class="num">${DATA.telephone}</strong>.</p>`);
    },
  });
}

/* ---------- Liste d'attente du cours ---------- */
export function initWaitlist(form) {
  form._stepper = stepper(form, {
    onFinish(fd) {
      finish(form, `<p class="demo-flag">Démonstration · rien n'a été envoyé</p>
        <p class="h3">Merci ${esc(fd.get("prenom"))}.</p>
        <p>Sur le vrai site, vous seriez prévenu·e dès que les dates ${DATA.cours.annee} sont fixées. En attendant, écrivez à <strong>${DATA.email}</strong>.</p>`);
    },
  });
}

/* ---------- Commande de bons cadeaux ---------- */
export function initGiftOrder(form, onName) {
  const qty = form.querySelector('input[name="quantite"]');
  const total = form.querySelectorAll("[data-total]");
  const pour = form.querySelector('input[name="pour"]');
  const upd = () => {
    const n = Math.min(5, Math.max(1, Number(qty.value) || 1));
    total.forEach((t) => { t.textContent = chf(n * DATA.bon.prix); });
  };
  form.querySelectorAll("[data-qty]").forEach((b) => b.addEventListener("click", () => {
    qty.value = Math.min(5, Math.max(1, (Number(qty.value) || 1) + Number(b.dataset.qty)));
    upd();
    if (!state.calm) gsap.fromTo(total, { y: -8, opacity: 0.3 }, { y: 0, opacity: 1, duration: 0.4 });
  }));
  qty.addEventListener("input", upd);
  if (pour && onName) pour.addEventListener("input", () => onName(pour.value));
  upd();
  form._stepper = stepper(form, {
    onFinish(fd) {
      const n = Math.min(5, Math.max(1, Number(fd.get("quantite")) || 1));
      const items = [
        ["Bons", `${n} × massage de 60 min`],
        ["Total", chf(n * DATA.bon.prix)],
        ["Pour", fd.get("pour") || "—"],
        ["De la part de", fd.get("de") || "—"],
        ["Envoi à", `${fd.get("adresse")}`],
        ["Paiement", fd.get("paiement")],
      ];
      finish(form, `<p class="demo-flag">Démonstration · aucun paiement effectué</p>
        <p class="h3">Votre commande est prête.</p>
        <ul class="summary">${items.map(([k, v]) => `<li><span>${k}</span><span>${esc(v)}</span></li>`).join("")}</ul>
        <p class="small">Sur le vrai site, le paiement passerait par ${esc(fd.get("paiement"))} et Beat enverrait la carte postale avec son enveloppe.</p>`);
    },
  });
}
