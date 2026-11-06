import aeci from './aeciCalibration.js';
import estimates from './horizonEstimates.js';
import { fitLogHorizon, predictHorizon } from './metrFit.js';
import { PUBLISHED_METR_P80_POINTS } from './metrProgress.js';

export const AECI_SOURCE = aeci;
export const AECI_CALIBRATION_POINTS = aeci.models.filter(p => p.metrId).map(p => ({
  ...p,
  eci: p.aeci, // fitLogHorizon's numerical input; the public scale is AECI.
  hours: PUBLISHED_METR_P80_POINTS.find(m => m.id === p.metrId).hours,
}));
export const AECI_FIT = fitLogHorizon(AECI_CALIBRATION_POINTS);

const aeciDisplay = {
  'Claude Mythos Preview': { label: 'Mythos Preview', labelDx: -80, labelDy: -1, note: ' METR measured an earlier snapshot at 3.1 h.' },
  'Claude Mythos 5': { label: 'Mythos 5', labelDx: -48, labelDy: -2 },
  'Claude Opus 5': { label: 'Opus 5', labelDx: -22, labelDy: -8 },
  'Claude Mythos 5.1': { label: 'Mythos 5.1', labelDx: 8, labelDy: 9 },
  'Anthropic Model 2 (internal)': { label: 'Model 2', labelDx: -43, labelDy: 1 },
  'Claude Opus 5.5': { label: 'Opus 5.5', labelDx: 10, labelDy: 6 },
  'Anthropic Model 3 (internal)': { label: 'Model 3', labelDx: -43, labelDy: 2 },
  'Anthropic Model 4 (internal)': { label: 'Model 4', labelDx: -43, labelDy: -2 },
};
export const AECI_EXTRAPOLATED_P80_POINTS = aeci.models.filter(p => aeciDisplay[p.model]).map(p => ({
  ...p,
  ...aeciDisplay[p.model],
  id: `${p.model.toLowerCase().replaceAll(' ', '-')}-aeci`,
  hours: predictHorizon(AECI_FIT, p.aeci),
  low: estimates.aeci[p.model].low,
  high: estimates.aeci[p.model].high,
}));
