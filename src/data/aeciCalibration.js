// AECI is a separate scale, and every refit moves it: Opus 5.5 is 169.36 on the fit in its own
// September system card and 174.56 on the October fit used here. Never pool scores across fits.
// All scores below come from one figure on one fit, so they can be compared with each other.
export default {
  "asOf": "2026-11-05",
  "url": "https://metr.org/blog/2026-11-05-anthropic-ai-rd-acceleration-assessment/",
  "title": "METR, Independent Assessment of AI R&D Acceleration at Anthropic in October 2026, main AECI figure",
  "figureUrl": "https://metr.org/assets/images/ai-rd-acceleration-assessment/aeci-main.png",
  "sha256": "3ebd60290a782ac8be636f9d80b90e4891568933a639670ebcb8daab6c984283",
  "ciLevel": 0.95,
  "digitization": "Marker centers read from the 1880x1561 figure. y ticks at pixel 764 (AECI 160) and 1019 (AECI 140) give AECI = 160 + (764 - y) / 12.75, and x ticks at pixel 358 (2024-07-01) and 1371 (2026-04-01) give the date scale. Checks: Claude 3.5 Sonnet reads 129.96 against its anchor of 130, Model 4 reads 178.67 against METR's stated 178.6, and Opus 5.5 reads 174.67 against the 174.56 in the Haiku 5.5 system card. Treat digitized scores as good to about 0.1 AECI. Interval endpoints are whisker caps read the same way; METR draws them only for frontier snapshots.",
  "horizonPolicy": "Eight same-named models with a published METR p80, including Mythos Preview (early), which METR's figure shows as its own snapshot. Public models plot at their public release date; Model 4 is unreleased and plots at the date METR shows it reaching most Anthropic employees.",
  "models": [
    { "model": "Claude 3 Opus", "aeci": 124.71, "metrId": "claude_3_opus_inspect", "aeciSource": "digitized", "approximate": true },
    { "model": "Claude 3.5 Sonnet", "aeci": 130, "metrId": "claude_3_5_sonnet_20240620_inspect", "aeciSource": "digitized", "approximate": true },
    { "model": "Claude 3.5 Sonnet (October 2024)", "aeci": 133.18, "metrId": "claude_3_5_sonnet_20241022_inspect", "aeciSource": "digitized", "approximate": true },
    { "model": "Claude 3.7 Sonnet", "aeci": 141.73, "metrId": "claude_3_7_sonnet_inspect", "aeciSource": "digitized", "approximate": true },
    { "model": "Claude Opus 4", "aeci": 144.78, "metrId": "claude_4_opus_inspect", "aeciSource": "digitized", "approximate": true },
    { "model": "Claude Sonnet 4.5", "aeci": 147.76, "metrId": null, "aeciSource": "digitized", "approximate": true },
    { "model": "Claude Opus 4.5", "aeci": 152.31, "metrId": "claude_opus_4_5_inspect", "aeciSource": "digitized", "approximate": true },
    { "model": "Claude Opus 4.6", "aeci": 157.25, "metrId": "claude_opus_4_6_inspect", "aeciSource": "digitized", "approximate": true },
    { "model": "Claude Opus 4.7", "aeci": 160.27, "metrId": null, "aeciSource": "digitized", "approximate": true },
    { "model": "Claude Mythos Preview (early)", "aeci": 162.35, "metrId": "claude_mythos_preview_early_inspect", "aeciSource": "digitized", "approximate": true },
    { "model": "Claude Opus 4.8", "aeci": 163.41, "metrId": null, "aeciSource": "digitized", "approximate": true },
    { "model": "Claude Mythos Preview", "aeci": 165.65, "ciLow": 160.0, "ciHigh": 172.7, "metrId": null, "aeciSource": "digitized", "approximate": true, "releaseDate": "2026-04-07" },
    { "model": "Claude Mythos 5", "aeci": 168.63, "ciLow": 162.6, "ciHigh": 177.1, "metrId": null, "aeciSource": "digitized", "approximate": true, "releaseDate": "2026-06-09" },
    { "model": "Claude Opus 5", "aeci": 169.33, "metrId": null, "aeciSource": "digitized", "approximate": true, "releaseDate": "2026-07-24" },
    { "model": "Claude Mythos 5.1", "aeci": 172.51, "metrId": null, "aeciSource": "digitized", "approximate": true, "releaseDate": "2026-09-01" },
    { "model": "Claude Opus 5.5", "aeci": 174.56, "metrId": null, "aeciSource": "reported", "approximate": false, "releaseDate": "2026-09-22" },
    { "model": "Anthropic Model 4 (internal)", "aeci": 178.6, "ciLow": 170.6, "ciHigh": 192.8, "metrId": null, "aeciSource": "reported", "approximate": false, "internal": true, "releaseDate": "2026-09-25" }
  ]
};
