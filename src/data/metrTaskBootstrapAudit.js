// Local measurement-sensitivity diagnostic, not an official METR result.
// Reproduce with scripts/bootstrap-metr-uncertainty.py --draws 10000.
export default {
  "method": "Joint family/task/attempt bootstrap; shared task draws across all models",
  "draws": 10000,
  "seed": 739421,
  "nModels": 21,
  "nTasks": 228,
  "nFamilies": 79,
  "source": {
    "sourceUrl": "https://metr.org/assets/task_results_1_1.yaml",
    "sourceSha256": "4f85fbf03cbf8b43af102ff17db6bbb4963b3c98784e90f81fb71a146cf26b07",
    "parsedJsonSha256": "1c65386936f88321090537dfbea4b3f9d887a2d414a761ce5365c3c973319752",
    "referenceCode": "https://github.com/METR/eval-analysis-public",
    "referenceCommit": "52cb829c7a2efb2d659285c4b1768d191d97f8d2",
    "familyMapping": "task_id prefix before /; checked against all available raw task-family assignments; no mismatches.",
    "modelAliases": {
      "GPT-4 0314": "gpt_4",
      "GPT-4 1106 (Inspect)": "gpt_4_1106_inspect",
      "Claude 3 Opus (Inspect)": "claude_3_opus_inspect",
      "GPT-4 Turbo (Inspect)": "gpt_4_turbo_inspect",
      "GPT-4o (Inspect)": "gpt_4o_inspect",
      "Claude 3.5 Sonnet (Old) (Inspect)": "claude_3_5_sonnet_20240620_inspect",
      "o1-preview": "o1_preview",
      "Claude 3.5 Sonnet (New) (Inspect)": "claude_3_5_sonnet_20241022_inspect",
      "o1 (Inspect)": "o1_inspect",
      "Claude 3.7 Sonnet (Inspect)": "claude_3_7_sonnet_inspect",
      "o3 (Inspect)": "o3_inspect",
      "Claude 4 Opus (Inspect)": "claude_4_opus_inspect",
      "Claude 4.1 Opus (Inspect)": "claude_4_1_opus_inspect",
      "GPT-5 (Inspect)": "gpt_5_2025_08_07_inspect",
      "Gemini 3 Pro": "gemini_3_pro",
      "GPT-5.1-Codex-Max (Inspect)": "gpt_5_1_codex_max_inspect",
      "Claude Opus 4.5 (Inspect)": "claude_opus_4_5_inspect",
      "GPT-5.2": "gpt_5_2",
      "GPT-5.3-Codex": "gpt_5_3_codex",
      "Claude Opus 4.6 (Inspect)": "claude_opus_4_6_inspect",
      "Gemini 3.1 Pro": "gemini_3_1_pro",
      "GPT-5.4": "gpt_5_4"
    }
  },
  "maxReconstructionRelativeError": 0.0004456649104309651,
  "indexHeldFixed": 169.23,
  "astraRegressionHours": {
    "low": 5.21576478509879,
    "median": 11.954902503179543,
    "high": 25.491450284208575
  },
  "percentileMass": 0.9,
  "medianPairwiseLogHorizonCorrelation": 0.2995546425408263,
  "limitations": [
    "ECI calibration and target scores held fixed",
    "No new-model prediction residual added",
    "Human durations held fixed",
    "Fixed logistic success curve",
    "Local reconstruction, not official METR bootstrap output"
  ],
  "marginalChecks": [
    {
      "id": "gpt_4",
      "reconstructedHours": 0.014828201218626618,
      "publishedHours": 0.014826016666666667,
      "bootstrap95LowHours": 0.005882542284413324,
      "bootstrap95HighHours": 0.040791892843652096
    },
    {
      "id": "gpt_4_1106_inspect",
      "reconstructedHours": 0.01305358658575275,
      "publishedHours": 0.013050533333333333,
      "bootstrap95LowHours": 0.004655593680598008,
      "bootstrap95HighHours": 0.03827733242823796
    },
    {
      "id": "claude_3_opus_inspect",
      "reconstructedHours": 0.010654296130746884,
      "publishedHours": 0.01064955,
      "bootstrap95LowHours": 0.003340186264494861,
      "bootstrap95HighHours": 0.03124392974515255
    },
    {
      "id": "gpt_4_turbo_inspect",
      "reconstructedHours": 0.01546929820164066,
      "publishedHours": 0.01546555,
      "bootstrap95LowHours": 0.006688996823801418,
      "bootstrap95HighHours": 0.03751021900585525
    },
    {
      "id": "gpt_4o_inspect",
      "reconstructedHours": 0.021119269194111803,
      "publishedHours": 0.021116816666666666,
      "bootstrap95LowHours": 0.009227999949132861,
      "bootstrap95HighHours": 0.04641271732205503
    },
    {
      "id": "claude_3_5_sonnet_20240620_inspect",
      "reconstructedHours": 0.027864300338931232,
      "publishedHours": 0.027862616666666666,
      "bootstrap95LowHours": 0.009514109800316495,
      "bootstrap95HighHours": 0.07843001111437552
    },
    {
      "id": "o1_preview",
      "reconstructedHours": 0.07367827477675568,
      "publishedHours": 0.07367575,
      "bootstrap95LowHours": 0.034349005269913975,
      "bootstrap95HighHours": 0.1565761697509713
    },
    {
      "id": "claude_3_5_sonnet_20241022_inspect",
      "reconstructedHours": 0.0432637350352735,
      "publishedHours": 0.04326128333333333,
      "bootstrap95LowHours": 0.014607811322623036,
      "bootstrap95HighHours": 0.12547438354612298
    },
    {
      "id": "o1_inspect",
      "reconstructedHours": 0.11813017075541553,
      "publishedHours": 0.11816868333333333,
      "bootstrap95LowHours": 0.045662401596076645,
      "bootstrap95HighHours": 0.2821174210130908
    },
    {
      "id": "claude_3_7_sonnet_inspect",
      "reconstructedHours": 0.2015313630206211,
      "publishedHours": 0.20152983333333332,
      "bootstrap95LowHours": 0.07538607956306066,
      "bootstrap95HighHours": 0.481254928427232
    },
    {
      "id": "o3_inspect",
      "reconstructedHours": 0.4996235718380492,
      "publishedHours": 0.49969338333333335,
      "bootstrap95LowHours": 0.24062196913403,
      "bootstrap95HighHours": 0.9560872857547125
    },
    {
      "id": "claude_4_opus_inspect",
      "reconstructedHours": 0.34050699007400703,
      "publishedHours": 0.3404958666666667,
      "bootstrap95LowHours": 0.14366427764893555,
      "bootstrap95HighHours": 0.712557805922247
    },
    {
      "id": "claude_4_1_opus_inspect",
      "reconstructedHours": 0.39092776899771176,
      "publishedHours": 0.39092935,
      "bootstrap95LowHours": 0.1754103217771646,
      "bootstrap95HighHours": 0.8158877133971281
    },
    {
      "id": "gpt_5_2025_08_07_inspect",
      "reconstructedHours": 0.638494509512316,
      "publishedHours": 0.6385405166666666,
      "bootstrap95LowHours": 0.31498322869809037,
      "bootstrap95HighHours": 1.2183823991845029
    },
    {
      "id": "gemini_3_pro",
      "reconstructedHours": 0.9023933671221863,
      "publishedHours": 0.9023808166666666,
      "bootstrap95LowHours": 0.43360350460544295,
      "bootstrap95HighHours": 1.766887157775342
    },
    {
      "id": "claude_opus_4_5_inspect",
      "reconstructedHours": 0.8239111090031781,
      "publishedHours": 0.8238430666666667,
      "bootstrap95LowHours": 0.3643529903887035,
      "bootstrap95HighHours": 1.7656451501181325
    },
    {
      "id": "gpt_5_2",
      "reconstructedHours": 1.100081156657078,
      "publishedHours": 1.10004415,
      "bootstrap95LowHours": 0.5301124594498268,
      "bootstrap95HighHours": 2.2296712089384076
    },
    {
      "id": "claude_opus_4_6_inspect",
      "reconstructedHours": 1.1646220117214747,
      "publishedHours": 1.16457645,
      "bootstrap95LowHours": 0.4513745869338491,
      "bootstrap95HighHours": 2.8798549418861654
    },
    {
      "id": "gpt_5_3_codex",
      "reconstructedHours": 0.912108871741347,
      "publishedHours": 0.91232345,
      "bootstrap95LowHours": 0.38598324047290056,
      "bootstrap95HighHours": 2.0310674455169204
    },
    {
      "id": "gemini_3_1_pro",
      "reconstructedHours": 1.4965916023392987,
      "publishedHours": 1.4966917166666667,
      "bootstrap95LowHours": 0.8633933938960845,
      "bootstrap95HighHours": 2.655044819507952
    },
    {
      "id": "gpt_5_4",
      "reconstructedHours": 0.8978936922321161,
      "publishedHours": 0.8979641833333333,
      "bootstrap95LowHours": 0.4103521437067665,
      "bootstrap95HighHours": 1.8539676378102599
    }
  ]
};
