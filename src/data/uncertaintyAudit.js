import { ECI_EXTRAPOLATED_P80_POINTS, ECI_FIT } from './metrProgress.js';
import { regressionInterval } from './horizonUncertainty.js';
import taskBootstrap from './metrTaskBootstrapAudit.js';

export const METR_TASK_BOOTSTRAP_AUDIT = taskBootstrap;
const astra = ECI_EXTRAPOLATED_P80_POINTS.find(p => p.model === 'GPT-6 Astra');
export const ASTRA_UNCERTAINTY_COMPONENTS = [
  {
    label: 'Index uncertainty only (old bounds)',
    lowHours: astra.eciInputLowHours, highHours: astra.eciInputHighHours,
    interpretation: '90% Epoch ECI endpoints through a fixed curve; ignores prediction error',
  },
  {
    label: 'Fitted line at fixed ECI',
    ...regressionInterval(ECI_FIT, astra.eci, { newModel: false }),
    interpretation: 'Nominal 90% interval for the mean log response under the OLS assumptions',
  },
  {
    label: 'New-model prediction at fixed ECI',
    ...astra.uncertainty.conditional,
    interpretation: 'Nominal 90% prediction interval: line uncertainty plus model-to-model scatter',
  },
  {
    label: 'Index + fit envelope (default)',
    lowHours: astra.uncertainty.lowHours, highHours: astra.uncertainty.highHours,
    interpretation: 'Envelope of conditional 90% prediction limits over the 90% ECI input range; no joint coverage claimed',
  },
  {
    label: 'METR task-bootstrap diagnostic (2026-09-07 ECI snapshot)',
    lowHours: taskBootstrap.astraRegressionHours.low, highHours: taskBootstrap.astraRegressionHours.high,
    interpretation: '5th–95th percentiles across joint task resamples; ECI fixed, no new-model residual added',
  },
];
