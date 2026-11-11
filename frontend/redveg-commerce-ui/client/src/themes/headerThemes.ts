// ──────────────────────────────────────────────────────────────────────────────
// Header Theme Registry — Single source of truth for all festival/occasion
// header themes. Theme IDs are stable strings used in persistence and CSS.
// ──────────────────────────────────────────────────────────────────────────────

/** Stable theme identifiers used for persistence and CSS data attributes. */
export type HeaderThemeId =
  | "default"
  | "diwali"
  | "durga-puja"
  | "holi"
  | "eid"
  | "christmas"
  | "onam"
  | "pongal"
  | "independence-day";

/** Colour tokens that define a header theme's visual identity. */
export interface HeaderThemePalette {
  /** Top announcement bar background */
  topBarBg: string;
  /** Top announcement bar text */
  topBarFg: string;
  /** Main header background (applied with /95 opacity for blur) */
  headerBg: string;
  /** Primary text colour on the header */
  headerFg: string;
  /** Primary accent colour (cart button, hover highlights, etc.) */
  accent: string;
  /** Secondary accent for decorative details */
  accentSecondary: string;
  /** Search input background */
  searchBg: string;
  /** Location pin icon background */
  locationPinBg: string;
  /** Location pin icon colour */
  locationPinFg: string;
  /** Border colour used in header separators */
  borderColor: string;
  /** Category nav link text */
  navText: string;
  /** Category nav link hover background */
  navHoverBg: string;
  /** Category nav link hover text */
  navHoverText: string;
  /** Cart badge background */
  cartBadgeBg: string;
}

/** Full theme definition including metadata and palette. */
export interface HeaderTheme {
  id: HeaderThemeId;
  name: string;
  description: string;
  emoji: string;
  palette: HeaderThemePalette;
}

// ─── Theme Definitions ──────────────────────────────────────────────────────

const DEFAULT_PALETTE: HeaderThemePalette = {
  topBarBg: "#17110f",
  topBarFg: "#ffffff",
  headerBg: "#fffdf9",
  headerFg: "#251b18",
  accent: "#B4232C",
  accentSecondary: "#B4232C",
  searchBg: "#F4EFEA",
  locationPinBg: "#E9F5E8",
  locationPinFg: "#207346",
  borderColor: "rgba(0,0,0,0.05)",
  navText: "#4D403D",
  navHoverBg: "#F9E8E8",
  navHoverText: "#B4232C",
  cartBadgeBg: "#2A7B48",
};

