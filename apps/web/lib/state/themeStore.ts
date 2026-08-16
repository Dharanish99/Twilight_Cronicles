import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "daylight" | "dusk";

interface ThemeStore {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "daylight",
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute(
            "data-theme",
            theme === "dusk" ? "dusk" : ""
          );
        }
      },
      toggleTheme: () => {
        const next = get().theme === "daylight" ? "dusk" : "daylight";
        get().setTheme(next);
      },
    }),
    {
      name: "twilight-theme",
      onRehydrateStorage: () => (state) => {
        // Apply stored theme on hydration
        if (state?.theme === "dusk" && typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", "dusk");
        }
      },
    }
  )
);
