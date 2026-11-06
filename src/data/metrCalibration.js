// Frozen source data for the chart audit. See docs/metr-methodology.md and
// docs/november-2026-refresh.md. METR rows are unchanged since 2026-09-07; Epoch jointly refits its
// scores, so every Epoch row below was replaced together from one snapshot.
export default {
  "asOf": "2026-11-05",
  "sources": {
    "metr": {
      "url": "https://metr.org/assets/benchmark_results_1_1.yaml",
      "sha256": "aae31902b0519a4da73e16643915e5e8aca13cd3315c3aac893ce3d6dfe92ad9",
      "benchmark": "METR-Horizon-v1.1",
      "longTasksVersion": "799cc9c4b4483a93fc3445623a49ea1bd74fdeb2",
      "units": "minutes"
    },
    "epoch": {
      "url": "https://epoch.ai/data/benchmarked_models.csv",
      "sha256": "ac6280d25ad9749d2f377a2d8d445e6df05409ce6dfc84511558392a8406fa0f",
      "ciLevel": 0.9
    }
  },
  "matchPolicy": "Explicit model/version joins; Epoch aggregates reasoning settings, so harness and effort are not necessarily matched. Only models released since 2023 with a published p80 and an Epoch ECI enter the descriptive OLS fit. No assumed indices, AECI, or p50 conversions.",
  "excludedFromCalibration": [
    {
      "id": "davinci_002",
      "reason": "No matching Epoch ECI in this snapshot; no substitute version used."
    },
    {
      "id": "gpt2",
      "reason": "No matching Epoch ECI in this snapshot; no substitute version used."
    },
    {
      "id": "gpt_3_5_turbo_instruct",
      "reason": "No matching Epoch ECI in this snapshot; no substitute version used."
    },
    {
      "id": "gpt_5_1_codex_max_inspect",
      "reason": "No matching Epoch ECI in this snapshot; no substitute version used."
    },
    {
      "id": "claude_mythos_preview_early_inspect",
      "reason": "No matching Epoch ECI in this snapshot; no substitute version used."
    },
    {
      "id": "gpt_5_3_codex",
      "reason": "Epoch published no ECI for GPT-5.3 Codex in the 2026-11-05 snapshot; no substitute version used."
    }
  ],
  "measurements": [
    {
      "id": "gpt2",
      "label": "GPT-2",
      "releaseDate": "2019-02-14",
      "p50Minutes": {
        "ci_high": 0.141825,
        "ci_low": 0.009994,
        "estimate": 0.053778
      },
      "p80Minutes": {
        "ci_high": 0.068612,
        "ci_low": 0.001589,
        "estimate": 0.0128
      },
      "epochModel": null
    },
    {
      "id": "davinci_002",
      "label": "GPT-3 (davinci-002)",
      "releaseDate": "2020-05-28",
      "p50Minutes": {
        "ci_high": 0.221209,
        "ci_low": 0.093319,
        "estimate": 0.144057
      },
      "p80Minutes": {
        "ci_high": 0.105813,
        "ci_low": 0.034813,
        "estimate": 0.056238
      },
      "epochModel": null
    },
    {
      "id": "gpt_3_5_turbo_instruct",
      "label": "GPT-3.5 Turbo Instruct",
      "releaseDate": "2022-03-15",
      "p50Minutes": {
        "ci_high": 1.115905,
        "ci_low": 0.255148,
        "estimate": 0.599247
      },
      "p80Minutes": {
        "ci_high": 0.492933,
        "ci_low": 0.141649,
        "estimate": 0.25538
      },
      "epochModel": null
    },
    {
      "id": "gpt_4",
      "label": "GPT-4 (Mar 2023)",
      "releaseDate": "2023-03-14",
      "p50Minutes": {
        "ci_high": 7.995283,
        "ci_low": 1.93292,
        "estimate": 3.987428
      },
      "p80Minutes": {
        "ci_high": 2.523746,
        "ci_low": 0.342984,
        "estimate": 0.889561
      },
      "epochModel": "GPT-4 (Mar 2023)"
    },
    {
      "id": "gpt_4_1106_inspect",
      "label": "GPT-4 Turbo (Nov 2023)",
      "releaseDate": "2023-11-06",
      "p50Minutes": {
        "ci_high": 8.443226,
        "ci_low": 1.866859,
        "estimate": 4.044959
      },
      "p80Minutes": {
        "ci_high": 2.358414,
        "ci_low": 0.276599,
        "estimate": 0.783032
      },
      "epochModel": "GPT-4 Turbo (Nov 2023)"
    },
    {
      "id": "claude_3_opus_inspect",
      "label": "Claude 3 Opus",
      "releaseDate": "2024-03-04",
      "p50Minutes": {
        "ci_high": 8.76484,
        "ci_low": 1.706313,
        "estimate": 3.952262
      },
      "p80Minutes": {
        "ci_high": 2.118276,
        "ci_low": 0.190491,
        "estimate": 0.638973
      },
      "epochModel": "Claude 3 Opus"
    },
    {
      "id": "gpt_4_turbo_inspect",
      "label": "GPT-4 Turbo (Apr 2024)",
      "releaseDate": "2024-04-09",
      "p50Minutes": {
        "ci_high": 6.736613,
        "ci_low": 1.980046,
        "estimate": 3.732787
      },
      "p80Minutes": {
        "ci_high": 2.196806,
        "ci_low": 0.428277,
        "estimate": 0.927933
      },
      "epochModel": "GPT-4 Turbo (Apr 2024)"
    },
    {
      "id": "gpt_4o_inspect",
      "label": "GPT-4o (May 2024)",
      "releaseDate": "2024-05-13",
      "p50Minutes": {
        "ci_high": 12.905741,
        "ci_low": 4.001482,
        "estimate": 6.991195
      },
      "p80Minutes": {
        "ci_high": 3.01517,
        "ci_low": 0.562997,
        "estimate": 1.267009
      },
      "epochModel": "GPT-4o (May 2024)"
    },
    {
      "id": "claude_3_5_sonnet_20240620_inspect",
      "label": "Claude 3.5 Sonnet",
      "releaseDate": "2024-06-20",
      "p50Minutes": {
        "ci_high": 22.384214,
        "ci_low": 5.489734,
        "estimate": 11.395377
      },
      "p80Minutes": {
        "ci_high": 4.573519,
        "ci_low": 0.57927,
        "estimate": 1.671757
      },
      "epochModel": "Claude 3.5 Sonnet"
    },
    {
      "id": "o1_preview",
      "label": "o1-preview",
      "releaseDate": "2024-09-12",
      "p50Minutes": {
        "ci_high": 33.379877,
        "ci_low": 11.716193,
        "estimate": 20.326586
      },
      "p80Minutes": {
        "ci_high": 8.912444,
        "ci_low": 2.012646,
        "estimate": 4.420545
      },
      "epochModel": "o1-preview"
    },
    {
      "id": "claude_3_5_sonnet_20241022_inspect",
      "label": "Claude 3.5 Sonnet (October 2024)",
      "releaseDate": "2024-10-22",
      "p50Minutes": {
        "ci_high": 40.82028,
        "ci_low": 10.144026,
        "estimate": 20.522872
      },
      "p80Minutes": {
        "ci_high": 7.363864,
        "ci_low": 0.89379,
        "estimate": 2.595677
      },
      "epochModel": "Claude 3.5 Sonnet (October 2024)"
    },
    {
      "id": "o1_inspect",
      "label": "o1",
      "releaseDate": "2024-12-05",
      "p50Minutes": {
        "ci_high": 64.95249,
        "ci_low": 21.164512,
        "estimate": 38.831588
      },
      "p80Minutes": {
        "ci_high": 16.640636,
        "ci_low": 3.036033,
        "estimate": 7.090121
      },
      "epochModel": "o1"
    },
    {
      "id": "claude_3_7_sonnet_inspect",
      "label": "Claude 3.7 Sonnet",
      "releaseDate": "2025-02-24",
      "p50Minutes": {
        "ci_high": 104.226017,
        "ci_low": 33.006168,
        "estimate": 60.388937
      },
      "p80Minutes": {
        "ci_high": 28.889879,
        "ci_low": 4.575608,
        "estimate": 12.09179
      },
      "epochModel": "Claude 3.7 Sonnet"
    },
    {
      "id": "o3_inspect",
      "label": "o3",
      "releaseDate": "2025-04-16",
      "p50Minutes": {
        "ci_high": 190.943818,
        "ci_low": 74.615398,
        "estimate": 119.732634
      },
      "p80Minutes": {
        "ci_high": 57.823511,
        "ci_low": 15.127348,
        "estimate": 29.981603
      },
      "epochModel": "o3"
    },
    {
      "id": "claude_4_opus_inspect",
      "label": "Claude Opus 4",
      "releaseDate": "2025-05-22",
      "p50Minutes": {
        "ci_high": 163.454074,
        "ci_low": 59.994073,
        "estimate": 100.366123
      },
      "p80Minutes": {
        "ci_high": 41.937268,
        "ci_low": 8.483125,
        "estimate": 20.429752
      },
      "epochModel": "Claude Opus 4"
    },
    {
      "id": "claude_4_1_opus_inspect",
      "label": "Claude Opus 4.1",
      "releaseDate": "2025-08-05",
      "p50Minutes": {
        "ci_high": 159.451918,
        "ci_low": 59.272391,
        "estimate": 100.472004
      },
      "p80Minutes": {
        "ci_high": 47.785951,
        "ci_low": 10.538456,
        "estimate": 23.455761
      },
      "epochModel": "Claude Opus 4.1"
    },
    {
      "id": "gpt_5_2025_08_07_inspect",
      "label": "GPT-5",
      "releaseDate": "2025-08-07",
      "p50Minutes": {
        "ci_high": 405.551565,
        "ci_low": 112.641357,
        "estimate": 203.012577
      },
      "p80Minutes": {
        "ci_high": 70.093125,
        "ci_low": 19.184874,
        "estimate": 38.312431
      },
      "epochModel": "GPT-5"
    },
    {
      "id": "gemini_3_pro",
      "label": "Gemini 3 Pro",
      "releaseDate": "2025-11-18",
      "p50Minutes": {
        "ci_high": 379.235434,
        "ci_low": 139.565157,
        "estimate": 224.325884
      },
      "p80Minutes": {
        "ci_high": 103.295501,
        "ci_low": 25.650451,
        "estimate": 54.142849
      },
      "epochModel": "Gemini 3 Pro"
    },
    {
      "id": "gpt_5_1_codex_max_inspect",
      "label": "GPT-5.1 Codex Max",
      "releaseDate": "2025-11-19",
      "p50Minutes": {
        "ci_high": 396.206723,
        "ci_low": 134.31077,
        "estimate": 223.714694
      },
      "p80Minutes": {
        "ci_high": 88.365435,
        "ci_low": 27.30204,
        "estimate": 50.632499
      },
      "epochModel": null
    },
    {
      "id": "claude_opus_4_5_inspect",
      "label": "Claude Opus 4.5",
      "releaseDate": "2025-11-24",
      "p50Minutes": {
        "ci_high": 623.704698,
        "ci_low": 161.717714,
        "estimate": 292.994594
      },
      "p80Minutes": {
        "ci_high": 104.641318,
        "ci_low": 20.660485,
        "estimate": 49.430584
      },
      "epochModel": "Claude Opus 4.5"
    },
    {
      "id": "gpt_5_2",
      "label": "GPT-5.2",
      "releaseDate": "2025-12-11",
      "p50Minutes": {
        "ci_high": 815.177445,
        "ci_low": 198.067494,
        "estimate": 352.249302
      },
      "p80Minutes": {
        "ci_high": 131.730719,
        "ci_low": 31.665111,
        "estimate": 66.002649
      },
      "epochModel": "GPT-5.2"
    },
    {
      "id": "claude_opus_4_6_inspect",
      "label": "Claude Opus 4.6",
      "releaseDate": "2026-02-05",
      "p50Minutes": {
        "ci_high": 3633.786163,
        "ci_low": 316.685725,
        "estimate": 718.80683
      },
      "p80Minutes": {
        "ci_high": 170.437873,
        "ci_low": 27.026521,
        "estimate": 69.874587
      },
      "epochModel": "Claude Opus 4.6"
    },
    {
      "id": "gpt_5_3_codex",
      "label": "GPT-5.3 Codex",
      "releaseDate": "2026-02-05",
      "p50Minutes": {
        "ci_high": 816.351994,
        "ci_low": 194.913134,
        "estimate": 349.530732
      },
      "p80Minutes": {
        "ci_high": 122.058963,
        "ci_low": 22.361504,
        "estimate": 54.739407
      }
    },
    {
      "id": "gemini_3_1_pro",
      "label": "Gemini 3.1 Pro",
      "releaseDate": "2026-02-19",
      "p50Minutes": {
        "ci_high": 694.750898,
        "ci_low": 233.50073,
        "estimate": 384.147435
      },
      "p80Minutes": {
        "ci_high": 158.618017,
        "ci_low": 52.025934,
        "estimate": 89.801503
      },
      "epochModel": "Gemini 3.1 Pro"
    },
    {
      "id": "gpt_5_4",
      "label": "GPT-5.4",
      "releaseDate": "2026-03-05",
      "p50Minutes": {
        "ci_high": 768.779526,
        "ci_low": 186.581591,
        "estimate": 341.735276
      },
      "p80Minutes": {
        "ci_high": 108.679232,
        "ci_low": 23.957027,
        "estimate": 53.877851
      },
      "epochModel": "GPT-5.4"
    },
    {
      "id": "claude_mythos_preview_early_inspect",
      "label": "Claude Mythos Preview (early)",
      "releaseDate": "2026-04-07",
      "p50Minutes": {
        "ci_high": 3304.261235,
        "ci_low": 508.876789,
        "estimate": 1044.780145
      },
      "p80Minutes": {
        "ci_high": 398.514614,
        "ci_low": 97.30292,
        "estimate": 185.911829
      },
      "epochModel": null
    }
  ],
  "epoch": [
    {
      "model": "Claude 3.5 Sonnet",
      "eci": 130,
      "ciLow": null,
      "ciHigh": null,
      "ciLevel": 0.9,
      "releaseDate": "2024-06-20"
    },
    {
      "model": "Claude 3.5 Sonnet (October 2024)",
      "eci": 133.42,
      "ciLow": 131.07,
      "ciHigh": 135.62,
      "ciLevel": 0.9,
      "releaseDate": "2024-10-22"
    },
    {
      "model": "Claude 3.7 Sonnet",
      "eci": 140.99,
      "ciLow": 139.32,
      "ciHigh": 142.54,
      "ciLevel": 0.9,
      "releaseDate": "2025-02-24"
    },
    {
      "model": "Claude 3 Opus",
      "eci": 125.63,
      "ciLow": 122.56,
      "ciHigh": 128.36,
      "ciLevel": 0.9,
      "releaseDate": "2024-02-29"
    },
    {
      "model": "Claude Opus 4.1",
      "eci": 144.74,
      "ciLow": 142.89,
      "ciHigh": 146.51,
      "ciLevel": 0.9,
      "releaseDate": "2025-08-05"
    },
    {
      "model": "Claude Opus 4",
      "eci": 142.83,
      "ciLow": 141.2,
      "ciHigh": 144.45,
      "ciLevel": 0.9,
      "releaseDate": "2025-05-22"
    },
    {
      "model": "Claude Opus 4.5",
      "eci": 151.82,
      "ciLow": 150.21,
      "ciHigh": 153.41,
      "ciLevel": 0.9,
      "releaseDate": "2025-11-24"
    },
    {
      "model": "Claude Opus 4.6",
      "eci": 156.3,
      "ciLow": 154.58,
      "ciHigh": 158.15,
      "ciLevel": 0.9,
      "releaseDate": "2026-02-05"
    },
    {
      "model": "Gemini 3 Pro",
      "eci": 152.88,
      "ciLow": 151.35,
      "ciHigh": 154.55,
      "ciLevel": 0.9,
      "releaseDate": "2025-11-18"
    },
    {
      "model": "Gemini 3.1 Pro",
      "eci": 156.24,
      "ciLow": 154.57,
      "ciHigh": 158.09,
      "ciLevel": 0.9,
      "releaseDate": "2026-02-19"
    },
    {
      "model": "GPT-4 (Mar 2023)",
      "eci": 121.87,
      "ciLow": 118.02,
      "ciHigh": 125.22,
      "ciLevel": 0.9,
      "releaseDate": "2023-03-14"
    },
    {
      "model": "GPT-4 Turbo (Nov 2023)",
      "eci": 124.85,
      "ciLow": 121.59,
      "ciHigh": 127.85,
      "ciLevel": 0.9,
      "releaseDate": "2024-01-25"
    },
    {
      "model": "GPT-4 Turbo (Apr 2024)",
      "eci": 125.84,
      "ciLow": 122.67,
      "ciHigh": 128.65,
      "ciLevel": 0.9,
      "releaseDate": "2024-04-09"
    },
    {
      "model": "GPT-4o (May 2024)",
      "eci": 128.23,
      "ciLow": 125.49,
      "ciHigh": 130.76,
      "ciLevel": 0.9,
      "releaseDate": "2024-05-13"
    },
    {
      "model": "GPT-5.2",
      "eci": 154.42,
      "ciLow": 152.84,
      "ciHigh": 156.15,
      "ciLevel": 0.9,
      "releaseDate": "2025-12-11"
    },
    {
      "model": "GPT-5",
      "eci": 150,
      "ciLow": null,
      "ciHigh": null,
      "ciLevel": 0.9,
      "releaseDate": "2025-08-07"
    },
    {
      "model": "GPT-5.4",
      "eci": 157.82,
      "ciLow": 155.98,
      "ciHigh": 159.87,
      "ciLevel": 0.9,
      "releaseDate": "2026-03-05"
    },
    {
      "model": "o1",
      "eci": 141.16,
      "ciLow": 139.47,
      "ciHigh": 142.81,
      "ciLevel": 0.9,
      "releaseDate": "2024-12-17"
    },
    {
      "model": "o1-preview",
      "eci": 133.86,
      "ciLow": 131.25,
      "ciHigh": 136.25,
      "ciLevel": 0.9,
      "releaseDate": "2024-09-12"
    },
    {
      "model": "o3",
      "eci": 146.99,
      "ciLow": 145.55,
      "ciHigh": 148.5,
      "ciLevel": 0.9,
      "releaseDate": "2025-04-16"
    },
    {
      "model": "GPT-5.4 Pro",
      "eci": 160.21,
      "ciLow": 157.71,
      "ciHigh": 162.95,
      "ciLevel": 0.9,
      "releaseDate": "2026-03-05"
    },
    {
      "model": "Claude Opus 5",
      "eci": 164.45,
      "ciLow": 162,
      "ciHigh": 167.17,
      "ciLevel": 0.9,
      "releaseDate": "2026-07-24"
    },
    {
      "model": "GPT-5.6 Sol",
      "eci": 162.99,
      "ciLow": 160.72,
      "ciHigh": 165.46,
      "ciLevel": 0.9,
      "releaseDate": "2026-07-09"
    },
    {
      "model": "GPT-6 Astra",
      "eci": 169.07,
      "ciLow": 166.16,
      "ciHigh": 172.28,
      "ciLevel": 0.9,
      "releaseDate": "2026-09-03"
    },
    {
      "model": "Claude Opus 5.5",
      "eci": 168.36,
      "ciLow": 165.54,
      "ciHigh": 171.51,
      "ciLevel": 0.9,
      "releaseDate": "2026-09-22"
    },
    {
      "model": "Gemini 4 Argon",
      "eci": 166.45,
      "ciLow": 163.83,
      "ciHigh": 169.38,
      "ciLevel": 0.9,
      "releaseDate": "2026-09-30"
    },
    {
      "model": "DeepSeek V4.1 Flash 1017",
      "eci": 159.31,
      "ciLow": 157.04,
      "ciHigh": 161.78,
      "ciLevel": 0.9,
      "releaseDate": "2026-10-17"
    }
  ]
};
