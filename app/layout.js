import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata = {
  title: "AHPOJI DAILY",
  description: "Personal ledger for goals, projects, activities and notes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body">
        <div className="min-h-screen flex flex-col md:flex-row">
          <Sidebar />
          <main className="flex-1 min-w-0 px-4 md:px-10 py-6 md:py-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
