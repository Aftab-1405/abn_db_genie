// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1) Include every place that might reference `prose`, `pre`, or `code`,
  //    so that Typography‐plugin rules are not purged.
  content: ["./templates/**/*.html", "./static/**/*.{js,css}"],
  darkMode: "class", // ← Only this line handles dark/light mode
  theme: {
    extend: {
      fontFamily: {
        cursive: ["Dancing Script", "cursive"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(255, 255, 255, 0.5)",
      },
      keyframes: {
        rotate: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "slow-rotate": "rotate 10s linear infinite",
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: "100%",
            width: "100%",
            overflowWrap: "break-word",
            lineHeight: "1.5",

            /* Content wrapper spacing */
            ".content-wrapper": {
              "> *:first-child": {
                marginTop: "0 !important",
              },
              "> *:last-child": {
                marginBottom: "0 !important",
              },
            },

            /* Base text spacing */
            p: {
              margin: "0.5em 0",
              "&:first-child": {
                marginTop: "0",
              },
              "&:last-child": {
                marginBottom: "0",
              },
            },

            /* Code block spacing */
            pre: {
              margin: "1em 0",
            },

            /* Mermaid diagram wrapper styling */
            "div > .mermaid": {
              border: "none !important",
              padding: "0 !important",
              margin: "1rem 0",
              backgroundColor: "transparent !important",
              "& > div": {
                backgroundColor: "transparent !important",
                border: "none !important",
              },
            },

            /* Mermaid diagram styling */
            ".mermaid": {
              backgroundColor: "transparent !important",
              border: "none !important",
              padding: "0 !important",
              "& > svg": {
                backgroundColor: "transparent !important",
                "& .label": {
                  color: theme("colors.slate.700"),
                },
                "& .node rect, & .node circle, & .node ellipse, & .node polygon":
                  {
                    fill: theme("colors.slate.100"),
                    stroke: theme("colors.slate.400"),
                  },
                "& .edgePath .path": {
                  stroke: theme("colors.slate.400"),
                },
                "& .arrowheadPath": {
                  fill: theme("colors.slate.400"),
                },
                "& .edgeLabel": {
                  background: "transparent !important",
                },
              },
            },

            /* SVG container */
            "div:has(> .mermaid)": {
              border: "none !important",
              backgroundColor: "transparent !important",
              padding: "0 !important",
              boxShadow: "none !important",
            },

            /* Optimized inline code styling */
            code: {
              backgroundColor: theme("colors.slate.100"),
              color: theme("colors.slate.800"),
              fontWeight: "500",
              fontSize: "0.875em",
              borderRadius: theme("borderRadius.md"),
              paddingTop: theme("spacing.1"),
              paddingRight: theme("spacing.2"),
              paddingBottom: theme("spacing.1"),
              paddingLeft: theme("spacing.2"),
              border: `1px solid ${theme("colors.slate.200")}`,
              "&::before": { content: '""' },
              "&::after": { content: '""' },
            },

            /* Optimized code block styling */
            pre: {
              color: theme("colors.slate.100"),
              backgroundColor: theme("colors.slate.900"),
              padding: theme("spacing.5"),
              borderRadius: theme("borderRadius.lg"),
              border: `1px solid ${theme("colors.slate.700")}`,
              overflow: "auto",
              fontSize: "0.875em",
              lineHeight: "1.6",
              boxShadow: theme("boxShadow.sm"),

              "> code": {
                display: "block",
                padding: "0",
                color: "inherit",
                backgroundColor: "transparent",
                borderRadius: "0",
                fontWeight: "400",
                border: "none",
                fontSize: "inherit",
                "&::before": { content: "none" },
                "&::after": { content: "none" },
              },
            },

            /* Optimized table styling */
            table: {
              fontSize: theme("fontSize.sm")[0],
              lineHeight: theme("fontSize.sm")[1].lineHeight,
              width: "100%",
              borderCollapse: "collapse",
              marginTop: theme("spacing.6"),
              marginBottom: theme("spacing.6"),
              border: `1px solid ${theme("colors.slate.200")}`,
              borderRadius: theme("borderRadius.lg"),
              overflow: "hidden",
            },

            thead: {
              backgroundColor: theme("colors.slate.50"),
            },

            "thead tr": {
              borderBottomWidth: "2px",
              borderBottomColor: theme("colors.slate.300"),
            },

            "thead th": {
              color: theme("colors.slate.800"),
              fontWeight: "600",
              paddingTop: theme("spacing.4"),
              paddingRight: theme("spacing.4"),
              paddingBottom: theme("spacing.4"),
              paddingLeft: theme("spacing.4"),
              textAlign: "left",
              fontSize: theme("fontSize.sm")[0],
              letterSpacing: theme("letterSpacing.wide"),
            },

            tbody: {
              backgroundColor: theme("colors.white"),
            },

            "tbody tr": {
              borderBottomWidth: "1px",
              borderBottomColor: theme("colors.slate.200"),
              "&:nth-child(even)": {
                backgroundColor: theme("colors.slate.25"),
              },
              "&:hover": {
                backgroundColor: theme("colors.slate.50"),
              },
            },

            "tbody td": {
              paddingTop: theme("spacing.4"),
              paddingRight: theme("spacing.4"),
              paddingBottom: theme("spacing.4"),
              paddingLeft: theme("spacing.4"),
              color: theme("colors.slate.700"),
              verticalAlign: "top",
            },

            /* Code inside table cells */
            "td code, th code": {
              fontSize: "0.8em",
              padding: `${theme("spacing.0.5")} ${theme("spacing.1.5")}`,
            },

            /* Mermaid diagram styling */
            ".mermaid": {
              width: "100%",
              margin: "1rem 0",
              padding: theme("spacing.4"),
              backgroundColor: theme("colors.slate.50"),
              borderRadius: theme("borderRadius.lg"),
              border: `1px solid ${theme("colors.slate.200")}`,
              overflow: "auto",
            },
          },
        },

        /* Dark theme optimizations */
        dark: {
          css: {
            color: theme("colors.slate.300"),

            /* Dark theme inline code */
            code: {
              backgroundColor: theme("colors.slate.800"),
              color: theme("colors.slate.200"),
              border: `1px solid ${theme("colors.slate.700")}`,
            },

            /* Dark theme code blocks */
            pre: {
              backgroundColor: theme("colors.slate.950"),
              border: `1px solid ${theme("colors.slate.700")}`,
              color: theme("colors.slate.200"),
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
            },

            /* Dark theme table styling */
            table: {
              border: `1px solid ${theme("colors.slate.700")}`,
            },

            thead: {
              backgroundColor: theme("colors.slate.800"),
            },

            "thead th": {
              color: theme("colors.slate.200"),
              borderBottomColor: theme("colors.slate.600"),
            },

            "thead tr": {
              borderBottomColor: theme("colors.slate.600"),
            },

            tbody: {
              backgroundColor: theme("colors.slate.900"),
            },

            "tbody tr": {
              borderBottomColor: theme("colors.slate.700"),
              "&:nth-child(even)": {
                backgroundColor: theme("colors.slate.800/50"),
              },
              "&:hover": {
                backgroundColor: theme("colors.slate.800"),
              },
            },

            "tbody td": {
              color: theme("colors.slate.300"),
            },

            /* Dark theme links */
            a: {
              color: theme("colors.cyan.400"),
              "&:hover": {
                color: theme("colors.cyan.300"),
              },
            },

            /* Other dark theme elements */
            '[class~="lead"]': {
              color: theme("colors.slate.400"),
            },

            strong: {
              color: theme("colors.slate.100"),
            },

            "ol > li::before": {
              color: theme("colors.slate.500"),
            },

            "ul > li::before": {
              backgroundColor: theme("colors.slate.600"),
            },

            hr: {
              borderColor: theme("colors.slate.700"),
            },

            blockquote: {
              color: theme("colors.slate.400"),
              borderLeftColor: theme("colors.slate.700"),
            },

            "h1, h2, h3, h4, h5, h6": {
              color: theme("colors.slate.100"),
            },

            /* Dark theme mermaid diagram and wrapper */
            "div > .mermaid, .mermaid, div:has(> .mermaid)": {
              backgroundColor: "transparent !important",
              border: "none !important",
              padding: "0 !important",
              boxShadow: "none !important",
              "& > div": {
                backgroundColor: "transparent !important",
                border: "none !important",
              },
              "& > svg": {
                backgroundColor: "transparent !important",
                "& .label": {
                  color: theme("colors.slate.200"),
                  background: "transparent !important",
                },
                "& .node rect, & .node circle, & .node ellipse, & .node polygon":
                  {
                    fill: theme("colors.slate.800"),
                    stroke: theme("colors.slate.600"),
                  },
                "& .edgePath .path": {
                  stroke: theme("colors.slate.500"),
                },
                "& .arrowheadPath": {
                  fill: theme("colors.slate.500"),
                },
                "& .edgeLabel": {
                  color: theme("colors.slate.200"),
                  background: "transparent !important",
                },
              },
            },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
