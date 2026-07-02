"use client";
import { ChevronDown, X } from "lucide-react";

/* Campo de texto con label flotante (estilo Apple / Material sutil) */
export function TextField({
  label,
  icon,
  required,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
  ...rest
}) {
  return (
    <div className={`field-float${icon ? " has-icon" : ""}`}>
      {icon && <span className="field-icon">{icon}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || " "}
        {...rest}
      />
      <label>
        {label}
        {required && <span className="field-required">*</span>}
      </label>
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

/* Select con label fija arriba y chevron consistente */
export function SelectField({ label, required, value, onChange, disabled, children }) {
  return (
    <div className="field-select">
      <label>
        {label}
        {required && <span className="field-required">*</span>}
      </label>
      <div className="select-wrap">
        <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
          {children}
        </select>
        <ChevronDown size={15} className="chev" />
      </div>
    </div>
  );
}

export function TextAreaField({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div className="field-textarea">
      <label>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}

/* Entrada de etiquetas (servicios) en forma de chips */
export function TagInput({ label, values, onChange, placeholder }) {
  function addFromText(text) {
    const parts = text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...values];
    for (const p of parts) {
      if (!next.some((v) => v.toLowerCase() === p.toLowerCase())) next.push(p);
    }
    onChange(next);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addFromText(e.currentTarget.value);
      e.currentTarget.value = "";
    } else if (e.key === "Backspace" && !e.currentTarget.value && values.length) {
      onChange(values.slice(0, -1));
    }
  }

  function handleBlur(e) {
    if (e.currentTarget.value.trim()) {
      addFromText(e.currentTarget.value);
      e.currentTarget.value = "";
    }
  }

  return (
    <div className="field-select">
      <label>{label}</label>
      <div className="tag-input">
        {values.map((v) => (
          <span className="tag-chip" key={v}>
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}>
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          type="text"
          placeholder={values.length ? "" : placeholder}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      </div>
      <div className="field-hint" style={{ paddingLeft: 0 }}>
        Escribe y presiona Enter o coma para agregar
      </div>
    </div>
  );
}
