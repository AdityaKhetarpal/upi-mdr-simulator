// Scenario lab page: a short intro, then the interactive sliders
import JsonLd from "@/components/JsonLd";
import { breadcrumbLd } from "@/lib/seo";
import ScenarioLab from "@/components/ScenarioLab";

export const metadata = {
  title: "Scenario lab",
  description:
    "Change the UPI Merchant Discount Rate (MDR) assumptions (start date, exempt merchants, payments hitting the ₹300 cap) and see the yearly fee pool and each player's share update.",
  alternates: { canonical: "/scenario" },
};

export default function ScenarioPage() {
  return (
    <>
      <h1>Scenario lab</h1>
      <p className="lead">
        The fee rules are fixed, but nobody has published how much merchant money they will actually touch.
        Change those assumptions and watch the totals move.
      </p>
      <ScenarioLab />
      <JsonLd data={breadcrumbLd("Scenario lab", "/scenario")} />
    </>
  );
}
