import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["'Be Vietnam Pro'", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "flyToCart": {
          "0%": { transform: "translate(-50%, -50%) scale(1)", opacity: "1" },
          "50%": { transform: "translate(30vw, -40vh) scale(0.8)", opacity: "0.8" },
          "100%": { transform: "translate(40vw, -45vh) scale(0.3)", opacity: "0" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(239, 68, 68, 0.5), 0 0 20px rgba(239, 68, 68, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.5)" },
        },
        "flash-sale-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 10px rgba(239, 68, 68, 0.3), inset 0 0 10px rgba(239, 68, 68, 0.1)",
            borderColor: "rgba(239, 68, 68, 0.5)"
          },
          "50%": { 
            boxShadow: "0 0 25px rgba(239, 68, 68, 0.6), inset 0 0 15px rgba(239, 68, 68, 0.2)",
            borderColor: "rgba(239, 68, 68, 0.8)"
          },
        },
        "vip-diamond-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 4px rgba(34, 211, 238, 0.4), 0 0 8px rgba(34, 211, 238, 0.2)",
          },
          "50%": { 
            boxShadow: "0 0 8px rgba(34, 211, 238, 0.6), 0 0 16px rgba(34, 211, 238, 0.4)",
          },
        },
        "vip-gold-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 4px rgba(234, 179, 8, 0.4), 0 0 8px rgba(234, 179, 8, 0.2)",
          },
          "50%": { 
            boxShadow: "0 0 8px rgba(234, 179, 8, 0.6), 0 0 16px rgba(234, 179, 8, 0.4)",
          },
        },
        "vip-silver-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 3px rgba(148, 163, 184, 0.4), 0 0 6px rgba(148, 163, 184, 0.2)",
          },
          "50%": { 
            boxShadow: "0 0 6px rgba(148, 163, 184, 0.6), 0 0 12px rgba(148, 163, 184, 0.3)",
          },
        },
        "vip-bronze-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 3px rgba(234, 88, 12, 0.4), 0 0 6px rgba(234, 88, 12, 0.2)",
          },
          "50%": { 
            boxShadow: "0 0 6px rgba(234, 88, 12, 0.6), 0 0 12px rgba(234, 88, 12, 0.3)",
          },
        },
        "vip-member-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 2px rgba(100, 116, 139, 0.3), 0 0 4px rgba(100, 116, 139, 0.15)",
          },
          "50%": { 
            boxShadow: "0 0 4px rgba(100, 116, 139, 0.5), 0 0 8px rgba(100, 116, 139, 0.25)",
          },
        },
        "vip-shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
        "fly-to-cart": "flyToCart 0.4s ease-out forwards",
        "bounce-soft": "bounce-soft 0.5s ease-in-out",
        "slide-in-left": "slide-in-left 0.3s ease-out forwards",
        "shimmer": "shimmer 2s infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "flash-sale-glow": "flash-sale-glow 2s ease-in-out infinite",
        "vip-diamond-glow": "vip-diamond-glow 2s ease-in-out infinite",
        "vip-gold-glow": "vip-gold-glow 2s ease-in-out infinite",
        "vip-silver-glow": "vip-silver-glow 2.5s ease-in-out infinite",
        "vip-bronze-glow": "vip-bronze-glow 2.5s ease-in-out infinite",
        "vip-member-glow": "vip-member-glow 3s ease-in-out infinite",
        "vip-shimmer": "vip-shimmer 3s linear infinite",
        "shake": "shake 0.5s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
