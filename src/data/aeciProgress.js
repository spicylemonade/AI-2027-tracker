import aeci from './aeciCalibration.js';
import ablation from './eciMetrAblation.js';
import { fitLogHorizon, predictHorizon } from './metrFit.js';
import { predictionEnvelope } from './horizonUncertainty.js';
import {
  ECI_CALIBRATION_POINTS, ECI_FIT, ECI_EXTRAPOLATED_P80_POINTS,
  PUBLISHED_METR_P80_POINTS, RECENT_ECI_FIT,
} from './metrProgress.js';

export const AECI_SOURCE = aeci;
export const AECI_CALIBRATION_POINTS = aeci.models.filter(p => p.metrId).map(p => ({
  ...p,
  eci: p.aeci, // fitLogHorizon's numerical input; the public scale is AECI.
  hours: PUBLISHED_METR_P80_POINTS.find(m => m.id === p.metrId).hours,
}));
export const AECI_FIT = fitLogHorizon(AECI_CALIBRATION_POINTS);

const aeciDisplay = {
  'Claude Mythos Preview': { label: 'Mythos AECI', labelDx: 8, labelDy: 14 },
  'Claude Mythos 5': { label: 'Mythos 5 AECI', labelDx: -104, labelDy: -18 },
  'Claude Opus 5': { label: 'Opus 5 AECI', labelDx: 8, labelDy: 8 },
};
export const AECI_EXTRAPOLATED_P80_POINTS = aeci.models.filter(p => aeciDisplay[p.model]).map(p => ({
  ...p,
  ...aeciDisplay[p.model],
  id: `${p.model.toLowerCase().replaceAll(' ', '-')}-aeci`,
  hours: predictHorizon(AECI_FIT, p.aeci),
  uncertainty: predictionEnvelope(AECI_FIT, p.aeci, {
    low: p.ciLow ?? null, high: p.ciHigh ?? null, inputLevel: aeci.ciLevel,
  }),
  inputLowHours: p.ciLow === undefined ? null : predictHorizon(AECI_FIT, p.ciLow),
  inputHighHours: p.ciHigh === undefined ? null : predictHorizon(AECI_FIT, p.ciHigh),
  inputIntervalLabel: p.ciLow === undefined
    ? 'No input interval digitized for this approximate point'
    : 'Reported 95% AECI endpoints only; calibration error omitted',
}));

const astra = ECI_EXTRAPOLATED_P80_POINTS.find(p => p.model === 'GPT-6 Astra');

export const ECI_WITHOUT_METR_FIT = fitLogHorizon(ablation.calibration.map(p => ({
  eci: p.withoutMetrEci, hours: p.hours,
})));
export const ECI_FULL_REFIT = fitLogHorizon(ablation.calibration.map(p => ({
  eci: p.fullEci, hours: p.hours,
})));

const gpt4 = ECI_CALIBRATION_POINTS.find(p => p.id === 'gpt_4');
const o3 = ECI_CALIBRATION_POINTS.find(p => p.id === 'o3_inspect');
const twoAnchorSlope = Math.log(o3.hours / gpt4.hours) / (o3.eci - gpt4.eci);
const fitSensitivity = (label, fit, assumption) => ({
  label, hours: predictHorizon(fit, astra.eci), assumption,
  uncertainty: predictionEnvelope(fit, astra.eci, { low: astra.ciLow, high: astra.ciHigh, inputLevel: astra.ciLevel }),
});

export const ASTRA_ESTIMATE_SENSITIVITY = [
  fitSensitivity('Pooled Epoch → p80', ECI_FIT, `${ECI_FIT.n} matched models; chart baseline`),
  { label: 'Epoch refitted without METR', hours: predictHorizon(ECI_WITHOUT_METR_FIT, ablation.astraWithoutMetrEci), assumption: 'All 36 METR observations removed before the full IRT refit' },
  fitSensitivity('Epoch, 2025+ models', RECENT_ECI_FIT, '12 recent models; smaller score range'),
  fitSensitivity('Epoch, OpenAI models only', fitLogHorizon(ECI_CALIBRATION_POINTS.filter(p => !p.label.startsWith('Claude') && !p.label.startsWith('Gemini'))), '11 OpenAI models'),
  fitSensitivity('Epoch, Claude models only', fitLogHorizon(ECI_CALIBRATION_POINTS.filter(p => p.label.startsWith('Claude'))), '8 Claude models; assumes transfer to OpenAI'),
  { label: 'GPT-4 → o3 slope continued', hours: o3.hours * Math.exp(twoAnchorSlope * (astra.eci - o3.eci)), assumption: 'Two chosen anchors; does not use the other observations' },
];
