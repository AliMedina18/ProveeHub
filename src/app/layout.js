import "./globals.css";

export const metadata = {
  title: "ProveeHub · Base de Proveedores",
  description: "Sistema de gestión de proveedores para Marketing Experiencial",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
