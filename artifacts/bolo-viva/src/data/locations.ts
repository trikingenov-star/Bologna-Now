// Precise Bologna coordinates for known locations
export const LOCATION_COORDS: Record<string, { lat: number; lng: number; address: string }> = {
  // ── Core Locations ───────────────────────────────────────────
  "piazza-maggiore": {
    lat: 44.4938, lng: 11.3426,
    address: "Piazza Maggiore, 40124 Bologna BO",
  },
  "fontana-nettuno": {
    lat: 44.4937, lng: 11.3424,
    address: "Piazza del Nettuno, 40124 Bologna BO",
  },
  "quadrilatero": {
    lat: 44.4943, lng: 11.3448,
    address: "Via Pescherie Vecchie, 40124 Bologna BO",
  },
  "torre-asinelli": {
    lat: 44.4942, lng: 11.3463,
    address: "Piazza di Porta Ravegnana, 40126 Bologna BO",
  },
  "piazza-santo-stefano": {
    lat: 44.4921, lng: 11.3469,
    address: "Piazza Santo Stefano, 40125 Bologna BO",
  },
  "archiginnasio": {
    lat: 44.4929, lng: 11.3430,
    address: "Piazza Galvani 1, 40124 Bologna BO",
  },
  "mercato-erbe": {
    lat: 44.4967, lng: 11.3352,
    address: "Via Ugo Bassi 2, 40121 Bologna BO",
  },
  "mambo-museum": {
    lat: 44.4988, lng: 11.3316,
    address: "Via Don Giovanni Minzoni 14, 40121 Bologna BO",
  },
  "giardini-margherita": {
    lat: 44.4820, lng: 11.3505,
    address: "Viale Gozzadini, 40125 Bologna BO",
  },
  "colle-osservanza": {
    lat: 44.4775, lng: 11.3480,
    address: "Via dell'Osservanza, 40136 Bologna BO",
  },
  "via-fondazza": {
    lat: 44.4890, lng: 11.3455,
    address: "Via Fondazza, 40125 Bologna BO",
  },
  "via-pratello-walk": {
    lat: 44.4935, lng: 11.3358,
    address: "Via del Pratello, 40122 Bologna BO",
  },
  // San Luca porticoes (bottom/start)
  "portici-sanluca": {
    lat: 44.4910, lng: 11.3370,
    address: "Porta Saragozza, Via di San Luca, 40135 Bologna BO",
  },
  "walk-portici": {
    lat: 44.4844, lng: 11.2989,
    address: "Santuario della Madonna di San Luca, Via di San Luca 36, 40135 Bologna BO",
  },

  // ── Food & Restaurants ───────────────────────────────────────
  "espresso-ritual": {
    lat: 44.4937, lng: 11.3413,
    address: "Bar Zanarini, Piazza Galvani 1, 40124 Bologna BO",
  },
  "bar-zanarini": {
    lat: 44.4929, lng: 11.3413,
    address: "Piazza Galvani 1, 40124 Bologna BO",
  },
  "osteria-lunch": {
    lat: 44.4932, lng: 11.3441,
    address: "Osteria dell'Orsa, Via Mentana 1, 40126 Bologna BO",
  },
  "osteria-orsa": {
    lat: 44.4960, lng: 11.3440,
    address: "Via Mentana 1, 40126 Bologna BO",
  },
  "trattoria-biassanot": {
    lat: 44.4940, lng: 11.3453,
    address: "Via Piella 16/A, 40126 Bologna BO",
  },
  "drogheria-rosa": {
    lat: 44.4905, lng: 11.3465,
    address: "Via Cartoleria 10, 40124 Bologna BO",
  },
  "ristorante-al-cambio": {
    lat: 44.5080, lng: 11.3620,
    address: "Via Stalingrado 150, 40128 Bologna BO",
  },

  // ── Bars & Aperitivi ─────────────────────────────────────────
  "aperitivo-santo": {
    lat: 44.4921, lng: 11.3469,
    address: "Piazza Santo Stefano, 40125 Bologna BO",
  },
  "pratello-bar": {
    lat: 44.4935, lng: 11.3358,
    address: "Via del Pratello, 40122 Bologna BO",
  },

  // ── Events ───────────────────────────────────────────────────
  "jazz-porticoes": {
    lat: 44.4938, lng: 11.3426,
    address: "Piazza Maggiore, 40124 Bologna BO",
  },
  "techno-locomotiv": {
    lat: 44.5050, lng: 11.3162,
    address: "Locomotiv Club, Via Sebastiano Serlio 25/2, 40128 Bologna BO",
  },
  "street-art-tour": {
    lat: 44.4989, lng: 11.3494,
    address: "Via Zamboni, 40126 Bologna BO",
  },
  "live-sagra-tortellini": {
    lat: 44.4943, lng: 11.3415,
    address: "Piazza Re Enzo, 40124 Bologna BO",
  },
  "live-cinema-piazza": {
    lat: 44.4938, lng: 11.3426,
    address: "Piazza Maggiore, 40124 Bologna BO",
  },
  "live-mercato-antiquariato": {
    lat: 44.4921, lng: 11.3469,
    address: "Piazza Santo Stefano, 40125 Bologna BO",
  },

  // ── Outdoor & Sport ──────────────────────────────────────────
  "bike-bologna": {
    lat: 44.4938, lng: 11.3426,
    address: "Piazza Maggiore, 40124 Bologna BO",
  },
  "running-parchi": {
    lat: 44.4820, lng: 11.3505,
    address: "Giardini Margherita, 40125 Bologna BO",
  },
  "palestra-vettori": {
    lat: 44.5100, lng: 11.3160,
    address: "Via Emilia Ponente, 40132 Bologna BO",
  },
};

export function getCoords(id: string) {
  return LOCATION_COORDS[id] ?? null;
}
