// The frame around every page: fonts, header with menu, footer with the disclaimer
import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/bricolage-grotesque"; // headline font
import "@fontsource-variable/hanken-grotesk"; // body font
import "./globals.css";
import Nav from "@/components/Nav";
import SiteMark from "@/components/SiteMark";
import JsonLd from "@/components/JsonLd";
import meta from "@/public/data/meta.json";
import { SITE_URL, SITE_NAME, REPO_URL, HUB_URL, AUTHOR, OTHER_PROJECTS, PERSON_LD, dateText } from "@/lib/seo";

const ONE_LINER = "What India's new UPI Merchant Discount Rate (MDR) costs each payment, how much it raises in total, and who gets the money.";

// Title, description and preview image used by Google and when the link is shared (WhatsApp, LinkedIn, X, Slack...).
// The image itself is app/opengraph-image.jpg (and twitter-image.jpg); Next.js adds its tags automatically.
// Each page sets its own title, description and canonical address; "%s" is replaced by the page's title.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: ONE_LINER,
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR.name, url: HUB_URL }],
  creator: AUTHOR.name,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "UPI Merchant Discount Rate (MDR) Impact Simulator: the real price of UPI's 0.4% fee",
    description: ONE_LINER,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "UPI Merchant Discount Rate (MDR) Impact Simulator: the real price of UPI's 0.4% fee",
    description: ONE_LINER,
    creator: "@0xAditya_k",
  },
};

// Who made the site and what it is, as structured data (read by search engines and AI assistants)
const SITE_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: "en-IN",
      author: { "@id": PERSON_LD["@id"] },
    },
    PERSON_LD,
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN">
      <body>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="site-name">
              <SiteMark />
              UPI Merchant Discount Rate (MDR) Impact Simulator
            </Link>
            <Nav />
          </div>
        </header>

        <main className="wrap">{children}</main>

        <footer className="site-footer">
          <div className="wrap footer-row">
            <p className="footer-by">
              Built by <a href={HUB_URL} rel="author"><strong>{AUTHOR.name}</strong></a> · {AUTHOR.jobTitle}, {AUTHOR.location}
            </p>
            <nav className="footer-links" aria-label="Aditya Khetarpal elsewhere">
              <a href={HUB_URL}>Portfolio</a>
              <a href="https://www.linkedin.com/in/adityakhetarpal" target="_blank" rel="noreferrer">LinkedIn</a>
              <a href="https://github.com/AdityaKhetarpal" target="_blank" rel="noreferrer">GitHub</a>
              <a href={REPO_URL} target="_blank" rel="noreferrer">Source code</a>
            </nav>
          </div>
          <div className="wrap">
            <p className="footer-more-title">More projects by {AUTHOR.name}</p>
            <ul className="footer-more">
              {OTHER_PROJECTS.map((p) => (
                <li key={p.url}>
                  <a href={p.url}>{p.name}</a>: {p.text}
                </li>
              ))}
            </ul>
            <p className="footer-note">Data as of {dateText(meta.data_updated)}. For analysis and education, not financial advice.</p>
          </div>
        </footer>
        <JsonLd data={SITE_LD} />
      </body>
    </html>
  );
}
