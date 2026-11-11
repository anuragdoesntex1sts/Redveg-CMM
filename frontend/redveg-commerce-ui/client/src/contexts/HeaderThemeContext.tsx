// ──────────────────────────────────────────────────────────────────────────────
// HeaderThemeContext — Provides the active header theme to the entire app
// and supports a temporary admin preview that is NOT persisted until applied.
// ──────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  HEADER_THEMES,
  HEADER_THEME_LIST,
  getThemeById,
  type HeaderTheme,
  type HeaderThemeId,
} from "@/themes/headerThemes";
import {
  getActiveHeaderThemeId,
  saveActiveHeaderThemeId,
  resetActiveHeaderThemeId,
} from "@/lib/settingsService";

interface HeaderThemeContextValue {
  /** The theme currently visible on the header (may be a preview). */
  effectiveTheme: HeaderTheme;
  /** The persisted/published theme ID. */
  activeThemeId: HeaderThemeId;
  /** The temporary preview theme ID (admin only). null when no preview. */
  previewThemeId: HeaderThemeId | null;
  /** All available themes. */
  themes: HeaderTheme[];
  /** Set a preview theme (does NOT persist). */
  setPreview: (id: HeaderThemeId | null) => void;
  /** Apply (persist) a theme and clear preview. */
  applyTheme: (id: HeaderThemeId) => Promise<void>;
  /** Reset to "default" and persist. */
  resetToDefault: () => Promise<void>;
  /** Whether the initial load is still in progress. */
  loading: boolean;
}

const HeaderThemeContext = createContext<HeaderThemeContextValue | null>(null);

export function HeaderThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeThemeId, setActiveThemeId] = useState<HeaderThemeId>("default");
  const [previewThemeId, setPreviewThemeId] = useState<HeaderThemeId | null>(null);
  const [loading, setLoading] = useState(true);

  // Load persisted theme on mount
  useEffect(() => {
    getActiveHeaderThemeId()
      .then((id) => setActiveThemeId(id))
      .catch(() => setActiveThemeId("default"))
      .finally(() => setLoading(false));
  }, []);

  const effectiveTheme = getThemeById(previewThemeId ?? activeThemeId);

  const setPreview = useCallback((id: HeaderThemeId | null) => {
    setPreviewThemeId(id);
  }, []);

  const applyTheme = useCallback(async (id: HeaderThemeId) => {
    await saveActiveHeaderThemeId(id);
    setActiveThemeId(id);
    setPreviewThemeId(null);
  }, []);

  const resetToDefault = useCallback(async () => {
    await resetActiveHeaderThemeId();
    setActiveThemeId("default");
    setPreviewThemeId(null);
  }, []);

  return (
    <HeaderThemeContext.Provider
      value={{
        effectiveTheme,
        activeThemeId,
        previewThemeId,
        themes: HEADER_THEME_LIST,
        setPreview,
        applyTheme,
        resetToDefault,
        loading,
      }}
    >
      {children}
    </HeaderThemeContext.Provider>
  );
}

export function useHeaderTheme() {
  const ctx = useContext(HeaderThemeContext);
  if (!ctx) throw new Error("useHeaderTheme must be used within HeaderThemeProvider");
  return ctx;
}