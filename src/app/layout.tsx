import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/components/LanguageProvider";

export const metadata: Metadata = {
  title: "Adarsh Shoes Billing Software",
  description: "Advanced billing & inventory management for Adarsh Shoes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased font-sans`}
      >
        <LanguageProvider>
          <div className="flex min-h-screen print:block print:min-h-0">
            <div className="print:hidden">
              <Sidebar />
            </div>
            <main className="flex-1 ml-64 print:ml-0 bg-background print:bg-white">
              <div className="p-6 print:p-0">
                {children}
              </div>
            </main>
          </div>
          <Toaster richColors position="top-right" />
        </LanguageProvider>
      </body>
    </html>
  );
}
