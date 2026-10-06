// Design tokens — TS mirror of app/globals.css @theme (PRD §18).
// Single source of truth for programmatic use; CSS remains authoritative for styling.

export const brandColors = {
  navy: "#0B1F3A",
  teal: "#0F766E",
  coral: "#F97360",
} as const;

export const colorScale = {
  navy: {
    50: "#F0F4FA",
    100: "#DCE5F2",
    800: "#1B3D68",
    900: "#132E52",
    950: "#0B1F3A",
  },
  teal: {
    50: "#F0FDFA",
    100: "#CCFBF1",
    600: "#0D9488",
    700: "#0F766E",
    800: "#115E59",
  },
  coral: {
    50: "#FFF5F3",
    100: "#FFE4DE",
    500: "#F97360",
    600: "#E85A46",
    700: "#C94A38",
  },
} as const;

export const semanticColors = {
  success: "#0F766E",
  warning: "#B45309",
  error: "#B91C1c",
  info: "#1B3D68",
} as const;

export const fontFamilies = {
  sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
  serif: '"Source Serif 4", ui-serif, Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
} as const;

export const fontWeights = [400, 500, 600, 700] as const;

/** px values from PRD §18 */
export const typeScale = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48] as const;

/** 4px base system from PRD §18 */
export const spacingScale = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96] as const;

export const radii = { sm: 6, md: 8, lg: 12, xl: 16, pill: 9999 } as const;

export const breakpoints = [640, 768, 1024, 1280, 1536] as const;
