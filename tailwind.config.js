// tailwind.config.js - Single source of truth for colors
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./templates/**/*.html", "./static/**/*.{js,css,html}"],
  darkMode: "class",
  theme: {
    extend: {
      // Fluid Typography System
      fontSize: {
        xs: [
          "clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)",
          { lineHeight: "1.4" },
        ],
        sm: ["clamp(0.875rem, 0.8rem + 0.375vw, 1rem)", { lineHeight: "1.5" }],
        base: [
          "clamp(1rem, 0.925rem + 0.375vw, 1.125rem)",
          { lineHeight: "1.6" },
        ],
        lg: [
          "clamp(1.125rem, 1.025rem + 0.5vw, 1.25rem)",
          { lineHeight: "1.6" },
        ],
        xl: [
          "clamp(1.25rem, 1.125rem + 0.625vw, 1.5rem)",
          { lineHeight: "1.5" },
        ],
        "2xl": [
          "clamp(1.5rem, 1.325rem + 0.875vw, 1.875rem)",
          { lineHeight: "1.4" },
        ],
        "3xl": [
          "clamp(1.875rem, 1.625rem + 1.25vw, 2.25rem)",
          { lineHeight: "1.3" },
        ],
        "4xl": [
          "clamp(2.25rem, 1.875rem + 1.875vw, 3rem)",
          { lineHeight: "1.2" },
        ],
        "5xl": ["clamp(3rem, 2.5rem + 2.5vw, 4rem)", { lineHeight: "1.1" }],
        "6xl": ["clamp(3.75rem, 3rem + 3.75vw, 5rem)", { lineHeight: "1.1" }],
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        cursive: ["Dancing Script", "cursive"],
      },

      colors: {
        // SINGLE SOURCE OF TRUTH - Enhanced semantic color system
        surface: {
          // Light mode surfaces
          primary: "rgb(255 255 255)", // Pure white for main surfaces
          secondary: "rgb(249 250 251)", // Slight gray for secondary surfaces
          tertiary: "rgb(243 244 246)", // Lighter gray for tertiary elements

          // Dark mode surfaces
          "dark-primary": "rgb(23 23 23)", // Near black for main surfaces
          "dark-secondary": "rgb(38 38 38)", // Dark gray for secondary surfaces
          "dark-tertiary": "rgb(55 65 81)", // Medium gray for tertiary elements
        },

        text: {
          // Light mode text
          primary: "rgb(17 24 39)", // Almost black for primary text
          secondary: "rgb(75 85 99)", // Gray for secondary text
          tertiary: "rgb(156 163 175)", // Light gray for tertiary text

          // Dark mode text
          "dark-primary": "rgb(249 250 251)", // Almost white for primary text
          "dark-secondary": "rgb(209 213 219)", // Light gray for secondary text
          "dark-tertiary": "rgb(156 163 175)", // Medium gray for tertiary text
        },

        border: {
          light: "rgb(229 231 235)", // Light mode borders
          dark: "rgb(55 65 81)", // Dark mode borders
        },

        // DB-Genie brand colors
        brand: {
          purple: {
            50: "#faf5ff",
            100: "#f3e8ff",
            200: "#e9d5ff",
            300: "#d8b4fe",
            400: "#c084fc",
            500: "#a855f7", // Primary purple
            600: "#9333ea",
            700: "#7c3aed",
            800: "#6b21a8",
            900: "#581c87",
          },
          yellow: {
            50: "#fefce8",
            100: "#fef9c3",
            200: "#fef08a",
            300: "#fde047", // Accent yellow
            400: "#facc15",
            500: "#eab308",
            600: "#ca8a04",
            700: "#a16207",
            800: "#854d0e",
            900: "#713f12",
          },
        },
      },

      // Enhanced shadows for depth and glassmorphism
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
        "glass-strong": "0 12px 48px 0 rgba(0, 0, 0, 0.15)",
        "glow-brand": "0 0 20px rgba(168, 85, 247, 0.3)",
        "glow-brand-strong": "0 0 40px rgba(168, 85, 247, 0.5)",
        "depth-1":
          "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
        "depth-2":
          "0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.06)",
        "depth-3":
          "0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)",
      },

      // Animation system
      keyframes: {
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(168, 85, 247, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(168, 85, 247, 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "border-run": {
          "0%, 100%": {
            backgroundPosition: "0% 50%",
          },
          "50%": {
            backgroundPosition: "100% 50%",
          },
        },
      },

      animation: {
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
        "fade-in-up": "fade-in-up 0.4s ease-out forwards",
        "bounce-subtle": "bounce-subtle 0.3s ease-out",
        "gradient-shift": "gradient-shift 3s ease infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "float-delayed": "float 3s ease-in-out 1.5s infinite",
        "border-run": "border-run 1.5s linear infinite",
      },

      spacing: {
        18: "4.5rem",
        88: "22rem",
      },

      width: {
        sidebar: "16rem",
      },

      maxWidth: {
        chat: "60%",
        modal: "32rem",
      },
    },
  },

  plugins: [
    require("@tailwindcss/typography"),
    function ({ addUtilities, theme }) {
      const newUtilities = {
        // THEME-AWARE COMPONENT CLASSES (Main utility classes)
        ".app-surface": {
          backgroundColor: theme("colors.surface.primary"),
          color: theme("colors.text.primary"),
        },
        ".dark .app-surface": {
          backgroundColor: theme("colors.surface.dark-primary"),
          color: theme("colors.text.dark-primary"),
        },

        ".app-surface-secondary": {
          backgroundColor: theme("colors.surface.secondary"),
          borderColor: theme("colors.border.light"),
        },
        ".dark .app-surface-secondary": {
          backgroundColor: theme("colors.surface.dark-secondary"),
          borderColor: theme("colors.border.dark"),
        },

        ".app-text": {
          color: theme("colors.text.primary"),
        },
        ".dark .app-text": {
          color: theme("colors.text.dark-primary"),
        },

        ".app-text-secondary": {
          color: theme("colors.text.secondary"),
        },
        ".dark .app-text-secondary": {
          color: theme("colors.text.dark-secondary"),
        },

        ".app-border": {
          borderColor: theme("colors.border.light"),
        },
        ".dark .app-border": {
          borderColor: theme("colors.border.dark"),
        },

        // INTERACTIVE ELEMENTS
        ".app-button": {
          backgroundColor: theme("colors.surface.secondary"),
          color: theme("colors.text.primary"),
          borderColor: theme("colors.border.light"),
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: theme("colors.surface.tertiary"),
            transform: "translateY(-1px)",
            boxShadow: theme("boxShadow.depth-2"),
          },
        },
        ".dark .app-button": {
          backgroundColor: theme("colors.surface.dark-secondary"),
          color: theme("colors.text.dark-primary"),
          borderColor: theme("colors.border.dark"),
          "&:hover": {
            backgroundColor: theme("colors.surface.dark-tertiary"),
          },
        },

        ".app-input": {
          backgroundColor: theme("colors.surface.primary"),
          color: theme("colors.text.primary"),
          borderColor: theme("colors.border.light"),
          "&:focus": {
            borderColor: theme("colors.brand.purple.500"),
            boxShadow: `0 0 0 3px ${theme("colors.brand.purple.500")}30`,
            outline: "none",
          },
        },
        ".dark .app-input": {
          backgroundColor: theme("colors.surface.dark-secondary"),
          color: theme("colors.text.dark-primary"),
          borderColor: theme("colors.border.dark"),
          "&:focus": {
            borderColor: theme("colors.brand.purple.400"),
            boxShadow: `0 0 0 3px ${theme("colors.brand.purple.400")}30`,
          },
        },

        // GLASS EFFECT
        ".glass-effect": {
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(16px) saturate(120%)",
          WebkitBackdropFilter: "blur(16px) saturate(120%)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        },
        ".dark .glass-effect": {
          background: "rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },

        // GRADIENT TEXT
        ".gradient-text": {
          background: `linear-gradient(135deg, ${theme(
            "colors.brand.purple.500"
          )}, ${theme("colors.brand.yellow.300")}, #06b6d4)`,
          backgroundSize: "200% 200%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "gradient-shift 3s ease infinite",
        },

        // SCROLLBAR STYLING
        ".app-scrollbar": {
          "&::-webkit-scrollbar": { width: "6px", height: "6px" },
          "&::-webkit-scrollbar-track": {
            background: theme("colors.surface.secondary"),
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: theme("colors.text.tertiary"),
            borderRadius: "3px",
            "&:hover": {
              background: theme("colors.text.secondary"),
            },
          },
        },
        ".dark .app-scrollbar": {
          "&::-webkit-scrollbar-track": {
            background: theme("colors.surface.dark-secondary"),
          },
          "&::-webkit-scrollbar-thumb": {
            background: theme("colors.text.dark-tertiary"),
            "&:hover": {
              background: theme("colors.text.dark-secondary"),
            },
          },
        },

        // TRANSITIONS
        ".app-transition": {
          transition: "all 0.2s ease-in-out",
        },
        ".app-transition-slow": {
          transition: "all 0.3s ease-in-out",
        },

        // NOTIFICATION ANIMATIONS
        ".notification-enter": {
          transform: "translateX(100%)",
          opacity: "0",
        },
        ".notification-enter-active": {
          transform: "translateX(0)",
          opacity: "1",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        },
        ".notification-exit": {
          transform: "translateX(0)",
          opacity: "1",
        },
        ".notification-exit-active": {
          transform: "translateX(100%)",
          opacity: "0",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.6, 1)",
        },
      };
      addUtilities(newUtilities);
    },
  ],

  safelist: [
    // Core app utilities
    "app-surface",
    "app-surface-secondary",
    "app-text",
    "app-text-secondary",
    "app-border",
    "app-button",
    "app-input",
    "app-scrollbar",
    "app-transition",
    "app-transition-slow",

    // Message components
    "message",
    "message--user",
    "message--ai",
    "message--visible",
    "message-avatar",
    "message__content",

    // Code block components
    "code-block",
    "code-block--sql",
    "code-block--mermaid",
    "code-block--json",
    "code-block--python",
    "code-block--javascript",
    "code-block__buttons",
    "code-block__button",
    "code-block__button--copy",
    "code-block__button--run",
    "code-block__button--copied",
    "code-block__button--loading",
    "code-block__icon",
    "code-block__spinner",

    // Table components
    "table-wrapper",

    // Mermaid components
    "mermaid-diagram",
    "mermaid-diagram--success",
    "mermaid-diagram--error",
    "mermaid-diagram__svg",

    // Modern typewriter animations
    "typing-animation",
    "word-reveal",
    "ai-thinking-modern",
    "thinking-particle",

    // Sidebar components
    "conversation-item",

    // Effects and animations
    "glass-effect",
    "gradient-text",
    "button-loading",
    "animate-slide-in-right",
    "animate-fade-in-up",
    "animate-bounce-subtle",
    "animate-gradient-shift",
    "animate-pulse-glow",
    "animate-float",
    "animate-float-delayed",
    "animate-border-run",

    // Notifications
    "notification-enter",
    "notification-enter-active",
    "notification-exit",
    "notification-exit-active",

    // Shadows
    "shadow-glass",
    "shadow-glass-strong",
    "shadow-glow-brand",
    "shadow-glow-brand-strong",
    "shadow-depth-1",
    "shadow-depth-2",
    "shadow-depth-3",

    // Brand colors
    "text-brand-purple-400",
    "text-brand-purple-500",
    "text-brand-purple-600",
    "text-brand-yellow-300",

    // Utility classes that might be added dynamically
    "group",
    "group-hover:opacity-100",
    "focus-visible",
    "sr-only",
  ],
};
