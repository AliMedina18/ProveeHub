"use client";
import { useState } from "react";
import { Star, Loader2 } from "lucide-react";

/**
 * Fila de estrellas siempre horizontal.
 * - Modo lectura (default): solo muestra el puntaje.
 * - Modo interactivo (`interactive`): cada estrella es un botón; al hacer
 *   clic se llama a `onRate(n)`. Útil para calificar sin abrir el formulario.
 */
export default function StarRating({
  score,
  size = 14,
  showNumber = false,
  interactive = false,
  busy = false,
  onRate,
}) {
  const [hover, setHover] = useState(0);
  const n = Number(score) || 0;
  const display = hover || n;

  if (!interactive) {
    return (
      <span className="star-row" title={`${n}/5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            strokeWidth={1.6}
            color="var(--amber-star)"
            fill={i < n ? "var(--amber-star)" : "none"}
          />
        ))}
        {showNumber && <span className="star-row-number">{n}/5</span>}
      </span>
    );
  }

  return (
    <span
      className={`star-row star-row-interactive${busy ? " busy" : ""}`}
      onMouseLeave={() => setHover(0)}
    >
      {busy && <Loader2 size={size} className="spin" style={{ marginRight: 4 }} />}
      {Array.from({ length: 5 }).map((_, i) => {
        const val = i + 1;
        return (
          <button
            type="button"
            key={i}
            className="star-btn"
            disabled={busy}
            onMouseEnter={() => setHover(val)}
            onFocus={() => setHover(val)}
            onBlur={() => setHover(0)}
            onClick={() => onRate?.(val)}
            aria-label={`Calificar con ${val} estrella${val > 1 ? "s" : ""}`}
          >
            <Star
              size={size}
              strokeWidth={1.6}
              color="var(--amber-star)"
              fill={i < display ? "var(--amber-star)" : "none"}
            />
          </button>
        );
      })}
      {showNumber && <span className="star-row-number">{n}/5</span>}
    </span>
  );
}
