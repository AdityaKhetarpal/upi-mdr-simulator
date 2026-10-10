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

// "2026-10-10" -> "10 Oct 2026"
function dateText(v: string): string {
  return new Date(v + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

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
          <div className="wrap footer-row">
            <p className="footer-by">
              Built by <strong>Aditya Khetarpal</strong>
            </p>
            <nav className="footer-links" aria-label="Aditya Khetarpal elsewhere">
              <a href="https://github.com/AdityaKhetarpal" target="_blank" rel="noreferrer">GitHub</a>
              <a href="https://www.linkedin.com/in/adityakhetarpal" target="_blank" rel="noreferrer">LinkedIn</a>
              <a href="https://github.com/AdityaKhetarpal/upi-mdr-simulator" target="_blank" rel="noreferrer">Source code</a>
            </nav>
          </div>
          <div className="wrap">
            <p className="footer-note">Data as of {dateText(meta.data_updated)}. For analysis and education, not financial advice.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
