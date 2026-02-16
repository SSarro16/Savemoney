// constants/styles.js
// 🔥 Tema dinamico (stessi token: colors.primary700, colors.white06, ecc.)
// - Non devi cambiare i nomi dei token in giro per l'app.
// - Il ThemeContext aggiorna GlobalStyles.colors "in place" e forza re-render.

export const THEMES = {
  DARK: {
    key: "DARK",
    label: "Dark",
    primary800: "#111319",
    primary700: "#1a1f29",
    primary500: "#2b3445",
    accent500: "#4fd2ff",
    textOnPrimary: "light",
  },

  OBSIDIAN: {
    key: "OBSIDIAN",
    label: "Nero",
    primary800: "#060608",
    primary700: "#0e0f13",
    primary500: "#1b1e26",
    accent500: "#a3a9b8",
    textOnPrimary: "light",
  },

  BLUE: {
    key: "BLUE",
    label: "Blue",
    primary800: "#071d4a",
    primary700: "#102f6b",
    primary500: "#1a4f9f",
    accent500: "#63b8ff",
    textOnPrimary: "light",
  },

  GREEN: {
    key: "GREEN",
    label: "Green",
    primary800: "#0e2317",
    primary700: "#163626",
    primary500: "#24583d",
    accent500: "#8eea5f",
    textOnPrimary: "light",
  },

  RED: {
    key: "RED",
    label: "Red",
    primary800: "#2b0f17",
    primary700: "#3f1420",
    primary500: "#662338",
    accent500: "#ff7b9a",
    textOnPrimary: "light",
  },

  YELLOW: {
    key: "YELLOW",
    label: "Yellow",
    primary800: "#f8f0c8",
    primary700: "#fff8dc",
    primary500: "#f2e39b",
    accent500: "#be8a00",
    textOnPrimary: "dark",
  },

  MINT: {
    key: "MINT",
    label: "Menta",
    primary800: "#def7ef",
    primary700: "#effdf8",
    primary500: "#cdeedc",
    accent500: "#138b7a",
    textOnPrimary: "dark",
  },

  SAND: {
    key: "SAND",
    label: "Sabbia",
    primary800: "#f6ead7",
    primary700: "#fff5e8",
    primary500: "#edd8b5",
    accent500: "#a86422",
    textOnPrimary: "dark",
  },

  PURPLE_GOLD: {
    key: "PURPLE_GOLD",
    label: "Viola",
    primary800: "#200364",
    primary700: "#2d0689",
    primary500: "#3e04c3",
    accent500: "#f7bc0c",
    textOnPrimary: "light",
  },

  ROSE: {
    key: "ROSE",
    label: "Rosa",
    primary800: "#2a0d24",
    primary700: "#3f1537",
    primary500: "#65265a",
    accent500: "#ff59b8",
    textOnPrimary: "light",
  },

  // ✅ Ocean = più chiaro => testo scuro
  OCEAN: {
    key: "OCEAN",
    label: "Oceano",
    primary800: "#03273a",
    primary700: "#07415b",
    primary500: "#0f678d",
    accent500: "#32d4ff",
    textOnPrimary: "light",
  },

  // Extra chiaro neutro (testo scuro)
  LIGHT: {
    key: "LIGHT",
    label: "Chiaro",
    primary800: "#f3f5fa",
    primary700: "#ffffff",
    primary500: "#e8edf7",
    accent500: "#3d63f0",
    textOnPrimary: "dark",
  },

  FOREST: {
    key: "FOREST",
    label: "Foresta",
    primary800: "#0b1f12",
    primary700: "#12311d",
    primary500: "#1f4b2f",
    accent500: "#63d87a",
    textOnPrimary: "light",
  },

  SUNSET: {
    key: "SUNSET",
    label: "Tramonto",
    primary800: "#2b1110",
    primary700: "#441a15",
    primary500: "#703322",
    accent500: "#ffb14a",
    textOnPrimary: "light",
  },

  SLATE: {
    key: "SLATE",
    label: "Ardesia",
    primary800: "#161920",
    primary700: "#222836",
    primary500: "#39435a",
    accent500: "#f6a63a",
    textOnPrimary: "light",
  },

  MIDNIGHT_TEAL: {
    key: "MIDNIGHT_TEAL",
    label: "Notte Petrolio",
    primary800: "#040d0f",
    primary700: "#0a1a1d",
    primary500: "#123238",
    accent500: "#33c7b9",
    textOnPrimary: "light",
  },

  GRAPHITE_LIME: {
    key: "GRAPHITE_LIME",
    label: "Grafite Lime",
    primary800: "#0f1012",
    primary700: "#171a1e",
    primary500: "#242b34",
    accent500: "#c8ff47",
    textOnPrimary: "light",
  },

  BORDEAUX: {
    key: "BORDEAUX",
    label: "Bordeaux",
    primary800: "#22090f",
    primary700: "#340f18",
    primary500: "#571b2a",
    accent500: "#ff5d8f",
    textOnPrimary: "light",
  },

  NIGHT_COPPER: {
    key: "NIGHT_COPPER",
    label: "Notte Rame",
    primary800: "#170f0b",
    primary700: "#251811",
    primary500: "#3a281d",
    accent500: "#f6b36b",
    textOnPrimary: "light",
  },

  AURORA: {
    key: "AURORA",
    label: "Aurora",
    primary800: "#08142b",
    primary700: "#112348",
    primary500: "#1f3f75",
    accent500: "#73f4c9",
    textOnPrimary: "light",
  },

  CHERRY_NIGHT: {
    key: "CHERRY_NIGHT",
    label: "Cherry Night",
    primary800: "#190913",
    primary700: "#290f1f",
    primary500: "#48213b",
    accent500: "#ff4f88",
    textOnPrimary: "light",
  },
};

