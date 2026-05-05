# Thyroid–Pregnancy Clinical Decision Support (CDS)

> 孕期甲狀腺與碘營養臨床決策支援，整合自 2026/05 童綜合 黃君睿《Updates on thyroid dysfunction and iodine nutrition in pregnancy》與 10-role expert panel review。

**🔴 Live demo**: https://thypregcds.zeabur.app

[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/Y14EBR?referralCode=zinojeng&YOUR_REPO=https%3A%2F%2Fgithub.com%2Fzinojeng%2Fthyroid-pregnancy-cds)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fzinojeng%2Fthyroid-pregnancy-cds&env=GEMINI_API_KEY&envDescription=Google%20Gemini%20API%20key%20-%20get%20at%20https://aistudio.google.com/apikey&project-name=thyroid-pregnancy-cds&repository-name=thyroid-pregnancy-cds)

兩種使用方式：

1. **Claude Code Skill** — 在 Claude Code 中直接觸發（描述病人即可）
2. **Web App** — Next.js 表單，給臨床醫師輸入結構化病人資料，後端用 Google Gemini API 呼叫 `gemini-3.1-flash-lite-preview` 並回傳 7-section 結構化建議

---

## ⚠️ Disclaimer

This is **clinical decision support**, not a replacement for clinical judgment. Verify all recommendations against current guidelines, your institutional protocols, and the patient's individual clinical context.

---

## 📁 Repo 結構

```
thyroid-pregnancy-cds/
├── skill/                      # Claude Code Skill 來源
│   ├── SKILL.md                # 觸發詞 + workflow
│   ├── knowledge/              # 4 個背景知識 MD
│   │   ├── physiology.md
│   │   ├── treatment_thresholds.md
│   │   ├── iodine.md
│   │   └── guideline_pivot.md
│   ├── decision_trees/         # 4 個決策樹 MD
│   │   ├── early_thyrotoxicosis.md
│   │   ├── sch_pathway.md
│   │   ├── lt4_dose_adjustment.md
│   │   └── iodine_screening.md
│   └── templates/              # input/output 樣板
├── app/                        # Next.js 15 App Router
│   ├── page.tsx                # 主表單
│   ├── api/analyze/route.ts    # Claude API 呼叫
│   ├── layout.tsx
│   └── globals.css
├── lib/knowledge.ts            # 載入 skill/ 為 system prompt
├── install-skill.sh            # 安裝 skill 到 ~/.claude/skills/
├── package.json
├── .env.example
└── README.md
```

---

## 🎯 1. Claude Code Skill 用法

### 安裝

```bash
./install-skill.sh
```

或手動：

```bash
mkdir -p ~/.claude/skills/thyroid-pregnancy-case
cp -r skill/. ~/.claude/skills/thyroid-pregnancy-case/
```

重啟 Claude Code（或開新 session），skill 會被自動偵測。

### 觸發

在 Claude Code 中描述病人即可，例如：

> 「30 歲 G1P0 GA 11 週，TSH 5.8 fT4 1.0，無症狀，無 thyroid 病史，有用加碘鹽，prenatal vitamin 不知道含碘否」

Claude 會自動載入 skill 並依 7-section template 回答。

### Skill 觸發詞
`孕期甲狀腺` / `pregnancy thyroid` / `孕婦 TSH` / `妊娠甲亢` / `SCH in pregnancy` / `TPOAb pregnancy` / `pregnant LT4 dose` / `iodine pregnancy`

---

## 🌐 2. Web App 用法

### 本機開發

```bash
cp .env.example .env.local
# 編輯 .env.local 填入 GEMINI_API_KEY=...
# 取得位置：https://aistudio.google.com/apikey

npm install
npm run dev
```

開 http://localhost:3000

### 介面
- 左欄：結構化表單（demographics、history、meds、labs、symptoms、iodine 三題、free text）
- 上方有 7 個 preset 按鈕（對應投影片 Case 1–7），點下去自動填入示範資料
- 右欄：Gemini 3.1 Flash Lite 回應的 7-section markdown 輸出

### 7-Section 輸出（每次都遵守）
1. 📋 病例 Summary
2. 🎯 Case Archetype
3. 🧠 對應背景知識
4. 🔍 整合分析（2–3 段連貫敘事）
5. 💊 建議下一步
6. 🗣️ 病人衛教 / SDM 話術（中文，可直接讀）
7. ⚠️ 安全提醒 / Escalate Triggers

### 模型
預設 `gemini-3.1-flash-lite-preview`（最便宜的 Gemini）。可由環境變數 `GEMINI_MODEL` 改用 `gemini-2.5-flash`（更快但稍貴）或 `gemini-2.5-pro`（推理品質最強）。

