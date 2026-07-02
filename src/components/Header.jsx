"use client";
import { Boxes, Globe, Plus } from "lucide-react";
import ExportMenu from "./ExportMenu";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";

export default function Header({
  subtitle,
  count,
  onExportExcel,
  onExportPDF,
  onAdd,
  notifications,
  unreadCount,
  onOpenNotifications,
}) {
  return (
    <header>
      <div className="logo">
        <span className="logo-badge">
          <Boxes size={16} strokeWidth={2.2} />
        </span>
        Proveedores <span>XP</span>
      </div>
      <div className="logo-subtitle">
        <Globe size={13} />
        {subtitle}
      </div>
      <div className="header-actions">
        <ThemeToggle />
        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          onOpenChange={onOpenNotifications}
        />
        <ExportMenu count={count} onExportExcel={onExportExcel} onExportPDF={onExportPDF} />
        <button className="btn btn-primary header-add-btn" onClick={onAdd}>
          <Plus size={15} />
          <span className="btn-label-lg">Agregar proveedor</span>
          <span className="btn-label-sm">Agregar</span>
        </button>
      </div>
    </header>
  );
}
