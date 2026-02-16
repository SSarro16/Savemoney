// constants/styles.js
// 🔥 Tema dinamico (stessi token: colors.primary700, colors.white06, ecc.)
// - Non devi cambiare i nomi dei token in giro per l'app.
// - Il ThemeContext aggiorna GlobalStyles.colors "in place" e forza re-render.

export const THEMES = {
  DARK: {
    key: "DARK",
    label: "Dark",
    primary800: "#1f2330",
    primary700: "#2b3142",
    primary500: "#3b4760",
    accent500: "#8fb3ff",
    textOnPrimary: "light",
  },

  OBSIDIAN: {
    key: "OBSIDIAN",
    label: "Nero",
    primary800: "#191b22",
    primary700: "#232733",
    primary500: "#343b4d",
    accent500: "#b7bfd8",
    textOnPrimary: "light",
  },

  BLUE: {
    key: "BLUE",
    label: "Blue",
    primary800: "#e8f0fb",
    primary700: "#f4f8ff",
    primary500: "#d9e6fa",
    accent500: "#5f83c8",
    textOnPrimary: "dark",
  },

  GREEN: {
    key: "GREEN",
    label: "Green",
    primary800: "#e7f3ec",
    primary700: "#f2faf5",
    primary500: "#d4e8db",
    accent500: "#4f8b6f",
    textOnPrimary: "dark",
  },

  RED: {
    key: "RED",
    label: "Red",
    primary800: "#f7e9ee",
    primary700: "#fdf4f7",
    primary500: "#f3d8e2",
    accent500: "#b96a82",
    textOnPrimary: "dark",
  },

  YELLOW: {
    key: "YELLOW",
    label: "Yellow",
    primary800: "#f9f2de",
    primary700: "#fff9ec",
    primary500: "#f2e3bc",
    accent500: "#9d7a2d",
    textOnPrimary: "dark",
  },

  MINT: {
    key: "MINT",
    label: "Menta",
    primary800: "#e6f5f1",
    primary700: "#f2fbf8",
    primary500: "#d2ebe3",
    accent500: "#4f9588",
    textOnPrimary: "dark",
  },

  SAND: {
    key: "SAND",
    label: "Sabbia",
    primary800: "#f5ecdf",
    primary700: "#fdf6eb",
    primary500: "#ead9c4",
    accent500: "#9f7a50",
    textOnPrimary: "dark",
  },

  PURPLE_GOLD: {
    key: "PURPLE_GOLD",
    label: "Viola",
    primary800: "#ece9f8",
    primary700: "#f6f4fd",
    primary500: "#ddd6f3",
    accent500: "#8b79c8",
    textOnPrimary: "dark",
  },

  ROSE: {
    key: "ROSE",
    label: "Rosa",
    primary800: "#f7eaf2",
    primary700: "#fdf4f8",
    primary500: "#f1d7e6",
    accent500: "#ba6f98",
    textOnPrimary: "dark",
  },

  OCEAN: {
    key: "OCEAN",
    label: "Oceano",
    primary800: "#e7f2f7",
    primary700: "#f3f9fc",
    primary500: "#d7e9f1",
    accent500: "#4f8ea8",
    textOnPrimary: "dark",
  },

  LIGHT: {
    key: "LIGHT",
    label: "Chiaro",
    primary800: "#f2f4f8",
    primary700: "#ffffff",
    primary500: "#e4e9f1",
    accent500: "#6280c9",
    textOnPrimary: "dark",
  },

  FOREST: {
    key: "FOREST",
    label: "Foresta",
    primary800: "#e4efe7",
    primary700: "#f0f7f3",
    primary500: "#d2e4d7",
    accent500: "#5e8b70",
    textOnPrimary: "dark",
  },

  SUNSET: {
    key: "SUNSET",
    label: "Tramonto",
    primary800: "#f7ede8",
    primary700: "#fdf6f1",
    primary500: "#efdcd0",
    accent500: "#bf8460",
    textOnPrimary: "dark",
  },

  SLATE: {
    key: "SLATE",
    label: "Ardesia",
    primary800: "#e8ecf2",
    primary700: "#f3f6fb",
    primary500: "#d7deea",
    accent500: "#647caa",
    textOnPrimary: "dark",
  },

  MIDNIGHT_TEAL: {
    key: "MIDNIGHT_TEAL",
    label: "Notte Petrolio",
    primary800: "#1b2c2f",
    primary700: "#24393d",
    primary500: "#305158",
    accent500: "#88c7bf",
    textOnPrimary: "light",
  },

  GRAPHITE_LIME: {
    key: "GRAPHITE_LIME",
    label: "Grafite Lime",
    primary800: "#22252b",
    primary700: "#2d323a",
    primary500: "#3c4652",
    accent500: "#b4d17e",
    textOnPrimary: "light",
  },

  BORDEAUX: {
    key: "BORDEAUX",
    label: "Bordeaux",
    primary800: "#2a1c22",
    primary700: "#37252d",
    primary500: "#503542",
    accent500: "#d29ab2",
    textOnPrimary: "light",
  },

  NIGHT_COPPER: {
    key: "NIGHT_COPPER",
    label: "Notte Rame",
    primary800: "#2b231f",
    primary700: "#3a2f29",
    primary500: "#56463d",
    accent500: "#d6b08a",
    textOnPrimary: "light",
  },

  AURORA: {
    key: "AURORA",
    label: "Aurora",
    primary800: "#1f2435",
    primary700: "#2b3249",
    primary500: "#3d4a69",
    accent500: "#9dd6c1",
    textOnPrimary: "light",
  },

  CHERRY_NIGHT: {
    key: "CHERRY_NIGHT",
    label: "Cherry Night",
    primary800: "#2b1f2b",
    primary700: "#3a2a3a",
    primary500: "#544055",
    accent500: "#dca0c5",
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
  const danger = "#c6547d";

  // “whiteXX” tokens: su temi chiari diventano “blackXX”
  const shade = (alpha) =>
    isDarkText ? rgba(black, alpha) : rgba(white, alpha);

  // testo su accent pieno (es. bottone primario)
  const textOnAccentStrong = "#0f172a";

  return {
    // ✅ original tokens (compat)
    primary50: "#eef2ff",
    primary100: "#dce6ff",
    primary200: "#bfd1f4",
    primary400: "#6f89c6",
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

