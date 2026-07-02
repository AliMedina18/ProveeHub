"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "proveehub-theme";

// El tema inicial ya lo aplica el script inline en layout.js (antes del primer
// paint, para evitar el flash de tema incorrecto). Aquí solo leemos lo que
// quedó puesto en <html data-theme="..."> y lo sincronizamos con este botón.
export default function ThemeToggle() {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con el atributo que puso el script inline antes del primer paint
    setTheme(current);
  }, []);

  function toggle() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // localStorage no disponible (modo privado, etc.) — el tema simplemente
        // no persiste entre sesiones, pero el toggle sigue funcionando.
      }
      return next;
    });
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="btn btn-ghost btn-icon theme-toggle"
      onClick={toggle}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      disabled={theme === null}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
