// AECI is a separate scale. Historical scores below are approximate figure readings.
export default {
  "asOf": "2026-09-07",
  "url": "https://www-cdn.anthropic.com/b514064af1408018e64b1ad24e7d5e75850b4ffd/Claude%20Opus%205%20System%20Card.pdf",
  "title": "Claude Opus 5 System Card, sections 2.3.3, Figure 2.3.3.A",
  "pages": [
    29,
    30
  ],
  "sha256": "897768f0f6f1724f3109279ab3f6458c9fbf496b56d5d2be14cab3a4f91ca472",
  "ciLevel": 0.95,
  "digitization": "Historical scores read from the single July 24 card snapshot, Figure 2.3.3.A; extracted 2000x1500 image. Grid y=1154.5 at AECI 130 and y=364.5 at AECI 170; circle centers converted linearly and rounded to 0.1. Opus 5 and Mythos 5 central values and intervals are reported in text, not digitized. Historical errors are at least about 0.1 AECI from digitization, in addition to index uncertainty.",
  "bridgePolicy": "All 11 named models with both Epoch ECI and AECI in this card; do not substitute another model or a score from an older AECI fit.",
  "horizonPolicy": "Seven same-named models with published METR p80; Mythos Preview early checkpoint is held out and used only in an explicitly labeled sensitivity variant.",
  "models": [
    {
      "model": "Claude 3 Opus",
      "aeci": 126,
      "eci": 126.9,
      "metrId": "claude_3_opus_inspect",
      "aeciSource": "digitized",
      "approximate": true
    },
    {
      "model": "Claude 3.5 Sonnet",
      "aeci": 130,
      "eci": 130.0,
      "metrId": "claude_3_5_sonnet_20240620_inspect",
      "aeciSource": "digitized",
      "approximate": true
    },
    {
      "model": "Claude 3.5 Sonnet (October 2024)",
      "aeci": 133.4,
      "eci": 133.57,
      "metrId": "claude_3_5_sonnet_20241022_inspect",
      "aeciSource": "digitized",
      "approximate": true
    },
    {
      "model": "Claude 3.7 Sonnet",
      "aeci": 139.6,
      "eci": 141.19,
      "metrId": "claude_3_7_sonnet_inspect",
      "aeciSource": "digitized",
      "approximate": true
    },
    {
      "model": "Claude Opus 4",
      "aeci": 142.1,
      "eci": 142.7,
      "metrId": "claude_4_opus_inspect",
      "aeciSource": "digitized",
      "approximate": true
    },
    {
      "model": "Claude Sonnet 4.5",
      "aeci": 145.9,
      "eci": 146.84,
      "metrId": null,
      "aeciSource": "digitized",
      "approximate": true
    },
    {
      "model": "Claude Opus 4.5",
      "aeci": 148.3,
      "eci": 150.08,
      "metrId": "claude_opus_4_5_inspect",
      "aeciSource": "digitized",
      "approximate": true
    },
    {
      "model": "Claude Opus 4.6",
      "aeci": 152.8,
      "eci": 155.25,
      "metrId": "claude_opus_4_6_inspect",
      "aeciSource": "digitized",
      "approximate": true
    },
    {
      "model": "Claude Opus 4.7",
      "aeci": 155.2,
      "eci": 156.11,
      "metrId": null,
      "aeciSource": "digitized",
      "approximate": true
    },
    {
      "model": "Claude Opus 4.8",
      "aeci": 156.6,
      "eci": 158.24,
      "metrId": null,
      "aeciSource": "digitized",
      "approximate": true
    },
    {
      "model": "Claude Opus 5",
      "aeci": 162.1,
      "eci": 162.33,
      "metrId": null,
      "aeciSource": "reported",
      "approximate": false,
      "ciLow": 158.0,
      "ciHigh": 167.3,
      "releaseDate": "2026-07-24"
    },
    {
      "model": "Claude Mythos Preview",
      "aeci": 159.2,
      "aeciSource": "digitized",
      "approximate": true,
      "releaseDate": "2026-04-07",
      "earlyMetrId": "claude_mythos_preview_early_inspect"
    },
    {
      "model": "Claude Mythos 5",
      "aeci": 161.3,
      "ciLow": 157.3,
      "ciHigh": 165.4,
      "aeciSource": "reported",
      "approximate": false,
      "releaseDate": "2026-06-09"
    }
  ]
};
