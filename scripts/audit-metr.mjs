import {
  ECI_CALIBRATION_POINTS, ECI_EXTRAPOLATED_P80_POINTS, ECI_FIT,
  METR_PROGRESS_SNAPSHOT, RECENT_ECI_FIT,
} from '../src/data/metrProgress.js';
import { fitLogHorizon, predictHorizon } from '../src/data/metrFit.js';
import {
  AECI_CALIBRATION_POINTS, AECI_FIT, ASTRA_ESTIMATE_SENSITIVITY,
} from '../src/data/aeciProgress.js';
import { ASTRA_UNCERTAINTY_COMPONENTS, METR_TASK_BOOTSTRAP_AUDIT } from '../src/data/uncertaintyAudit.js';

const astraEci = ECI_EXTRAPOLATED_P80_POINTS.find(p => p.model === 'GPT-6 Astra').eci;
const leaveOneOut = ECI_CALIBRATION_POINTS.map((heldOut, i) => {
  const fit = fitLogHorizon(ECI_CALIBRATION_POINTS.filter((_, j) => i !== j));
  return {
    omitted: heldOut.label,
    predictedHours: predictHorizon(fit, heldOut.eci),
    observedHours: heldOut.hours,
    astraHours: predictHorizon(fit, astraEci),
  };
});
const looLogRmse = Math.sqrt(leaveOneOut.reduce((sum, row) =>
  sum + Math.log(row.predictedHours / row.observedHours) ** 2, 0) / leaveOneOut.length);

console.log(JSON.stringify({
  fit: ECI_FIT,
  recentFit: RECENT_ECI_FIT,
  sensitivity: {
    leaveOneOutAstraMin: Math.min(...leaveOneOut.map(p => p.astraHours)),
    leaveOneOutAstraMax: Math.max(...leaveOneOut.map(p => p.astraHours)),
    leaveOneOutMultiplicativeRmse: Math.exp(looLogRmse),
    warning: 'Leave-one-out is a sensitivity diagnostic, not independent validation: ECI includes METR.',
  },
  estimates: ECI_EXTRAPOLATED_P80_POINTS.map(p => ({
    model: p.model, eci: p.eci, p80Hours: p.hours,
    eciInputRangeOnly: [p.eciInputLowHours, p.eciInputHighHours],
    predictionEnvelope: p.uncertainty,
    recentFitHours: p.recentFitHours,
  })),
  separateP50Diagnostic: {
    astraHours: predictHorizon(fitLogHorizon(ECI_CALIBRATION_POINTS.map(p => ({
      ...p, hours: p.p50Minutes.estimate / 60,
    }))), astraEci),
    warning: 'Separate 50%-success regression; not a measured result and not comparable to the p80 axis.',
  },
  bestPublished: METR_PROGRESS_SNAPSHOT.bestPublished.label,
  aeci: {
    horizonFit: AECI_FIT,
    usage: 'Claude models only; Astra uses Epoch ECI directly',
    calibration: AECI_CALIBRATION_POINTS.map(p => ({ model: p.model, aeci: p.aeci, p80Hours: p.hours })),
  },
  astraMethodSensitivity: ASTRA_ESTIMATE_SENSITIVITY,
  uncertaintyAudit: {
    components: ASTRA_UNCERTAINTY_COMPONENTS,
    taskBootstrap: METR_TASK_BOOTSTRAP_AUDIT,
    warning: 'The default envelope is not an end-to-end confidence interval. No joint coverage is claimed.',
  },
  matches: ECI_CALIBRATION_POINTS.map(p => ({ model: p.label, eci: p.eci, p80Hours: p.hours })),
}, null, 2));
