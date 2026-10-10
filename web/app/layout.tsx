// The frame around every page: fonts, header with menu, footer with the disclaimer
import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/bricolage-grotesque"; // headline font
import "@fontsource-variable/hanken-grotesk"; // body font
import "./globals.css";
import Nav from "@/components/Nav";
import meta from "@/public/data/meta.json";

export const metadata: Metadata = {
  title: "UPI MDR Impact Simulator",
  description: "What India's new UPI merchant fee costs a payment, how much it raises in total, and who gets paid.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="site-name">
              <span className="site-mark" aria-hidden="true" />
              UPI MDR Impact Simulator
            </Link>
            <Nav />
          </div>
        </header>

        <main className="wrap">{children}</main>

        <footer className="site-footer">
          <div className="wrap">
            <p>{meta.disclaimer}</p>
            <p>Data updated {meta.data_updated}. Start date: {meta.start_date_status}.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
