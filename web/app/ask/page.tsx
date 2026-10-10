// Ask the data: plain-English questions answered by an AI that may only use this project's data
import AskBox from "@/components/AskBox";

export const metadata = { title: "Ask the data · UPI MDR Impact Simulator" };

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
    </>
  );
}
