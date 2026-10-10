// Scenario lab page: a short intro, then the interactive sliders
import ScenarioLab from "@/components/ScenarioLab";

export const metadata = { title: "Scenario lab · UPI MDR Impact Simulator" };

export default function ScenarioPage() {
  return (
    <>
      <h1>Scenario lab</h1>
      <p className="lead">
        The fee rules are fixed, but nobody has published how much merchant money they will actually touch.
        Change those assumptions and watch the totals move.
      </p>
      <ScenarioLab />
    </>
  );
}
