// Reproduce with scripts/refit-eci-without-metr.py; see docs/aeci-follow-up.md.
export default {
  "sourceUrl": "https://epoch.ai/data/processed_data_for_eci.csv",
  "inputSha256": "42e7fc2c369e6725eaaa34d74517acc09835b3f03f9262912998c812c2148ecd",
  "eciRepository": "https://github.com/epoch-research/eci-public",
  "eciCommit": "e937446cd8ac0e910ea578516b1cab2b00c06d25",
  "observationCount": 2842,
  "removedMetrObservations": 36,
  "models": 267,
  "benchmarksBefore": 59,
  "benchmarksAfter": 58,
  "bootstrapSamples": 0,
  "note": "Local full IRT refits, using official defaults; this is a sensitivity calculation, not an official alternate Epoch leaderboard or an independently validated horizon forecast. Both model and benchmark parameters are refitted after removing METR.",
  "astraFullEci": 169.22898743420055,
  "astraWithoutMetrEci": 169.2305978862443,
  "calibration": [
    {
      "id": "claude_3_5_sonnet_20240620_inspect",
      "label": "Claude 3.5 Sonnet",
      "releaseDate": "2024-06-20",
      "eci": 130.0,
      "hours": 0.027862616666666666,
      "fullEci": 130.0,
      "withoutMetrEci": 130.0
    },
    {
      "id": "claude_3_5_sonnet_20241022_inspect",
      "label": "Claude 3.5 Sonnet (October 2024)",
      "releaseDate": "2024-10-22",
      "eci": 133.57,
      "hours": 0.04326128333333333,
      "fullEci": 133.56761972262274,
      "withoutMetrEci": 133.5738079711495
    },
    {
      "id": "claude_3_7_sonnet_inspect",
      "label": "Claude 3.7 Sonnet",
      "releaseDate": "2025-02-24",
      "eci": 141.19,
      "hours": 0.20152983333333332,
      "fullEci": 141.19440382141653,
      "withoutMetrEci": 141.15414114701747
    },
    {
      "id": "claude_3_opus_inspect",
      "label": "Claude 3 Opus",
      "releaseDate": "2024-03-04",
      "eci": 126.9,
      "hours": 0.01064955,
      "fullEci": 126.90328439574876,
      "withoutMetrEci": 127.11282861099329
    },
    {
      "id": "claude_4_1_opus_inspect",
      "label": "Claude Opus 4.1",
      "releaseDate": "2025-08-05",
      "eci": 144.14,
      "hours": 0.39092935,
      "fullEci": 144.14344730110727,
      "withoutMetrEci": 144.04896679735458
    },
    {
      "id": "claude_4_opus_inspect",
      "label": "Claude Opus 4",
      "releaseDate": "2025-05-22",
      "eci": 142.7,
      "hours": 0.3404958666666667,
      "fullEci": 142.70482447502116,
      "withoutMetrEci": 142.64105021165034
    },
    {
      "id": "claude_opus_4_5_inspect",
      "label": "Claude Opus 4.5",
      "releaseDate": "2025-11-24",
      "eci": 150.08,
      "hours": 0.8238430666666667,
      "fullEci": 150.0837326834052,
      "withoutMetrEci": 150.04584421166842
    },
    {
      "id": "claude_opus_4_6_inspect",
      "label": "Claude Opus 4.6",
      "releaseDate": "2026-02-05",
      "eci": 155.25,
      "hours": 1.16457645,
      "fullEci": 155.24600494289663,
      "withoutMetrEci": 155.23479340749157
    },
    {
      "id": "gpt_5_3_codex",
      "label": "GPT-5.3 Codex",
      "releaseDate": "2026-02-05",
      "eci": 156.4,
      "hours": 0.91232345,
      "fullEci": 156.40323214344824,
      "withoutMetrEci": 156.60049752537037
    },
    {
      "id": "gemini_3_pro",
      "label": "Gemini 3 Pro",
      "releaseDate": "2025-11-18",
      "eci": 152.94,
      "hours": 0.9023808166666666,
      "fullEci": 152.9354696278632,
      "withoutMetrEci": 152.94691269573934
    },
    {
      "id": "gemini_3_1_pro",
      "label": "Gemini 3.1 Pro",
      "releaseDate": "2026-02-19",
      "eci": 154.9,
      "hours": 1.4966917166666667,
      "fullEci": 154.9049575090181,
      "withoutMetrEci": 154.90193525655502
    },
    {
      "id": "gpt_4",
      "label": "GPT-4 (Mar 2023)",
      "releaseDate": "2023-03-14",
      "eci": 125.88,
      "hours": 0.014826016666666667,
      "fullEci": 125.88077088485318,
      "withoutMetrEci": 125.6553276696648
    },
    {
      "id": "gpt_4_1106_inspect",
      "label": "GPT-4 Turbo (Nov 2023)",
      "releaseDate": "2023-11-06",
      "eci": 126.46,
      "hours": 0.013050533333333333,
      "fullEci": 126.45541845323068,
      "withoutMetrEci": 126.44662950046823
    },
    {
      "id": "gpt_4_turbo_inspect",
      "label": "GPT-4 Turbo (Apr 2024)",
      "releaseDate": "2024-04-09",
      "eci": 127.25,
      "hours": 0.01546555,
      "fullEci": 127.24702783923527,
      "withoutMetrEci": 127.22320134934772
    },
    {
      "id": "gpt_4o_inspect",
      "label": "GPT-4o (May 2024)",
      "releaseDate": "2024-05-13",
      "eci": 128.98,
      "hours": 0.021116816666666666,
      "fullEci": 128.97667032535742,
      "withoutMetrEci": 129.0047061323875
    },
    {
      "id": "gpt_5_2",
      "label": "GPT-5.2",
      "releaseDate": "2025-12-11",
      "eci": 153.43,
      "hours": 1.10004415,
      "fullEci": 153.4302991444581,
      "withoutMetrEci": 153.42364850473933
    },
    {
      "id": "gpt_5_2025_08_07_inspect",
      "label": "GPT-5",
      "releaseDate": "2025-08-07",
      "eci": 150.0,
      "hours": 0.6385405166666666,
      "fullEci": 150.0,
      "withoutMetrEci": 150.0
    },
    {
      "id": "gpt_5_4",
      "label": "GPT-5.4",
      "releaseDate": "2026-03-05",
      "eci": 156.77,
      "hours": 0.8979641833333333,
      "fullEci": 156.7699905695493,
      "withoutMetrEci": 156.78791639527978
    },
    {
      "id": "o1_inspect",
      "label": "o1",
      "releaseDate": "2024-12-05",
      "eci": 141.9,
      "hours": 0.11816868333333333,
      "fullEci": 141.8960214729958,
      "withoutMetrEci": 141.99576130527092
    },
    {
      "id": "o1_preview",
      "label": "o1-preview",
      "releaseDate": "2024-09-12",
      "eci": 134.79,
      "hours": 0.07367575,
      "fullEci": 134.7919077233503,
      "withoutMetrEci": 134.8502573419652
    },
    {
      "id": "o3_inspect",
      "label": "o3",
      "releaseDate": "2025-04-16",
      "eci": 146.91,
      "hours": 0.49969338333333335,
      "fullEci": 146.90539552453515,
      "withoutMetrEci": 146.90729178850393
    }
  ]
};
