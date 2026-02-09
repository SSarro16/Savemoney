// constants/styles.js
// 🔥 Tema dinamico (stessi token: colors.primary700, colors.white06, ecc.)
// - Non devi cambiare i nomi dei token in giro per l'app.
// - Il ThemeContext aggiorna GlobalStyles.colors "in place" e forza re-render.

export const THEMES = {
  DARK: {
    key: "DARK",
    label: "Dark",
    primary800: "#12151b",
    primary700: "#1b2130",
    primary500: "#2a3754",
    accent500: "#4dd0e1",
    textOnPrimary: "light",
  },

  BLUE: {
    key: "BLUE",
    label: "Blue",
    primary800: "#0f2342",
    primary700: "#173661",
    primary500: "#24589a",
    accent500: "#5cc8ff",
    textOnPrimary: "light",
  },

  GREEN: {
    key: "GREEN",
    label: "Green",
    primary800: "#10261b",
    primary700: "#173c2a",
    primary500: "#246043",
    accent500: "#94e86f",
    textOnPrimary: "light",
  },

  RED: {
    key: "RED",
    label: "Red",
    primary800: "#2a1114",
    primary700: "#40171e",
    primary500: "#6f2732",
    accent500: "#ff8a70",
    textOnPrimary: "light",
  },

  YELLOW: {
    key: "YELLOW",
    label: "Yellow",
    primary800: "#f7f2d0",
    primary700: "#fff7dd",
    primary500: "#f5e8a5",
    accent500: "#d1a10b",
    textOnPrimary: "dark",
  },

  MINT: {
    key: "MINT",
    label: "Menta",
    primary800: "#e8f8f2",
    primary700: "#f4fffb",
    primary500: "#d7f2e7",
    accent500: "#1f9f79",
    textOnPrimary: "dark",
  },

  SAND: {
    key: "SAND",
    label: "Sabbia",
    primary800: "#f8f1e5",
    primary700: "#fff9ee",
    primary500: "#f0e1c6",
    accent500: "#b7791f",
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
    primary800: "#2a102c",
    primary700: "#3b1841",
    primary500: "#5d2d66",
    accent500: "#ff63cd",
    textOnPrimary: "light",
  },

  // ✅ Ocean = più chiaro => testo scuro
  OCEAN: {
    key: "OCEAN",
    label: "Oceano",
    primary800: "#08243d",
    primary700: "#0b3251",
    primary500: "#135180",
    accent500: "#26c4ff",
    textOnPrimary: "light",
  },

  // Extra chiaro neutro (testo scuro)
  LIGHT: {
    key: "LIGHT",
    label: "Chiaro",
    primary800: "#f5f5f7",
    primary700: "#ffffff",
    primary500: "#f0f0f2",
    accent500: "#5b7cfa",
    textOnPrimary: "dark",
  },

  FOREST: {
    key: "FOREST",
    label: "Foresta",
    primary800: "#102717",
    primary700: "#163722",
    primary500: "#1f5b35",
    accent500: "#8bd450",
    textOnPrimary: "light",
  },

  SUNSET: {
    key: "SUNSET",
    label: "Tramonto",
    primary800: "#2b1215",
    primary700: "#3d181e",
    primary500: "#6a2831",
    accent500: "#ff9f43",
    textOnPrimary: "light",
  },

  SLATE: {
    key: "SLATE",
    label: "Ardesia",
    primary800: "#101726",
    primary700: "#172035",
    primary500: "#253453",
    accent500: "#7dd3fc",
    textOnPrimary: "light",
  },

  MIDNIGHT_TEAL: {
    key: "MIDNIGHT_TEAL",
    label: "Notte Petrolio",
    primary800: "#0b171a",
    primary700: "#122327",
    primary500: "#1c3940",
    accent500: "#57c9b5",
    textOnPrimary: "light",
  },

  GRAPHITE_LIME: {
    key: "GRAPHITE_LIME",
    label: "Grafite Lime",
    primary800: "#121418",
    primary700: "#1b2026",
    primary500: "#2a313a",
    accent500: "#b7f542",
    textOnPrimary: "light",
  },

  BORDEAUX: {
    key: "BORDEAUX",
    label: "Bordeaux",
    primary800: "#240d12",
    primary700: "#351219",
    primary500: "#58202a",
    accent500: "#ff7aa2",
    textOnPrimary: "light",
  },

  NIGHT_COPPER: {
    key: "NIGHT_COPPER",
    label: "Notte Rame",
    primary800: "#1a1512",
    primary700: "#27201b",
    primary500: "#3e342c",
    accent500: "#f0a35a",
    textOnPrimary: "light",
  },

  AURORA: {
    key: "AURORA",
    label: "Aurora",
    primary800: "#101c2a",
    primary700: "#16283d",
    primary500: "#214666",
    accent500: "#6fe7dd",
    textOnPrimary: "light",
  },

  CHERRY_NIGHT: {
    key: "CHERRY_NIGHT",
    label: "Cherry Night",
    primary800: "#1d0f17",
    primary700: "#2a1621",
    primary500: "#47273a",
    accent500: "#ff6b93",
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
