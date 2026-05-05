import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { loadKnowledgePack } from '@/lib/knowledge';

export const runtime = 'nodejs';
export const maxDuration = 120;

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-5.5';

interface PatientPayload {
  age?: string;
  gravidity?: string;
  parity?: string;
  gaWeeks?: string;
  gaDays?: string;
  history?: string[];
  historyDetails?: string;
  meds?: string;
  labs?: {
    tsh?: string;
    ft4?: string;
    tt4?: string;
    tt3?: string;
    tpoab?: string;
    tgab?: string;
    trab?: string;
    other?: string;
  };
  symptoms?: string[];
  exam?: string;
  iodine?: {
    iodizedSalt?: string;
    multivitamin?: string;
    seaweedFreq?: string;
  };
  obHistory?: string;
  freeText?: string;
}

function formatPatient(p: PatientPayload): string {
  const lines: string[] = [];
  lines.push('## 病人資料');
  if (p.age) lines.push(`- Age: ${p.age} y/o`);
  if (p.gravidity || p.parity) lines.push(`- G${p.gravidity || '?'}P${p.parity || '?'}`);
  if (p.gaWeeks) lines.push(`- GA: ${p.gaWeeks} wk ${p.gaDays || 0} d`);

  if (p.history?.length) lines.push(`- History: ${p.history.join(', ')}`);
  if (p.historyDetails) lines.push(`  Details: ${p.historyDetails}`);

  if (p.meds) lines.push(`- Medications: ${p.meds}`);

  const L = p.labs || {};
  const labParts: string[] = [];
  if (L.tsh) labParts.push(`TSH ${L.tsh} mIU/L`);
  if (L.ft4) labParts.push(`fT4 ${L.ft4} ng/dL`);
  if (L.tt4) labParts.push(`TT4 ${L.tt4}`);
  if (L.tt3) labParts.push(`TT3 ${L.tt3}`);
  if (L.tpoab) labParts.push(`TPOAb ${L.tpoab} IU/mL`);
  if (L.tgab) labParts.push(`TgAb ${L.tgab} IU/mL`);
  if (L.trab) labParts.push(`TRAb/TSI ${L.trab}`);
  if (L.other) labParts.push(L.other);
  if (labParts.length) lines.push(`- Labs: ${labParts.join('; ')}`);

  if (p.symptoms?.length) lines.push(`- Symptoms: ${p.symptoms.join(', ')}`);
  if (p.exam) lines.push(`- Exam: ${p.exam}`);

  const I = p.iodine || {};
  const iodParts: string[] = [];
  if (I.iodizedSalt) iodParts.push(`iodized salt: ${I.iodizedSalt}`);
  if (I.multivitamin) iodParts.push(`prenatal MV w/ iodine: ${I.multivitamin}`);
  if (I.seaweedFreq) iodParts.push(`seaweed: ${I.seaweedFreq}/week`);
  if (iodParts.length) lines.push(`- Iodine intake: ${iodParts.join('; ')}`);

  if (p.obHistory) lines.push(`- OB / autoimmune Hx: ${p.obHistory}`);
  if (p.freeText) lines.push(`\n## 補充說明\n${p.freeText}`);

  return lines.join('\n');
}

const SYSTEM_PROMPT_HEADER = `You are a senior endocrinologist with maternal-fetal medicine experience, providing structured **clinical decision support** to a Taiwanese clinician.

You have access to a curated knowledge pack distilled from the 2026/05 童綜合 talk by 黃君睿 and a 10-role expert panel review (MFM, Endo, REI, PedEndo, Iodine, Pharm, NeuroDev, Stat/EBM, Implementation, SDM).

**RULES — non-negotiable**

1. Always follow the 7-section output template (see templates/output_template.md):
   1) 📋 病例 Summary
   2) 🎯 Case Archetype
   3) 🧠 對應背景知識
   4) 🔍 整合分析（2–3 段連貫敘事，不分角色 bullet）
   5) 💊 建議下一步
   6) 🗣️ 病人衛教 / SDM 話術（中文，可直接讀）
   7) ⚠️ 安全提醒 / Escalate Triggers
   Plus: ❓ Open Questions, and the standard Disclaimer at the end.

2. Use **specific numbers, RCT names, NNT/NNH, trimester references** verbatim from the knowledge pack. Do not paraphrase loosely.

3. If any of the **hard safety stops** in SKILL.md is triggered, lead with a clear 🚨 alert and refuse a definitive recommendation — defer to attending.

4. If critical data is missing (e.g. TPOAb status when SCH borderline; TRAb status when known Graves; iodine intake history when iodine question), **list the missing fields explicitly** under the Summary and adjust the recommendation strength accordingly.

5. Output language: zh-TW with English drug names and journal abbreviations. Match the user's input language style.

6. Never provide a recommendation outside thyroid + pregnancy scope. Defer politely.

7. Always end with the 1-line disclaimer: "本輸出為臨床決策支援工具（CDS），不取代主治醫師判斷。"

**KNOWLEDGE PACK (cite from these files; format ========== filename ==========):**`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured on server.' },
        { status: 500 }
      );
    }

    const payload: PatientPayload = await req.json();
    const knowledgePack = loadKnowledgePack();
    const patientBlock = formatPatient(payload);

    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT_HEADER + '\n' + knowledgePack,
        },
        {
          role: 'user',
          content: `請依下列病人資料，依 7-section template 給結構化建議。\n\n${patientBlock}`,
        },
      ],
      max_completion_tokens: 6000,
    });

    const text = completion.choices?.[0]?.message?.content || '(empty response)';

    return NextResponse.json({
      text,
      usage: completion.usage,
      model: MODEL,
    });
  } catch (err: any) {
    console.error('analyze error', err);
    return NextResponse.json(
      { error: err?.message ?? 'Unknown server error' },
      { status: 500 }
    );
  }
}