[Gemini 計價](https://ai.google.dev/gemini-api/docs/pricing?hl=zh-tw) — Flash Lite 是 input/output 都最便宜的 tier，並有免費額度（rate-limited）。

> 💡 也可使用 Gemini 顯式 context caching（[caches.create](https://ai.google.dev/gemini-api/docs/caching)）將 ~30k token knowledge pack cache 起來進一步降本，本版未啟用以保持簡潔。

---

## 🚀 3. 部署到 Zeabur

### 一鍵 deploy

1. 把 repo push 到 GitHub（已完成）
2. 到 [Zeabur](https://zeabur.com)，登入
3. New Project → Deploy from GitHub → 選 `thyroid-pregnancy-cds`
4. Zeabur 會自動偵測 Next.js 並建立 build pipeline
5. 在 Service → Variables 加上：
   - `GEMINI_API_KEY` = `...`（必填，從 https://aistudio.google.com/apikey 取得）
   - `GEMINI_MODEL` = `gemini-3.1-flash-lite-preview`（可選，預設即 Flash Lite）
6. Deploy → 完成

### 為什麼 Zeabur 不需要額外 config
Next.js 15 用 `output: 'standalone'`，Zeabur 的 Node.js 自動 builder 會：
- `npm install`
- `npm run build`
- `node .next/standalone/server.js`

完全不需要 Dockerfile 或 zeabur.json。

### Vercel 替代方案
也可以 deploy 到 Vercel：

```bash
npm i -g vercel
vercel
# 設定 GEMINI_API_KEY 環境變數
vercel --prod
```

---

## 🛠️ 4. 安全與成本

### API 金鑰處理
- `GEMINI_API_KEY` 只存在 server side（`/api/analyze` route）
- **絕不會** 暴露給瀏覽器
- 部署時用 Zeabur / Vercel 的環境變數面板設定

### 預估成本
- 每次 patient analysis 約 30k token system prompt + ~500 token user input + ~2k token output
- Gemini 3.1 Flash Lite 是 Google AI Studio 最便宜的 tier；多數情況下 < USD $0.001 / 次
- 計價詳情：https://ai.google.dev/gemini-api/docs/pricing?hl=zh-tw
- 啟用 context caching 可進一步降本（本版未啟用）

### Hard safety stops
SKILL.md 列出 7 個 hard stop 條件，model 會在這些情況下拒絕直接 recommendation 並要求 escalate to attending：
- Overt thyrotoxicosis 有症狀
- TSH > 20 / overt hypothyroidism
- TRAb 高陽
- Fetal goiter / tachycardia / IUGR with maternal Graves
- 疑似 hydatidiform mole
- Iodine-induced storm / amiodarone
- Active thyroid cancer

---

## 📚 來源 & 引用

### 投影片
童綜合 2026/05 黃君睿《Updates on thyroid dysfunction and iodine nutrition in pregnancy》

### 10-role panel review
1. MFM（母胎醫學）
2. Endo（內分泌甲狀腺）
3. REI（生殖內分泌）
4. PedEndo + Neonatology
5. Iodine epidemiology
6. Pharmacology / Teratology
7. NeuroDevelopment
8. Biostatistics / EBM
9. Implementation science / Health economics
10. Patient-centered care / SDM

### 主要 RCT 與 cohort
- CATS-I/II (Lazarus 2012, Hales 2018/2020)
- NIH SCH trial (Casey 2017)
- TABLET (Dhillon-Smith 2019)
- T4 LIFE (van Dijk 2022)
- Wang JAMA 2017
- Tehran Thyroid and Pregnancy (Nazarpour 2017/2018)
- Korevaar Generation R (JCEM 2018, Lancet D&E 2019)
- 丹麥 cohort (Knøsgaard Eur Thyroid J 2022)
- 中國 cohort (Gao Thyroid 2019)
- 台灣 NAHSIT-PW 2017–2019 + Pan LH BMC PCB 2025

### 指引
- 2017 ATA Guideline (Thyroid 27:315-389)
- 2020 ACOG Practice Bulletin 223
- 2024 ASRM Committee Opinion
- 預測 2026 ATA: "Retest, not risky, do no harm"

---

## 🤝 Contributing

PRs welcome — particularly:
- Additional case archetypes (postpartum thyroiditis, thyroid cancer in pregnancy)
- Localization to other languages
- Tighter validation / unit tests
- EHR integration adapters

---

## License

MIT — see `LICENSE`.
