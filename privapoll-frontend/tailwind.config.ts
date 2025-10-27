import type { Config } from "tailwindcss";
import { designTokens } from "./design-tokens";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: designTokens.colors.light.primary,
          hover: designTokens.colors.light.primaryHover,
        },
        secondary: {
          DEFAULT: designTokens.colors.light.secondary,
        },
        accent: {
          DEFAULT: designTokens.colors.light.accent,
        },
        success: designTokens.colors.light.success,
        warning: designTokens.colors.light.warning,
        error: designTokens.colors.light.error,
        info: designTokens.colors.light.info,
      },
      fontFamily: {
        sans: designTokens.typography.fontFamily.sans,
        mono: designTokens.typography.fontFamily.mono,
      },
      fontSize: designTokens.typography.sizes,
      borderRadius: designTokens.borderRadius,
      boxShadow: {
        ...designTokens.shadows,
      },
      spacing: {
        xs: designTokens.spacing.xs,
        sm: designTokens.spacing.sm,
        md: designTokens.spacing.md,
        lg: designTokens.spacing.lg,
        xl: designTokens.spacing.xl,
        "2xl": designTokens.spacing["2xl"],
        "3xl": designTokens.spacing["3xl"],
      },
      transitionDuration: {
        DEFAULT: designTokens.transitions.duration.base,
        fast: designTokens.transitions.duration.fast,
        slow: designTokens.transitions.duration.slow,
      },
      transitionTimingFunction: {
        DEFAULT: designTokens.transitions.easing.default,
      },
      backdropBlur: {
        glass: designTokens.glassmorphism.blur.md,
      },
      zIndex: {
        base: `${designTokens.zIndex.base}`,
        dropdown: `${designTokens.zIndex.dropdown}`,
        sticky: `${designTokens.zIndex.sticky}`,
        fixed: `${designTokens.zIndex.fixed}`,
        modalBackdrop: `${designTokens.zIndex.modalBackdrop}`,
        modal: `${designTokens.zIndex.modal}`,
        popover: `${designTokens.zIndex.popover}`,
        tooltip: `${designTokens.zIndex.tooltip}`,
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

