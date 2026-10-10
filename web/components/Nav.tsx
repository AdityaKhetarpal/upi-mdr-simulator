"use client"; // needs the current address to highlight the active link

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/scenario", label: "Scenario lab" },
  { href: "/ask", label: "Ask the data" },
  { href: "/method", label: "Method" },
];

export default function Nav() {
  const path = usePathname(); // e.g. "/scenario"
  return (
    <nav className="site-nav" aria-label="Main">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
