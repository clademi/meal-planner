import "./globals.css";

export const metadata = {
  title: "健康廚房計畫",
  description: "211餐盤 · 兩人份 · 精打細算",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
