type RiskLevel = "Low" | "Medium" | "High";

export function predictInjuryRisk(
  recentLoad: number[],
  chronicLoad: number[],
  sleepHours: number,
  soreness: number
): { risk: RiskLevel; score: number } {
  const acute =
    recentLoad.reduce((a, b) => a + b, 0) / recentLoad.length;

  const chronic =
    chronicLoad.reduce((a, b) => a + b, 0) / chronicLoad.length;

  const acwr = acute / chronic;

  const loadRisk =
    acwr > 1.5 ? 1 : acwr > 1.2 ? 0.6 : 0.3;

  const sleepRisk = (8 - sleepHours) / 8;
  const sorenessRisk = soreness / 10;

  const score =
    0.5 * loadRisk +
    0.3 * sleepRisk +
    0.2 * sorenessRisk;

  let risk: RiskLevel = "Low";
  if (score > 0.7) risk = "High";
  else if (score > 0.4) risk = "Medium";

  return { risk, score };
}
