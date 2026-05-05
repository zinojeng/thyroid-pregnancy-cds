'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const HISTORY_OPTIONS = [
  '無甲狀腺病史',
  'Known Graves disease',
  'Known Hashimoto / hypothyroidism',
  'Total thyroidectomy',
  'Hemi-thyroidectomy',
  'RAI ablation',
  'Thyroid cancer',
  'Thyroid nodule',
];

const SYMPTOM_OPTIONS = [
  'Palpitation',
  'Weight loss',
  'Weight gain',
  'Tremor',
  'Heat intolerance',
  'Cold intolerance',
  'Fatigue',
  'Constipation',
  'Diarrhea',
  'Severe N/V (HG)',
  'Dehydration / ketonuria',
  'Hair loss',
  'Dry skin',
];

const PRESETS: Record<string, any> = {
  case1: {
    label: 'Case 1 — 早孕 TSH↓ + fT4↑ 無症狀',
    data: {
      age: '32',
      gravidity: '1',
      parity: '0',
      gaWeeks: '7',
      gaDays: '3',
      history: ['無甲狀腺病史'],
      meds: '',
      labs: { tsh: '<0.005', ft4: '2.0' },
      symptoms: [],
      exam: '無 goiter、無 ophthalmopathy',
      iodine: { iodizedSalt: '不確定', multivitamin: '不確定', seaweedFreq: '1' },
    },
  },
  case2: {
    label: 'Case 2 — HG + 生化甲亢',
    data: {
      age: '27',
      gravidity: '1',
      parity: '0',
      gaWeeks: '9',
      gaDays: '1',
      history: ['無甲狀腺病史'],
      meds: '',
      labs: { tsh: '<0.005', ft4: '2.0' },
      symptoms: ['Severe N/V (HG)', 'Weight loss', 'Dehydration / ketonuria'],
      exam: '脫水、體重 ↓ 4 kg over 3 weeks',
      iodine: { iodizedSalt: '不確定', multivitamin: '不確定', seaweedFreq: '0' },
    },
  },
  case3: {
    label: 'Case 3 — Graves on MMI 5 mg',
    data: {
      age: '30',
      gravidity: '1',
      parity: '0',
      gaWeeks: '6',
      gaDays: '5',
      history: ['Known Graves disease'],
      historyDetails: 'Graves × 2 yr',
      meds: 'MMI 5 mg QD',
      labs: { tsh: '0.3', ft4: '1.2' },
      symptoms: [],
      exam: 'diffuse goiter, no ophthalmopathy',
      iodine: { iodizedSalt: 'Yes', multivitamin: '不確定', seaweedFreq: '1' },
    },
  },
  case4: {
    label: 'Case 4 — Total thyroidectomy on LT4 125',
    data: {
      age: '35',
      gravidity: '1',
      parity: '0',
      gaWeeks: '10',
      gaDays: '2',
      history: ['Total thyroidectomy'],
      historyDetails: 'Total thyroidectomy for benign MNG',
      meds: 'LT4 125 µg QD',
      labs: { tsh: '4.0', ft4: '1.0' },
      symptoms: [],
      iodine: { iodizedSalt: 'Yes', multivitamin: '不含 iodine', seaweedFreq: '1' },
    },
  },
  case5: {
    label: 'Case 5 — SCH (TSH 5.2)',
    data: {
      age: '31',
      gravidity: '1',
      parity: '0',
      gaWeeks: '11',
      gaDays: '4',
      history: ['無甲狀腺病史'],
      meds: '',
      labs: { tsh: '5.2', ft4: '1.1' },
      symptoms: [],
      iodine: { iodizedSalt: 'Yes', multivitamin: '不含 iodine', seaweedFreq: '1' },
    },
  },
  case6: {
    label: 'Case 6 — Euthyroid + TPOAb / TgAb 強陽',
    data: {
      age: '30',
      gravidity: '1',
      parity: '0',
      gaWeeks: '10',
      gaDays: '2',
      history: ['無甲狀腺病史'],
      meds: '',
      labs: { tsh: '2.1', ft4: '1.2', tpoab: '250', tgab: '180' },
      symptoms: [],
      iodine: { iodizedSalt: 'Yes', multivitamin: '不含 iodine', seaweedFreq: '2' },
    },
  },
  case7: {
    label: 'Case 7 — TFT 正常 + 無含碘 multivitamin',
    data: {
      age: '29',
      gravidity: '1',
      parity: '0',
      gaWeeks: '14',
      gaDays: '5',
      history: ['無甲狀腺病史'],
      meds: '葉酸 only',
      labs: { tsh: '1.8', ft4: '1.1' },
      symptoms: [],
      iodine: { iodizedSalt: 'No (海鹽)', multivitamin: 'No', seaweedFreq: '0' },
    },
  },
};

