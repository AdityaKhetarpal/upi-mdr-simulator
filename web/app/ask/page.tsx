// Ask the data: plain-English questions answered by an AI that may only use this project's data
import JsonLd from "@/components/JsonLd";
import { breadcrumbLd } from "@/lib/seo";
import AskBox from "@/components/AskBox";

export const metadata = {
  title: "Ask the data",
  description:
    "Ask plain-English questions about India's UPI Merchant Discount Rate (MDR). Answers use only this site's sourced rules and scenarios, and name the data they used.",
  alternates: { canonical: "/ask" },
};

export default function AskPage() {
  return (
    <>
      <h1>Ask the data</h1>
      <p className="lead">
        Ask about the fee in plain English. Answers come only from this site&apos;s rules, scenarios and
        sources, and name the part they used, like [RULES] or [SCENARIOS].
      </p>
      <AskBox />
      <p className="note">
        Common questions are worked out directly from the data. Other questions go to Claude Haiku, which can be
        wrong, so check against the Overview and Scenario lab. AI questions are sent to Anthropic to produce the
        answer; this site doesn&apos;t store them.
      </p>
      <JsonLd data={breadcrumbLd("Ask the data", "/ask")} />
    </>
  );
}