function rgba(hex, a) {
  const h = String(hex || "").replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${a})`;
}

function makeThemeColors(t) {
  const isDarkText = t.textOnPrimary === "dark";

  const white = "#ffffff";
  const black = "#000000";
  const danger = "#d81b60";

  // “whiteXX” tokens: su temi chiari diventano “blackXX”
  const shade = (alpha) =>
    isDarkText ? rgba(black, alpha) : rgba(white, alpha);

  // testo su accent pieno (es. bottone primario)
  const textOnAccentStrong = "#0f172a";

  return {
    // ✅ original tokens (compat)
    primary50: "#e4d9fd",
    primary100: "#c6affc",
    primary200: "#a281f0",
    primary400: "#5721d4",
    primary500: t.primary500,
    primary700: t.primary700,
    primary800: t.primary800,

    accent500: t.accent500,

    // errors / danger
    error500: danger,
    error50: "#fcc4e4",
    danger12: rgba(danger, 0.12),
    danger20: rgba(danger, 0.2),
    danger22: rgba(danger, 0.22),
    danger30: rgba(danger, 0.3),

    gray500: "#39324a",
    gray700: "#221c30",

    bg: t.primary800,
    overlay60: "rgba(0,0,0,0.60)",
    overlay55: "rgba(0,0,0,0.55)",
    overlay72: "rgba(0,0,0,0.72)",

    // ✅ “white tokens” (dark themes = white overlay, light themes = black overlay)
    white92: shade(0.92),
    white90: shade(0.9),
    white88: shade(0.88),
    white85: shade(0.85),
    white80: shade(0.8),
    white78: shade(0.78),
    white75: shade(0.75),
    white72: shade(0.72),
    white70: shade(0.7),
    white65: shade(0.65),
    white60: shade(0.6),
    white55: shade(0.55),
    white45: shade(0.45),
    white40: shade(0.4),
    white35: shade(0.35),
    white20: shade(0.2),
    white28: shade(0.28),
    white22: shade(0.22),
    white18: shade(0.18),
    white16: shade(0.16),
    white14: shade(0.14),
    white12: shade(0.12),
    white10: shade(0.1),
    white08: shade(0.08),
    white06: shade(0.06),

    // accent subtle fills
    accent12: rgba(t.accent500, 0.12),
    accent16: rgba(t.accent500, 0.16),
    accent18: rgba(t.accent500, 0.18),
    accent28: rgba(t.accent500, 0.28),
    accent30: rgba(t.accent500, 0.3),
    accent35: rgba(t.accent500, 0.35),

    // ✅ testo: titoli/descrizioni (risolve “LIGHT molte scritte nere”)
    // - Ocean/LIGHT => testo scuro
    // - Purple/Rose => testo chiaro
    textTitle: isDarkText ? "#0f172a" : "#ffffff",
    textBody: isDarkText ? "rgba(15,23,42,0.88)" : "rgba(255,255,255,0.90)",
    textMuted: isDarkText ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.65)",
    textFaint: isDarkText ? "rgba(15,23,42,0.52)" : "rgba(255,255,255,0.52)",
    textOnAccent: isDarkText ? "#0f172a" : "#ffffff",
    textOnAccentStrong,

    // surfaces utili
    surface: t.primary700,
    surface2: t.primary800,
    border: shade(0.1),
    borderStrong: shade(0.16),
  };
}

// ⚠️ Non cambiare il nome: l'app usa GlobalStyles.colors ovunque.
export const GlobalStyles = {
  colors: makeThemeColors(THEMES.OCEAN),
};

// Aggiorna il tema in-place (così i `const colors = GlobalStyles.colors` puntano allo stesso oggetto).
export function applyTheme(themeKey) {
  const key = THEMES[themeKey] ? themeKey : "OCEAN";
  const next = makeThemeColors(THEMES[key]);
  Object.assign(GlobalStyles.colors, next);
  return key;
}