export const HEADER_THEMES: Record<HeaderThemeId, HeaderTheme> = {
  default: {
    id: "default",
    name: "Default RedVeg",
    description: "Warm cream background with signature RedVeg red accents.",
    emoji: "🏠",
    palette: { ...DEFAULT_PALETTE },
  },

  diwali: {
    id: "diwali",
    name: "Diwali",
    description: "Warm ivory with marigold-gold accents and deep red details.",
    emoji: "🪔",
    palette: {
      ...DEFAULT_PALETTE,
      topBarBg: "#2D1810",
      headerBg: "#FFFBF0",
      accent: "#C8860A",
      accentSecondary: "#B4232C",
      searchBg: "#FFF5E1",
      locationPinBg: "#FFF0CC",
      locationPinFg: "#9B6F00",
      borderColor: "rgba(200,134,10,0.15)",
      navHoverBg: "#FFF0CC",
      navHoverText: "#9B6F00",
      cartBadgeBg: "#B4232C",
    },
  },

  "durga-puja": {
    id: "durga-puja",
    name: "Durga Puja",
    description: "Soft ivory with deep red and muted gold accents.",
    emoji: "🔱",
    palette: {
      ...DEFAULT_PALETTE,
      topBarBg: "#3D0D0D",
      headerBg: "#FFFAF5",
      accent: "#9B1B1B",
      accentSecondary: "#C8A84E",
      searchBg: "#FFF0EA",
      locationPinBg: "#FFE8E0",
      locationPinFg: "#9B1B1B",
      borderColor: "rgba(155,27,27,0.12)",
      navHoverBg: "#FFE8E0",
      navHoverText: "#9B1B1B",
      cartBadgeBg: "#C8A84E",
    },
  },

  holi: {
    id: "holi",
    name: "Holi",
    description: "Clean white with deep pink, indigo, and saffron accents.",
    emoji: "🎨",
    palette: {
      ...DEFAULT_PALETTE,
      topBarBg: "#1A0A2E",
      topBarFg: "#F0E6FF",
      headerBg: "#FFFFFF",
      accent: "#C2185B",
      accentSecondary: "#283593",
      searchBg: "#FFF0F5",
      locationPinBg: "#EDE7F6",
      locationPinFg: "#4A148C",
      borderColor: "rgba(194,24,91,0.1)",
      navHoverBg: "#FCE4EC",
      navHoverText: "#C2185B",
      cartBadgeBg: "#283593",
    },
  },

  eid: {
    id: "eid",
    name: "Eid",
    description: "Pale green with emerald and muted gold accents.",
    emoji: "🌙",
    palette: {
      ...DEFAULT_PALETTE,
      topBarBg: "#0D2818",
      headerBg: "#F5FFF8",
      accent: "#1B7A4A",
      accentSecondary: "#C8A84E",
      searchBg: "#E8F5E9",
      locationPinBg: "#E0F2E8",
      locationPinFg: "#1B5E38",
      borderColor: "rgba(27,122,74,0.12)",
      navHoverBg: "#E0F2E8",
      navHoverText: "#1B5E38",
      cartBadgeBg: "#C8A84E",
    },
  },

  christmas: {
    id: "christmas",
    name: "Christmas",
    description: "Soft white with forest green, burgundy, and subtle gold.",
    emoji: "🎄",
    palette: {
      ...DEFAULT_PALETTE,
      topBarBg: "#1B2F1B",
      headerBg: "#FEFFFE",
      accent: "#2E7D32",
      accentSecondary: "#8B1A2B",
      searchBg: "#F1F8F1",
      locationPinBg: "#E8F5E9",
      locationPinFg: "#2E7D32",
      borderColor: "rgba(46,125,50,0.12)",
      navHoverBg: "#FFEBEE",
      navHoverText: "#8B1A2B",
      cartBadgeBg: "#8B1A2B",
    },
  },

  onam: {
    id: "onam",
    name: "Onam",
    description: "Warm ivory with leaf green and muted gold accents.",
    emoji: "🌺",
    palette: {
      ...DEFAULT_PALETTE,
      topBarBg: "#1A2E10",
      headerBg: "#FEFFF5",
      accent: "#4A7C2E",
      accentSecondary: "#C8A84E",
      searchBg: "#F2F8E8",
      locationPinBg: "#E8F0D8",
      locationPinFg: "#3D6B1E",
      borderColor: "rgba(74,124,46,0.12)",
      navHoverBg: "#E8F0D8",
      navHoverText: "#3D6B1E",
      cartBadgeBg: "#C8A84E",
    },
  },

  pongal: {
    id: "pongal",
    name: "Pongal / Makar Sankranti",
    description: "Cream with terracotta, green, and saffron accents.",
    emoji: "☀️",
    palette: {
      ...DEFAULT_PALETTE,
      topBarBg: "#2E1A0D",
      headerBg: "#FFFCF5",
      accent: "#C75B39",
      accentSecondary: "#2E7D32",
      searchBg: "#FFF3E8",
      locationPinBg: "#FFE8D8",
      locationPinFg: "#A04828",
      borderColor: "rgba(199,91,57,0.12)",
      navHoverBg: "#FFE8D8",
      navHoverText: "#A04828",
      cartBadgeBg: "#2E7D32",
    },
  },

  "independence-day": {
    id: "independence-day",
    name: "Independence Day",
    description: "Neutral white with saffron, green, and navy accents.",
    emoji: "🇮🇳",
    palette: {
      ...DEFAULT_PALETTE,
      topBarBg: "#0A1628",
      headerBg: "#FFFFFF",
      accent: "#E65100",
      accentSecondary: "#1B5E20",
      searchBg: "#FFF3E0",
      locationPinBg: "#E8F5E9",
      locationPinFg: "#1B5E20",
      borderColor: "rgba(0,0,0,0.08)",
      navHoverBg: "#FFF3E0",
      navHoverText: "#E65100",
      cartBadgeBg: "#1B5E20",
    },
  },
};

/** Ordered list of all themes for iteration. */
export const HEADER_THEME_LIST: HeaderTheme[] = Object.values(HEADER_THEMES);

/** Get a theme by ID, falling back to default. */
export function getThemeById(id: HeaderThemeId | string): HeaderTheme {
  return HEADER_THEMES[id as HeaderThemeId] ?? HEADER_THEMES.default;
}

/** All valid theme IDs. */
export const HEADER_THEME_IDS: HeaderThemeId[] = Object.keys(HEADER_THEMES) as HeaderThemeId[];