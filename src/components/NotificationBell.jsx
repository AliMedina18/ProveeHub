"use client";
import { useEffect, useRef, useState } from "react";
import { Bell, Plus, Pencil, Trash2 } from "lucide-react";

const ICONS = {
  insert: { Icon: Plus, bg: "var(--teal-light)", color: "var(--teal)" },
  update: { Icon: Pencil, bg: "var(--blue-light)", color: "var(--blue)" },
  delete: { Icon: Trash2, bg: "var(--red-light)", color: "var(--red)" },
};

function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "justo ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

export default function NotificationBell({ notifications, unreadCount, onOpenChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) onOpenChange?.();
  }

  return (
    <div className="bell-wrap" ref={ref}>
      <button className="btn btn-ghost btn-icon bell-btn" onClick={toggle} aria-label="Notificaciones">
        <Bell size={16} />
        {unreadCount > 0 && <span className="bell-dot">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>
      <div className={`bell-panel${open ? " open" : ""}`}>
        <div className="bell-head">
          <strong>Actividad reciente</strong>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-3)" }}>
            <span className="bell-live-dot" />
            en vivo
          </span>
        </div>
        <div className="bell-list">
          {notifications.length ? (
            notifications.map((n) => {
              const cfg = ICONS[n.type] || ICONS.update;
              const NIcon = cfg.Icon;
              return (
                <div className="bell-item" key={n.id}>
                  <span className="bell-item-icon" style={{ background: cfg.bg, color: cfg.color }}>
                    <NIcon size={13} />
                  </span>
                  <div>
                    <div className="bell-item-text">{n.text}</div>
                    <div className="bell-item-time">{timeAgo(n.at)}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bell-empty">
              Sin actividad todavía. Aquí verás en vivo lo que agreguen, editen o eliminen tus compañeros.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
