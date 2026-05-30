export function calculateSimpleInterest(
  principal: number,
  tenureDays: number,
  ratePercent = 12,
): { simpleInterest: number; totalRepayment: number } {
  const simpleInterest = parseFloat(
    ((principal * ratePercent * tenureDays) / (365 * 100)).toFixed(2),
  );
  const totalRepayment = parseFloat((principal + simpleInterest).toFixed(2));
  return { simpleInterest, totalRepayment };
}
