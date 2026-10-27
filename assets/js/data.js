// Données pratiques du site, rassemblées en un seul endroit.
// Source : beathaechler.ch (relevé du 27 octobre 2026) et, pour Genève, le site des Bains des Pâquis (aubp.ch).

export const DATA = {
  nom: "Beat Hächler",
  telephone: "079 381 24 67",
  telephoneLien: "tel:+41793812467",
  email: "contact@beathaechler.ch",
  fuseau: "Europe/Zurich",
  lieux: {
    nyon: {
      nom: "Nyon",
      jours: [4], // jeudi
      adresse: "Ruelle de la Poterne 13, 1260 Nyon",
    },
    geneve: {
      nom: "Genève",
      jours: [3, 5], // mercredi et vendredi
      adresse: "Bains des Pâquis, Quai du Mont-Blanc 30, 1201 Genève",
      agenda: "https://mains-des-bains.agenda.ch",
      tarif: "50 min · CHF 80.–",
    },
  },
  tarifs: [
    { duree: 60, prix: 100 },
    { duree: 40, prix: 70 },
  ],
  bon: { duree: 60, prix: 100, paiements: ["Twint", "PayPal", "Virement postal"] },
  cours: { prix: 320, annee: 2027, horaires: "9h30 – 17h30", places: "4 à 6 personnes" },
};

export const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const COURTS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Jour de la semaine (0 = dimanche) à l'heure suisse, quel que soit le fuseau du visiteur. */
export function jourSuisse(date = new Date()) {
  try {
    const court = new Intl.DateTimeFormat("en-US", { timeZone: DATA.fuseau, weekday: "short" }).format(date);
    return COURTS[court] ?? date.getDay();
  } catch (e) {
    return date.getDay();
  }
}

export function lieuDuJour(jour) {
  if (DATA.lieux.nyon.jours.includes(jour)) return "nyon";
  if (DATA.lieux.geneve.jours.includes(jour)) return "geneve";
  return null;
}

/** Où consulte Beat aujourd'hui, et sinon quel est le prochain jour de consultation. */
export function aujourdhui(date = new Date()) {
  const j = jourSuisse(date);
  const lieu = lieuDuJour(j);
  let prochain = null;
  for (let k = 1; k <= 7; k++) {
    const jj = (j + k) % 7;
    const l = lieuDuJour(jj);
    if (l) { prochain = { jour: jj, lieu: l, dans: k }; break; }
  }
  return { jour: j, nomJour: JOURS[j], lieu, prochain };
}

export function texteAujourdhui(info = aujourdhui()) {
  if (info.lieu) {
    return `Aujourd'hui ${info.nomJour}, Beat consulte à ${DATA.lieux[info.lieu].nom}`;
  }
  const p = info.prochain;
  const quand = p.dans === 1 ? "demain" : JOURS[p.jour];
  return `Aujourd'hui ${info.nomJour} : pas de consultation · ${quand} à ${DATA.lieux[p.lieu].nom}`;
}

/** Les n prochains jeudis (pour la demande de rendez-vous à Nyon). */
export function prochainsJeudis(n = 6, from = new Date()) {
  const out = [];
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const j = jourSuisse(from);
  let delta = (4 - j + 7) % 7;
  if (delta === 0) delta = 7; // le jour même est rarement réservable en ligne
  d.setDate(d.getDate() + delta);
  for (let i = 0; i < n; i++) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return out;
}

export function formatDate(d) {
  return new Intl.DateTimeFormat("fr-CH", { weekday: "long", day: "numeric", month: "long" }).format(d);
}

export function chf(n) {
  return `CHF ${n}.–`;
}
