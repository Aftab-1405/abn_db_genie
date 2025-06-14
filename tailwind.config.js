// Enhanced tailwind.config.js with centralized component classes
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./templates/**/*.html",
    "./static/**/*.{js,css,html}",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        cursive: ["Dancing Script", "cursive"],
      },
      colors: {
        neutral: {
          25: "#fafafa",
          700: "#2d2d2d",
          850: "#1f1f1f",
        },
        // Add semantic color names for consistent theming
        surface: {
          primary: "rgb(250 250 250)", // light mode primary surface
          secondary: "rgb(245 245 245)", // light mode secondary surface
          dark: {
            primary: "rgb(23 23 23)", // dark mode primary surface
            secondary: "rgb(38 38 38)", // dark mode secondary surface
          },
        },
        text: {
          primary: "rgb(0 0 0)", // light mode primary text
          secondary: "rgb(115 115 115)", // light mode secondary text
          dark: {
            primary: "rgb(255 255 255)", // dark mode primary text
            secondary: "rgb(163 163 163)", // dark mode secondary text
          },
        },
      },
      boxShadow: {
        glow: "0 0 20px rgba(255, 255, 255, 0.5)",
        "glow-dark": "0 0 20px rgba(59, 130, 246, 0.3)",
      },
      textShadow: {
        glow: "0 0 10px rgba(255, 255, 255, 0.5)",
      },
      keyframes: {
        rotate: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "slow-rotate": "rotate 10s linear infinite",
        slideInRight: "slideInRight 0.3s ease-out",
        fadeIn: "fadeIn 0.3s ease-out",
        slideDown: "slideDown 0.3s ease-out",
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
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: "100%",
            color: theme("colors.gray.700"),
            "> *": {
              marginTop: "0",
              marginBottom: "0",
            },
            p: {
              margin: "0.75rem 0",
            },
            "h1,h2,h3,h4,h5,h6": {
              color: theme("colors.gray.900"),
              fontWeight: "600",
              lineHeight: "1.4",
              margin: "1.5rem 0 0.75rem 0",
            },
            "ul,ol": {
              margin: "0.75rem 0",
              paddingLeft: theme("spacing.6"),
            },
            li: {
              margin: "0.25rem 0",
            },
            code: {
              color: theme("colors.gray.800"),
              backgroundColor: theme("colors.gray.100"),
              fontWeight: "500",
              fontSize: "0.875em",
              borderRadius: theme("borderRadius.DEFAULT"),
              padding: `${theme("spacing.1")} ${theme("spacing.2")}`,
              border: `1px solid ${theme("colors.gray.200")}`,
            },
            pre: {
              color: theme("colors.gray.800"),
              backgroundColor: theme("colors.gray.50"),
              padding: theme("spacing.4"),
              borderRadius: theme("borderRadius.lg"),
              border: `1px solid ${theme("colors.gray.200")}`,
              overflow: "auto",
              fontSize: "0.875em",
              lineHeight: "1.6",
              margin: "1rem 0",
              boxShadow: theme("boxShadow.sm"),
              "> code": {
                display: "block",
                padding: "0",
                backgroundColor: "transparent",
                borderRadius: "0",
                border: "none",
              },
            },
            table: {
              fontSize: theme("fontSize.sm")[0],
              lineHeight: theme("fontSize.sm")[1].lineHeight,
              width: "100%",
              borderCollapse: "collapse",
              margin: `${theme("spacing.6")} 0`,
              border: `1px solid ${theme("colors.gray.200")}`,
              borderRadius: theme("borderRadius.lg"),
              overflow: "hidden",
              backgroundColor: theme("colors.white"),
            },
            thead: {
              backgroundColor: theme("colors.gray.50"),
            },
            "thead th": {
              color: theme("colors.gray.800"),
              fontWeight: "600",
              padding: theme("spacing.4"),
              textAlign: "left",
              fontSize: theme("fontSize.sm")[0],
              letterSpacing: theme("letterSpacing.wide"),
              borderBottom: `2px solid ${theme("colors.gray.200")}`,
            },
            "tbody tr": {
              borderBottom: `1px solid ${theme("colors.gray.200")}`,
              "&:nth-child(even)": {
                backgroundColor: theme("colors.gray.50"),
              },
              "&:hover": {
                backgroundColor: theme("colors.gray.100"),
              },
            },
            "tbody td": {
              padding: theme("spacing.4"),
              color: theme("colors.gray.700"),
              verticalAlign: "top",
            },
            a: {
              color: theme("colors.neutral.700"),
              textDecoration: "none",
              fontWeight: "500",
              "&:hover": {
                color: theme("colors.neutral.900"),
                textDecoration: "underline",
              },
            },
            blockquote: {
              color: theme("colors.gray.600"),
              borderLeft: `4px solid ${theme("colors.gray.300")}`,
              paddingLeft: theme("spacing.4"),
              margin: "1rem 0",
              fontStyle: "italic",
            },
            hr: {
              borderColor: theme("colors.gray.200"),
              margin: "2rem 0",
            },
          },
        },
        dark: {
          css: {
            color: theme("colors.white"),
            '[class~="lead"]': { color: theme("colors.white") },
            strong: { color: theme("colors.white") },
            a: {
              color: theme("colors.white"),
              "&:hover": {
                color: theme("colors.gray.300"),
              },
            },
            "h1,h2,h3,h4,h5,h6": {
              color: theme("colors.white"),
            },
            blockquote: {
              color: theme("colors.white"),
              borderLeftColor: theme("colors.gray.600"),
            },
            hr: { borderColor: theme("colors.gray.700") },
            ol: {
              li: {
                "&::marker": { color: theme("colors.white") },
              },
            },
            ul: {
              li: {
                "&::marker": { color: theme("colors.white") },
              },
            },
            code: {
              color: theme("colors.white"),
              backgroundColor: theme("colors.gray.800"),
              border: `1px solid ${theme("colors.gray.700")}`,
            },
            pre: {
              color: theme("colors.white"),
              backgroundColor: theme("colors.black"),
              border: `1px solid ${theme("colors.gray.700")}`,
            },
            table: {
              border: `1px solid ${theme("colors.gray.700")}`,
              backgroundColor: theme("colors.black"),
            },
            thead: {
              backgroundColor: theme("colors.gray.900"),
            },
            "thead th": {
              color: theme("colors.white"),
              borderBottom: `2px solid ${theme("colors.gray.600")}`,
            },
            "tbody td": {
              color: theme("colors.white"),
            },
            "tbody tr": {
              borderBottom: `1px solid ${theme("colors.gray.700")}`,
              "&:nth-child(even)": {
                backgroundColor: theme("colors.neutral.850"),
              },
              "&:hover": {
                backgroundColor: theme("colors.neutral.700"),
              },
            },
          },
        },
        sm: {
          css: {
            fontSize: theme("fontSize.sm")[0],
            lineHeight: theme("fontSize.sm")[1].lineHeight,
            p: {
              margin: "0.5rem 0",
            },
            "h1,h2,h3,h4,h5,h6": {
              margin: "1rem 0 0.5rem 0",
            },
            pre: {
              padding: theme("spacing.3"),
              fontSize: "0.8125em",
            },
            code: {
              fontSize: "0.8125em",
            },
            table: {
              fontSize: "0.8125em",
            },
            "thead th, tbody td": {
              padding: theme("spacing.3"),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    function ({ addUtilities, theme }) {
      const newUtilities = {
        ".text-shadow-glow": {
          textShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
        },
        ".text-shadow-glow-dark": {
          textShadow: "0 0 10px rgba(59, 130, 246, 0.3)",
        },
        ".transition-sidebar": {
          transition: "transform 300ms ease-in-out",
        },
        ".scrollbar-thin": {
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-track": {
            background: theme("colors.gray.100"),
          },
          "&::-webkit-scrollbar-thumb": {
            background: theme("colors.gray.400"),
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: theme("colors.gray.500"),
          },
        },
        ".dark .scrollbar-thin": {
          "&::-webkit-scrollbar-track": {
            background: theme("colors.gray.800"),
          },
          "&::-webkit-scrollbar-thumb": {
            background: theme("colors.gray.600"),
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: theme("colors.gray.500"),
          },
        },
        ".backdrop-blur-modal": {
          backdropFilter: "blur(4px)",
        },

        // CENTRALIZED COMPONENT CLASSES
        ".theme-surface-primary": {
          backgroundColor: theme("colors.neutral.50"),
          color: theme("colors.gray.900"),
        },
        ".dark .theme-surface-primary": {
          backgroundColor: theme("colors.neutral.800"),
          color: theme("colors.white"),
        },

        ".theme-surface-secondary": {
          backgroundColor: theme("colors.white"),
          borderColor: theme("colors.neutral.200"),
        },
        ".dark .theme-surface-secondary": {
          backgroundColor: theme("colors.neutral.700"),
          borderColor: theme("colors.neutral.600"),
        },

        ".theme-text-primary": {
          color: theme("colors.gray.900"),
        },
        ".dark .theme-text-primary": {
          color: theme("colors.white"),
        },

        ".theme-text-secondary": {
          color: theme("colors.gray.600"),
        },
        ".dark .theme-text-secondary": {
          color: theme("colors.gray.400"),
        },

        ".theme-border": {
          borderColor: theme("colors.neutral.200"),
        },
        ".dark .theme-border": {
          borderColor: theme("colors.neutral.700"),
        },

        ".theme-hover": {
          "&:hover": {
            backgroundColor: theme("colors.neutral.200"),
          },
        },
        ".dark .theme-hover": {
          "&:hover": {
            backgroundColor: theme("colors.neutral.700"),
          },
        },

        ".theme-button-primary": {
          backgroundColor: theme("colors.neutral.100"),
          borderColor: theme("colors.neutral.200"),
          "&:hover": {
            backgroundColor: theme("colors.neutral.200"),
          },
        },
        ".dark .theme-button-primary": {
          backgroundColor: theme("colors.neutral.600"),
          borderColor: theme("colors.neutral.500"),
          "&:hover": {
            backgroundColor: theme("colors.neutral.500"),
          },
        },

        ".theme-input": {
          backgroundColor: theme("colors.white"),
          borderColor: theme("colors.neutral.200"),
          color: theme("colors.gray.900"),
          "&:focus": {
            borderColor: theme("colors.blue.500"),
            outline: "none",
            boxShadow: `0 0 0 2px ${theme("colors.blue.500")}40`,
          },
        },
        ".dark .theme-input": {
          backgroundColor: theme("colors.neutral.700"),
          borderColor: theme("colors.neutral.600"),
          color: theme("colors.white"),
          "&:focus": {
            borderColor: theme("colors.blue.400"),
            boxShadow: `0 0 0 2px ${theme("colors.blue.400")}40`,
          },
        },
      };
      addUtilities(newUtilities);
    },
  ],
  safelist: [
    "animate-slideInRight",
    "animate-fadeIn",
    "animate-slideDown",
    "animate-slow-rotate",
    "text-shadow-glow",
    "shadow-glow",
    "backdrop-blur-modal",
    "scrollbar-thin",
    "prose-sm",
    "prose-dark",

    // Add centralized theme classes to safelist
    "theme-surface-primary",
    "theme-surface-secondary",
    "theme-text-primary",
    "theme-text-secondary",
    "theme-border",
    "theme-hover",
    "theme-button-primary",
    "theme-input",
  ],
};
