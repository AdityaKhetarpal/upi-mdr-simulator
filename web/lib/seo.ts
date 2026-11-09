// Search-engine and AI-assistant settings in one place:
// the site address, who built it, and the other projects to link to.
// Change HUB_URL here if the portfolio page moves.

export const SITE_URL = "https://upi-mdr-simulator.vercel.app";
export const SITE_NAME = "UPI Merchant Discount Rate (MDR) Impact Simulator";
export const REPO_URL = "https://github.com/AdityaKhetarpal/upi-mdr-simulator";

// the portfolio page about Aditya: every project links back to it
export const HUB_URL = "https://adityakhetarpal.vercel.app";

// the same person, described the same way on every site
export const AUTHOR = {
  name: "Aditya Khetarpal",
  jobTitle: "Data Analyst and AI Builder",
  location: "Delhi, India",
  url: HUB_URL,
  sameAs: [
    "https://www.linkedin.com/in/adityakhetarpal",
    "https://github.com/AdityaKhetarpal",
    "https://degenfinds.substack.com",
    "https://x.com/0xAditya_k",
  ],
};

// Aditya's other live projects (shown in the footer, with descriptive link text)
export const OTHER_PROJECTS = [
  { name: "Evalgate", text: "open-source LLM eval harness that blocks regressions in CI", url: "https://evalgate-ak.vercel.app" },
  { name: "India KYC MCP", text: "MCP server that checks IFSC, PIN, GSTIN and PAN for AI assistants", url: "https://indiakyc.vercel.app" },
  { name: "AI Data Analyst Agent", text: "read-only, self-correcting text-to-SQL agent", url: "https://ai-data-analyst-agent-ten.vercel.app" },
];

// Person, as schema.org JSON-LD. The @id lets every site point at the same person.
export const PERSON_LD = {
  "@type": "Person",
  "@id": `${HUB_URL}/#person`,
  name: AUTHOR.name,
  jobTitle: AUTHOR.jobTitle,
  url: AUTHOR.url,
  address: { "@type": "PostalAddress", addressLocality: "Delhi", addressCountry: "IN" },
  sameAs: AUTHOR.sameAs,
};

// "Home > Method" trail, as schema.org JSON-LD
export function breadcrumbLd(pageName: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
      { "@type": "ListItem", position: 2, name: pageName, item: `${SITE_URL}${path}` },
    ],
  };
}

// "2026-10-10" -> "10 Oct 2026"
export function dateText(v: string): string {
  return new Date(v + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
