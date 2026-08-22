import "./globals.css";
import Sidebar from "./components/Sidebar";
import ThemeSettings from "./components/ThemeSettings";

export const metadata = {
  title: "AHPOJI DAILY",
  description: "Personal ledger for goals, projects, activities and notes.",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body">
        <div className="min-h-screen flex flex-col md:flex-row">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex justify-end px-4 pt-4 md:px-10"><ThemeSettings /></div>
            <main className="w-full flex-1 min-w-0 px-4 py-4 md:px-10 md:py-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
