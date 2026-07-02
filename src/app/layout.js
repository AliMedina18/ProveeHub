import Script from "next/script";
import "./globals.css";
import "sileo/styles.css";
import { Toaster } from "sileo";

export const metadata = {
  title: "ProveeHub · Base de Proveedores",
  description: "Sistema de gestión de proveedores para Marketing Experiencial",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

// Aplica el tema (claro/oscuro) guardado por el usuario ANTES del primer
// paint, para que no se vea un parpadeo de tema incorrecto al cargar.
// beforeInteractive = se ejecuta antes de hidratar React.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("proveehub-theme");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          options={{
            roundness: 16,
            styles: {
              badge: "bg-white!",
            },
          }}
        />
      </body>
    </html>
  );
}
