import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  isThemeMode,
  ThemeContext,
  themeStorageKey,
  type ThemeMode,
} from "./theme-context";

function readTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(themeStorageKey);
    return isThemeMode(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

function subscribeToSystemTheme(onChange: () => void) {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function systemIsDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(readTheme);
  const prefersDark = useSyncExternalStore(
    subscribeToSystemTheme,
    systemIsDark,
    () => false,
  );
  const resolvedTheme =
    theme === "system" ? (prefersDark ? "dark" : "light") : theme;

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    try {
      localStorage.setItem(themeStorageKey, nextTheme);
    } catch {
      // Keep the choice usable for this visit when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === themeStorageKey || event.key === null) {
        setThemeState(isThemeMode(event.newValue) ? event.newValue : "system");
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.classList.toggle("light", resolvedTheme === "light");
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        "content",
        getComputedStyle(root).getPropertyValue("--bg").trim(),
      );
  }, [resolvedTheme]);

  return (
    <ThemeContext value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext>
  );
}
