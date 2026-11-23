import { createContext, use } from "react";

export type ThemeMode = "light" | "dark" | "system";

export const themeStorageKey = "perpetual-hub-theme";

export const ThemeContext = createContext<{
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
} | null>(null);

export function useTheme() {
  const context = use(ThemeContext);
  if (!context) throw new Error("useTheme requires ThemeProvider");
  return context;
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}
