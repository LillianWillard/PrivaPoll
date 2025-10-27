import { createHash } from "crypto";

/**
 * PrivaPoll Design System
 * 
 * Based on deterministic seed generation to ensure unique visual identity
 * Seed: sha256("PrivaPollsepolia202510PrivaPoll.sol")
 */

// Calculate deterministic seed
const projectName = "PrivaPoll";
const network = "sepolia";
const yearMonth = "202510";
const contractName = "PrivaPoll.sol";
const seedString = `${projectName}${network}${yearMonth}${contractName}`;
const seed = createHash("sha256").update(seedString).digest("hex");

// Extract design choices from seed
const seedNum = parseInt(seed.substring(0, 8), 16);
const designSystemIndex = seedNum % 5;
const colorSchemeIndex = parseInt(seed.substring(2, 4), 16) % 8;
const typographyIndex = parseInt(seed.substring(4, 6), 16) % 3;
const layoutIndex = parseInt(seed.substring(6, 8), 16) % 5;
const borderRadiusIndex = parseInt(seed.substring(8, 10), 16) % 5;
const transitionIndex = parseInt(seed.substring(10, 12), 16) % 3;

// Design System: Glassmorphism (毛玻璃效果)
const designSystem = "Glassmorphism";

// Color Scheme: E组 (Purple/Deep Purple/Indigo) - 奢华/神秘/隐私
const colors = {
  light: {
    primary: "#A855F7",
    primaryHover: "#9333EA",
    secondary: "#7C3AED",
    accent: "#6366F1",
    background: "#FFFFFF",
    surface: "#F9FAFB",
    surfaceGlass: "rgba(255, 255, 255, 0.7)",
    text: "#111827",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",
    border: "#E5E7EB",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },
  dark: {
    primary: "#C084FC",
    primaryHover: "#A855F7",
    secondary: "#A78BFA",
    accent: "#818CF8",
    background: "#0F172A",
    surface: "#1E293B",
    surfaceGlass: "rgba(30, 41, 59, 0.7)",
    text: "#F8FAFC",
    textSecondary: "#CBD5E1",
    textMuted: "#64748B",
    border: "#334155",
    success: "#34D399",
    warning: "#FBBF24",
    error: "#F87171",
    info: "#60A5FA",
  },
};

// Typography: Sans-Serif (Inter) - 1.25 倍率
const typography = {
  fontFamily: {
    sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
    mono: ["JetBrains Mono", "Consolas", "monospace"],
  },
  scale: 1.25,
  sizes: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.25rem", // 20px
    xl: "1.563rem", // 25px
    "2xl": "1.953rem", // 31px
    "3xl": "2.441rem", // 39px
    "4xl": "3.052rem", // 49px
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Layout: Sidebar（桌面端左侧边栏）
const layout = {
  mode: "sidebar" as const,
  sidebar: {
    width: "280px",
    collapsedWidth: "64px",
  },
  container: {
    maxWidth: "1280px",
    padding: "2rem",
  },
  breakpoints: {
    mobile: "0px",
    tablet: "768px",
    desktop: "1024px",
    wide: "1280px",
  },
};

// Spacing: 基于 8px 单位
const spacing = {
  unit: 8,
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "3rem", // 48px
  "3xl": "4rem", // 64px
};

// Border Radius: 大圆角 (12px)
const borderRadius = {
  none: "0",
  sm: "0.25rem", // 4px
  md: "0.5rem", // 8px
  lg: "0.75rem", // 12px
  xl: "1rem", // 16px
  "2xl": "1.5rem", // 24px
  full: "9999px",
};

// Shadows: 中等阴影 + Glassmorphism 效果
const shadows = {
  none: "none",
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px rgba(0, 0, 0, 0.15)",
  xl: "0 20px 25px rgba(0, 0, 0, 0.2)",
  glass: "0 8px 32px rgba(0, 0, 0, 0.1)",
  inner: "inset 0 2px 4px rgba(0, 0, 0, 0.06)",
};

// Transitions: 标准 (200ms)
const transitions = {
  duration: {
    fast: "100ms",
    base: "200ms",
    slow: "300ms",
  },
  easing: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
};

// Glassmorphism Effects
const glassmorphism = {
  blur: {
    sm: "blur(8px)",
    md: "blur(12px)",
    lg: "blur(16px)",
  },
  background: {
    light: "rgba(255, 255, 255, 0.7)",
    dark: "rgba(30, 41, 59, 0.7)",
  },
  border: {
    light: "1px solid rgba(255, 255, 255, 0.18)",
    dark: "1px solid rgba(255, 255, 255, 0.1)",
  },
};

// Density Variants
const density = {
  compact: {
    padding: {
      sm: "0.25rem 0.5rem", // 4px 8px
      md: "0.5rem 1rem", // 8px 16px
      lg: "0.75rem 1.5rem", // 12px 24px
    },
    gap: "0.5rem", // 8px
  },
  comfortable: {
    padding: {
      sm: "0.5rem 1rem", // 8px 16px
      md: "1rem 1.5rem", // 16px 24px
      lg: "1.25rem 2rem", // 20px 32px
    },
    gap: "1rem", // 16px
  },
};

// Z-Index Scale
const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

export const designTokens = {
  seed,
  designSystem,
  colors,
  typography,
  layout,
  spacing,
  borderRadius,
  shadows,
  transitions,
  glassmorphism,
  density,
  zIndex,
  
  // Branding
  branding: {
    name: "PrivaPoll",
    slogan: "Your Voice, Encrypted",
    description: "Privacy-Preserving Polling Platform powered by FHEVM",
  },
} as const;

export type DesignTokens = typeof designTokens;

