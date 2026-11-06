// Classical log-linear regression intervals, conditional on fixed calibration
// inputs and independent, constant-variance Gaussian residuals. They are NOT an
// end-to-end model of source measurement errors or future distribution shift.

const logGamma = (z) => {
  const coefficients = [676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012,
    9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  const u = z - 1;
  const sum = coefficients.reduce((v, c, i) => v + c / (u + i + 1), 0.99999999999980993);
  const t = u + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (u + 0.5) * Math.log(t) - t + Math.log(sum);
};

const betaFraction = (a, b, x) => {
  const nonzero = v => Math.abs(v) < 1e-300 ? 1e-300 : v;
  let c = 1;
  let d = 1 / nonzero(1 - (a + b) * x / (a + 1));
  let h = d;
  for (let m = 1; m <= 300; m++) {
    let numerator = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m));
    d = 1 / nonzero(1 + numerator * d);
    c = nonzero(1 + numerator / c);
    h *= d * c;
    numerator = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1 / nonzero(1 + numerator * d);
    c = nonzero(1 + numerator / c);
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-14) return h;
  }
  throw new Error('Incomplete beta fraction did not converge.');
};

const regularizedBeta = (x, a, b) => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b)
    + a * Math.log(x) + b * Math.log1p(-x));
  return x < (a + 1) / (a + b + 2)
    ? front * betaFraction(a, b, x) / a
    : 1 - front * betaFraction(b, a, 1 - x) / b;
};

const criticalCache = new Map();
export const studentTCritical = (level, degreesOfFreedom) => {
  if (!(level > 0 && level < 1) || !Number.isFinite(degreesOfFreedom) || degreesOfFreedom <= 0) {
    throw new Error('A t critical value needs a level between 0 and 1 and positive degrees of freedom.');
  }
  const key = `${level}:${degreesOfFreedom}`;
  if (criticalCache.has(key)) return criticalCache.get(key);
  const cdf = t => 1 - 0.5 * regularizedBeta(degreesOfFreedom / (degreesOfFreedom + t * t), degreesOfFreedom / 2, 0.5);
  const probability = (1 + level) / 2;
  let low = 0;
  let high = 1;
  while (cdf(high) < probability) {
    high *= 2;
    if (!Number.isFinite(high)) throw new Error('Could not bracket the t critical value.');
  }
  for (let i = 0; i < 80; i++) {
    const middle = (low + high) / 2;
    if (cdf(middle) < probability) low = middle;
    else high = middle;
  }
  const result = (low + high) / 2;
  criticalCache.set(key, result);
  return result;
};

export const regressionInterval = (fit, index, { level = 0.9, newModel = true } = {}) => {
  if (!Number.isFinite(index) || !(fit.sxx > 0) || !(fit.n >= 3)
    || !Number.isFinite(fit.sxx) || !Number.isInteger(fit.n)
    || !Number.isFinite(fit.meanEci) || !Number.isFinite(fit.residualLogSd) || fit.residualLogSd < 0
    || !Number.isFinite(fit.intercept) || !Number.isFinite(fit.slope)) {
    throw new Error('Prediction intervals require a finite index and valid regression diagnostics.');
  }
  const leverage = 1 / fit.n + (index - fit.meanEci) ** 2 / fit.sxx;
  const standardError = fit.residualLogSd * Math.sqrt((newModel ? 1 : 0) + leverage);
  const margin = studentTCritical(level, fit.n - 2) * standardError;
  const logPrediction = fit.intercept + fit.slope * index;
  return {
    lowHours: Math.exp(logPrediction - margin),
    highHours: Math.exp(logPrediction + margin),
    level, leverage, standardError,
    kind: newModel ? 'conditional-prediction' : 'conditional-mean',
  };
};

export const predictionEnvelope = (fit, index, { low = null, high = null, inputLevel = null, level = 0.9 } = {}) => {
  const missingInputInterval = low === null || high === null;
  if ((low === null) !== (high === null) || (!missingInputInterval
    && (!Number.isFinite(low) || !Number.isFinite(high) || low > index || high < index))) {
    throw new Error('Input endpoints must be finite, ordered, and contain the central index.');
  }
  const conditional = regressionInterval(fit, index, { level });
  const endpoints = [low ?? index, high ?? index].map(x => regressionInterval(fit, x, { level }));
  // In a linear fit, the lower log prediction limit is concave and the upper
  // limit is convex in x, so envelope extrema over an interval occur at its ends.
  return {
    lowHours: Math.min(...endpoints.map(p => p.lowHours)),
    highHours: Math.max(...endpoints.map(p => p.highHours)),
    conditional,
    kind: missingInputInterval ? 'conditional-prediction' : 'input-and-fit-envelope',
    inputLevel: missingInputInterval ? null : inputLevel,
    predictionLevel: level,
    overallCoverage: null, // A 90% input range + 90% conditional PI is not a 90% joint interval.
    missingInputInterval,
  };
};
