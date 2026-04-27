const localImg = (name: string) => `${import.meta.env.BASE_URL}images/${name}`;

export interface EditorialCard {
  id: string;
  category: "storia" | "personaggio" | "luogo" | "curiosità";
  categoryLabel: { en: string; it: string };
  title: { en: string; it: string };
  subtitle: { en: string; it: string };
  body: { en: string; it: string };
  imageUrl: string;
  readTime: number; // minutes
}

export const EDITORIAL_CARDS: EditorialCard[] = [
  {
    id: "storia-torri",
    category: "storia",
    categoryLabel: { en: "History", it: "Storia" },
    title: { en: "Why Bologna Has Two Towers", it: "Perché Bologna ha Due Torri" },
    subtitle: { en: "A medieval rivalry in stone", it: "Una rivalità medievale in pietra" },
    body: {
      en: "In 12th-century Bologna, noble families competed for power and prestige by building towers — the taller your tower, the greater your family's might. At the peak, over 180 towers pierced the Bologna skyline. Two survived: Torre Asinelli (97m) and Torre Garisenda (48m). The Garisenda famously leans even more than Pisa's tower, so much that Dante mentioned it in the Inferno.",
      it: "Nella Bologna del XII secolo, le famiglie nobili gareggiavano per potere e prestigio costruendo torri — più alta era la torre, più grande era il potere della famiglia. Al culmine, oltre 180 torri sfondavano il cielo di Bologna. Due sopravvissero: Torre Asinelli (97m) e Torre Garisenda (48m). La Garisenda pende più della torre di Pisa, tanto che Dante la citò nell'Inferno.",
    },
    imageUrl: localImg("torre-asinelli.png"),
    readTime: 2,
  },
  {
    id: "personaggio-morandi",
    category: "personaggio",
    categoryLabel: { en: "Local Legend", it: "Personaggio" },
    title: { en: "Giorgio Morandi: The Painter of Silence", it: "Giorgio Morandi: Il Pittore del Silenzio" },
    subtitle: { en: "Bologna's most introverted genius", it: "Il genio più introverso di Bologna" },
    body: {
      en: "Giorgio Morandi barely left Bologna his entire life, yet became one of the 20th century's most celebrated painters. He spent decades painting the same bottles, vases, and boxes on his studio shelf — finding infinite variation in stillness. His studio in Via Fondazza is still preserved. Visit MAMbo to see his works in person: you'll understand why he's called 'the painter of silence'.",
      it: "Giorgio Morandi non ha quasi mai lasciato Bologna per tutta la sua vita, eppure è diventato uno dei pittori più celebrati del Novecento. Ha trascorso decenni dipingendo le stesse bottiglie, vasi e scatole sul suo studio — trovando variazione infinita nella quiete. Il suo studio in Via Fondazza è ancora conservato. Visita il MAMbo per vedere le sue opere dal vivo: capirai perché è chiamato 'il pittore del silenzio'.",
    },
    imageUrl: localImg("morandi-editorial.png"),
    readTime: 3,
  },
  {
    id: "luogo-pratello",
    category: "luogo",
    categoryLabel: { en: "Hidden Gem", it: "Luogo" },
    title: { en: "Via del Pratello: Bologna's Living Room", it: "Via del Pratello: Il Salotto di Bologna" },
    subtitle: { en: "Where locals have a drink since 1968", it: "Dove i bolognesi bevono dal 1968" },
    body: {
      en: "Via del Pratello is the bohemian heart of Bologna — a long street lined with aperitivo bars, trattorie, vinyl shops, and vintage stores. It has been the gathering point for students, artists, and workers since the 1968 student movements. No tourists, no tourist prices. Show up at 6pm on any weekday, order a spritz, and you'll feel like a local immediately.",
      it: "Via del Pratello è il cuore bohémien di Bologna — una lunga strada costellata di bar per aperitivo, trattorie, negozi di vinili e vintage. È stata il punto di ritrovo per studenti, artisti e lavoratori fin dai movimenti studenteschi del 1968. Nessun turista, nessun prezzo da turisti. Arriva alle 18:00 di qualsiasi giorno feriale, ordina uno spritz, e ti sentirai subito un local.",
    },
    imageUrl: localImg("via-pratello.png"),
    readTime: 2,
  },
  {
    id: "curiosita-portico",
    category: "curiosità",
    categoryLabel: { en: "Did You Know?", it: "Lo Sapevi?" },
    title: { en: "Bologna Has 38km of Porticoes", it: "Bologna ha 38km di Portici" },
    subtitle: { en: "The world's longest covered walkway", it: "Il portico coperto più lungo del mondo" },
    body: {
      en: "Bologna's porticoes — those elegant covered colonnades lining almost every street — were born in medieval times from a practical need: students renting upper floors would extend their rooms over the street. The city then regulated them. Today, Bologna's 38km of porticoes are a UNESCO World Heritage Site. The most spectacular? The 666-arch portico climbing 3.5km to the Sanctuary of San Luca.",
      it: "I portici di Bologna — quegli eleganti colonnati coperti che costeggiano quasi ogni strada — nacquero nel Medioevo da un'esigenza pratica: gli studenti che affittavano i piani superiori estendevano le loro stanze sulla strada. La città li regolamentò. Oggi, i 38km di portici di Bologna sono Patrimonio UNESCO. Il più spettacolare? Il portico con 666 archi che sale per 3,5km fino al Santuario di San Luca.",
    },
    imageUrl: localImg("portici-editorial.png"),
    readTime: 2,
  },
  {
    id: "storia-universita",
    category: "storia",
    categoryLabel: { en: "History", it: "Storia" },
    title: { en: "The World's Oldest University is Here", it: "La Prima Università del Mondo è Qui" },
    subtitle: { en: "Founded in 1088 — older than Oxford", it: "Fondata nel 1088 — più antica di Oxford" },
    body: {
      en: "The University of Bologna, founded in 1088, is the oldest university in continuous operation in the world. It predates Oxford by nearly a century. Today it still has 85,000 students — the reason Bologna feels so alive, so politically charged, and so full of incredible cheap food. The city never stopped being a university town, and that energy is everywhere.",
      it: "L'Università di Bologna, fondata nel 1088, è la più antica università in funzione continua del mondo. Precede Oxford di quasi un secolo. Oggi ha ancora 85.000 studenti — la ragione per cui Bologna sembra così viva, così politicamente carica, e così piena di cibo economico e incredibile. La città non ha mai smesso di essere una città universitaria, e quell'energia è ovunque.",
    },
    imageUrl: localImg("universita-bologna.png"),
    readTime: 2,
  },
  {
    id: "musica-5-tappe",
    category: "luogo",
    categoryLabel: { en: "Music Route", it: "Itinerario Musicale" },
    title: { en: "The 5 Stops of Music", it: "Le 5 Tappe della Musica" },
    subtitle: { en: "Bologna, UNESCO Creative City of Music", it: "Bologna, Città Creativa della Musica UNESCO" },
    body: {
      it: "Bologna non è solo ragù e portici — è una città che ha la musica nel sangue. Città Creativa della Musica UNESCO, ha dato i natali a Lucio Dalla, Cesare Cremonini e Cristina D'Avena, e ha accolto tra le sue strade i più grandi nomi del jazz mondiale. Questo itinerario ti porta in cinque luoghi dove la musica bolognese ha lasciato il segno: dall'organo del 1475 custodito nella Basilica di San Petronio, alle stelle sul pavimento di Via Capraie che omaggiano Miles Davis ed Ella Fitzgerald, fino alla casa-museo di Lucio Dalla in Via D'Azeglio. E ancora il leggendario Roxy Bar di Via Rizzoli — immortalato da Vasco Rossi — e il Museo Internazionale della Musica in Strada Maggiore, dove riposano manoscritti originali di Mozart, Rossini e Verdi. Cinque tappe, una sola colonna sonora: Bologna.",
      en: "Bologna isn't just about ragù and porticoes — it's a city with music running through its veins. A UNESCO Creative City of Music, it gave the world Lucio Dalla, Cesare Cremonini and Cristina D'Avena, and has welcomed some of the greatest jazz legends to ever perform. This route takes you through five places where Bologna's musical soul is most alive: the 1475 pipe organ inside the Basilica di San Petronio, the Hollywood-style jazz stars embedded in the pavement of Via Capraie — honoring Miles Davis and Ella Fitzgerald — and the home-museum of Lucio Dalla on Via D'Azeglio. Then comes the legendary Roxy Bar on Via Rizzoli, immortalized by Vasco Rossi, and the International Music Museum on Strada Maggiore, home to original manuscripts by Mozart, Rossini and Verdi. Five stops. One soundtrack. Bologna.",
    },
    imageUrl: "https://images.unsplash.com/photo-1653116233769-6d35eba37bdc?w=1200&q=80",
    readTime: 4,
  },
  {
    id: "luogo-certosa",
    category: "luogo",
    categoryLabel: { en: "Hidden Gem", it: "Luogo" },
    title: { en: "The Monumental Cemetery Most Tourists Miss", it: "Il Cimitero Monumentale che i Turisti Ignorano" },
    subtitle: { en: "La Certosa: open-air museum of art", it: "La Certosa: museo d'arte a cielo aperto" },
    body: {
      en: "La Certosa di Bologna is one of Europe's most extraordinary cemeteries — a sprawling complex of neoclassical arcades, chapels, sculptures, and frescoes that reads as an open-air art museum. Stendhal, who visited in 1817, called it the most beautiful cemetery in the world. Free entrance, almost no tourists, and a strangely peaceful atmosphere that locals visit for Sunday walks.",
      it: "La Certosa di Bologna è uno dei cimiteri più straordinari d'Europa — un vasto complesso di arcate neoclassiche, cappelle, sculture e affreschi che si legge come un museo d'arte a cielo aperto. Stendhal, che lo visitò nel 1817, lo definì il cimitero più bello del mondo. Ingresso gratuito, quasi nessun turista, e un'atmosfera stranamente serena che i bolognesi frequentano per le passeggiate domenicali.",
    },
    imageUrl: localImg("certosa-bologna.png"),
    readTime: 3,
  },
];