export default function Home() {
  const [form, setForm] = useState<any>({
    age: '',
    gravidity: '',
    parity: '',
    gaWeeks: '',
    gaDays: '',
    history: [],
    historyDetails: '',
    meds: '',
    labs: { tsh: '', ft4: '', tt4: '', tt3: '', tpoab: '', tgab: '', trab: '', other: '' },
    symptoms: [],
    exam: '',
    iodine: { iodizedSalt: '', multivitamin: '', seaweedFreq: '' },
    obHistory: '',
    freeText: '',
  });
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');

  const update = (path: string, value: any) => {
    setForm((prev: any) => {
      const next = { ...prev };
      const parts = path.split('.');
      let target = next;
      for (let i = 0; i < parts.length - 1; i++) {
        target[parts[i]] = { ...target[parts[i]] };
        target = target[parts[i]];
      }
      target[parts.at(-1)!] = value;
      return next;
    });
  };

  const toggleArr = (path: string, value: string) => {
    setForm((prev: any) => {
      const arr: string[] = path.split('.').reduce((o, k) => o[k], prev) || [];
      const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
      const out = { ...prev };
      const parts = path.split('.');
      let target = out;
      for (let i = 0; i < parts.length - 1; i++) {
        target[parts[i]] = { ...target[parts[i]] };
        target = target[parts[i]];
      }
      target[parts.at(-1)!] = next;
      return out;
    });
  };

  const loadPreset = (key: string) => {
    setForm((prev: any) => ({ ...prev, ...PRESETS[key].data }));
    setOutput('');
    setError('');
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    setOutput('');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Server error');
      } else {
        setOutput(data.text);
      }
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT: Input form */}
        <section className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-slate-900 mb-2">病人資料輸入</h2>
            <div className="flex flex-wrap gap-2 mb-2">
              {Object.entries(PRESETS).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => loadPreset(k)}
                  className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300"
                >
                  {(v as any).label}
                </button>
              ))}
              <button
                onClick={() => {
                  setForm({
                    age: '', gravidity: '', parity: '', gaWeeks: '', gaDays: '',
                    history: [], historyDetails: '', meds: '',
                    labs: { tsh: '', ft4: '', tt4: '', tt3: '', tpoab: '', tgab: '', trab: '', other: '' },
                    symptoms: [], exam: '',
                    iodine: { iodizedSalt: '', multivitamin: '', seaweedFreq: '' },
                    obHistory: '', freeText: '',
                  });
                  setOutput(''); setError('');
                }}
                className="text-xs px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Demographics */}
          <div className="grid grid-cols-5 gap-2">
            <Field label="Age" value={form.age} onChange={(v) => update('age', v)} placeholder="32" />
            <Field label="G" value={form.gravidity} onChange={(v) => update('gravidity', v)} placeholder="1" />
            <Field label="P" value={form.parity} onChange={(v) => update('parity', v)} placeholder="0" />
            <Field label="GA wk" value={form.gaWeeks} onChange={(v) => update('gaWeeks', v)} placeholder="10" />
            <Field label="GA d" value={form.gaDays} onChange={(v) => update('gaDays', v)} placeholder="2" />
          </div>

          {/* History */}
          <Section title="病史">
            <div className="grid grid-cols-2 gap-1">
              {HISTORY_OPTIONS.map((h) => (
                <Check key={h} label={h} checked={form.history.includes(h)} onChange={() => toggleArr('history', h)} />
              ))}
            </div>
            <Field label="病史補充" value={form.historyDetails} onChange={(v) => update('historyDetails', v)} placeholder="e.g. Graves × 2 yr, total thyroidectomy 2024" />
          </Section>

          {/* Meds */}
          <Section title="目前用藥">
            <textarea
              className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
              rows={2}
              value={form.meds}
              onChange={(e) => update('meds', e.target.value)}
              placeholder="LT4 125 µg QD; MMI 5 mg QD; prenatal vitamin (含碘?); Fe..."
            />
          </Section>

          {/* Labs */}
          <Section title="實驗室">
            <div className="grid grid-cols-2 gap-2">
              <Field label="TSH (mIU/L)" value={form.labs.tsh} onChange={(v) => update('labs.tsh', v)} placeholder="5.2" />
              <Field label="fT4 (ng/dL)" value={form.labs.ft4} onChange={(v) => update('labs.ft4', v)} placeholder="1.1" />
              <Field label="TT4" value={form.labs.tt4} onChange={(v) => update('labs.tt4', v)} placeholder="" />
              <Field label="TT3" value={form.labs.tt3} onChange={(v) => update('labs.tt3', v)} placeholder="" />
              <Field label="TPOAb (IU/mL)" value={form.labs.tpoab} onChange={(v) => update('labs.tpoab', v)} placeholder="" />
              <Field label="TgAb (IU/mL)" value={form.labs.tgab} onChange={(v) => update('labs.tgab', v)} placeholder="" />
              <Field label="TRAb / TSI" value={form.labs.trab} onChange={(v) => update('labs.trab', v)} placeholder="" />
              <Field label="Other" value={form.labs.other} onChange={(v) => update('labs.other', v)} placeholder="UIC, etc." />
            </div>
          </Section>

          {/* Symptoms / exam */}
          <Section title="症狀與身體檢查">
            <div className="grid grid-cols-2 gap-1 mb-2">
              {SYMPTOM_OPTIONS.map((s) => (
                <Check key={s} label={s} checked={form.symptoms.includes(s)} onChange={() => toggleArr('symptoms', s)} />
              ))}
            </div>
            <textarea
              className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
              rows={2}
              value={form.exam}
              onChange={(e) => update('exam', e.target.value)}
              placeholder="goiter / ophthalmopathy / HR / BP / 其他身體檢查"
            />
          </Section>

          {/* Iodine */}
          <Section title="Iodine 攝取（三題篩查）">
            <div className="grid grid-cols-1 gap-2">
              <Field label="家裡用加碘鹽？" value={form.iodine.iodizedSalt} onChange={(v) => update('iodine.iodizedSalt', v)} placeholder="Yes / No / 不確定" />
              <Field label="孕婦維他命含 iodine？" value={form.iodine.multivitamin} onChange={(v) => update('iodine.multivitamin', v)} placeholder="Yes (___ µg) / No / 不確定" />
              <Field label="海帶 / 海苔（次/週）" value={form.iodine.seaweedFreq} onChange={(v) => update('iodine.seaweedFreq', v)} placeholder="0–7" />
            </div>
          </Section>

          {/* OB Hx */}
          <Section title="產科 / 自體免疫病史">
            <textarea
              className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
              rows={2}
              value={form.obHistory}
              onChange={(e) => update('obHistory', e.target.value)}
              placeholder="previous miscarriage, ART/IVF, recurrent implantation failure, GDM, PE, autoimmune Dx..."
            />
          </Section>

          {/* Free text */}
          <Section title="補充說明 / Free text">
            <textarea
              className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
              rows={3}
              value={form.freeText}
              onChange={(e) => update('freeText', e.target.value)}
              placeholder="任何不在表單中的補充資訊..."
            />
          </Section>

          <button
            onClick={submit}
            disabled={loading}
            className="w-full bg-clinical-600 hover:bg-clinical-700 text-white font-medium py-2 rounded disabled:bg-slate-400"
          >
            {loading ? '⏳ 分析中（GPT-5.5 思考中）...' : '🧠 開始分析'}
          </button>
        </section>

        {/* RIGHT: Output */}
        <section className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-3">CDS 建議輸出</h2>
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded px-3 py-2 mb-3">
              ❌ {error}
            </div>
          )}
          {!output && !loading && !error && (
            <div className="text-sm text-slate-500">
              填寫左側資料 → 按「開始分析」<br />
              建議使用上方 Preset 快速試跑（對應投影片 7 個 case）。
            </div>
          )}
          {loading && (
            <div className="text-sm text-slate-500">
              ⏳ 模型正在依 7-section template 生成建議，約需 20–60 秒...
            </div>
          )}
          {output && (
            <div className="markdown-output text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-slate-600 mb-0.5">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-clinical-500"
      />
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-700">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-clinical-600" />
      <span>{label}</span>
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-700 mb-1">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
