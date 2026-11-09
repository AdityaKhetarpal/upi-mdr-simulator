// Shown for any address that doesn't exist (Next.js still sends a 404 status and noindex).
import Link from "next/link";
import { HUB_URL } from "@/lib/seo";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <>
      <h1>This page doesn&apos;t exist.</h1>
      <p className="lead">The address may be mistyped, or the page has moved. These are the pages that do exist:</p>
      <ul className="list-plain">
        <li><Link href="/">Overview: the fee on one payment and the national total</Link></li>
        <li><Link href="/scenario">Scenario lab: change the assumptions</Link></li>
        <li><Link href="/ask">Ask the data</Link></li>
        <li><Link href="/method">Method, sources and limitations</Link></li>
        <li><a href={HUB_URL}>Other projects by Aditya Khetarpal</a></li>
      </ul>
    </>
  );
}
