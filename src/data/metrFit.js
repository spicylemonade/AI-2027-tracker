// Descriptive ordinary least squares in log-hours. This is not a METR or Epoch
// forecast: ECI itself includes METR benchmark scores, and neither the ECI nor
// the published horizon measurement errors are modeled by this regression.
export const fitLogHorizon = (points) => {
  if (points.length < 3 || points.some(({ eci, hours }) =>
    !Number.isFinite(eci) || !Number.isFinite(hours) || hours <= 0)) {
    throw new Error('A horizon fit needs at least three finite, positive observations.');
  }
  const n = points.length;
  const meanEci = points.reduce((sum, p) => sum + p.eci, 0) / n;
  const meanLogHours = points.reduce((sum, p) => sum + Math.log(p.hours), 0) / n;
  const sxx = points.reduce((sum, p) => sum + (p.eci - meanEci) ** 2, 0);
  if (sxx === 0) throw new Error('A horizon fit needs distinct ECI values.');
  const slope = points.reduce((sum, p) =>
    sum + (p.eci - meanEci) * (Math.log(p.hours) - meanLogHours), 0) / sxx;
  const intercept = meanLogHours - slope * meanEci;
  const sse = points.reduce((sum, p) =>
    sum + (Math.log(p.hours) - intercept - slope * p.eci) ** 2, 0);
  const sst = points.reduce((sum, p) => sum + (Math.log(p.hours) - meanLogHours) ** 2, 0);
  return {
    n, slope, intercept,
    meanEci,
    sxx,
    rSquared: sst === 0 ? null : 1 - sse / sst,
    residualLogSd: Math.sqrt(sse / (n - 2)),
    minEci: Math.min(...points.map(p => p.eci)),
    maxEci: Math.max(...points.map(p => p.eci)),
  };
};

// Exponentiating the fitted log response gives a geometric central estimate,
// not the arithmetic expected horizon or a guaranteed lower bound.
export const predictHorizon = (fit, eci) => {
  if (!Number.isFinite(eci)) throw new Error('ECI must be finite.');
  return Math.exp(fit.intercept + fit.slope * eci);
};
