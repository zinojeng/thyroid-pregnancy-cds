'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  detectHardStops,
  detectMissing,
  flagFT4,
  flagTPOAb,
  flagTRAb,
  flagTSH,
  type FieldFlag,
} from '@/lib/validation';
import {
  clearDraft,
  deleteSession,
  listSessions,
  loadDraft,
  loadSession,
  saveDraft,
  saveSession,
  summarize,
  type Session,
} from '@/lib/sessions';

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

type AnyForm = ReturnType<typeof emptyForm>;

function emptyForm() {
  return {
    age: '',
    gravidity: '',
    parity: '',
    gaWeeks: '',
    gaDays: '',
    history: [] as string[],
    historyDetails: '',
    meds: '',
    labs: { tsh: '', ft4: '', tt4: '', tt3: '', tpoab: '', tgab: '', trab: '', other: '' },
    symptoms: [] as string[],
    exam: '',
    iodine: { iodizedSalt: '', multivitamin: '', seaweedFreq: '' },
    obHistory: '',
    freeText: '',
  };
}

const PRESETS: Record<string, { label: string; data: Partial<AnyForm> }> = {
  case1: { label: 'C1 早孕 TSH↓ + fT4↑', data: { age: '32', gravidity: '1', parity: '0', gaWeeks: '7', gaDays: '3', history: ['無甲狀腺病史'], labs: { tsh: '<0.005', ft4: '2.0', tt4: '', tt3: '', tpoab: '', tgab: '', trab: '', other: '' }, symptoms: [], exam: '無 goiter, no ophthalmopathy', iodine: { iodizedSalt: '不確定', multivitamin: '不確定', seaweedFreq: '1' } } },
  case2: { label: 'C2 HG + 生化甲亢', data: { age: '27', gravidity: '1', parity: '0', gaWeeks: '9', gaDays: '1', history: ['無甲狀腺病史'], labs: { tsh: '<0.005', ft4: '2.0', tt4: '', tt3: '', tpoab: '', tgab: '', trab: '', other: '' }, symptoms: ['Severe N/V (HG)', 'Weight loss', 'Dehydration / ketonuria'], exam: '脫水, 體重下降 4kg/3wk', iodine: { iodizedSalt: '不確定', multivitamin: '不確定', seaweedFreq: '0' } } },
  case3: { label: 'C3 Graves on MMI 5mg', data: { age: '30', gravidity: '1', parity: '0', gaWeeks: '6', gaDays: '5', history: ['Known Graves disease'], historyDetails: 'Graves × 2 yr', meds: 'MMI 5 mg QD', labs: { tsh: '0.3', ft4: '1.2', tt4: '', tt3: '', tpoab: '', tgab: '', trab: '', other: '' }, symptoms: [], exam: 'diffuse goiter, no ophthalmopathy', iodine: { iodizedSalt: 'Yes', multivitamin: '不確定', seaweedFreq: '1' } } },
  case4: { label: 'C4 Thyroidectomy + LT4', data: { age: '35', gravidity: '1', parity: '0', gaWeeks: '10', gaDays: '2', history: ['Total thyroidectomy'], historyDetails: 'Total thyroidectomy for benign MNG', meds: 'LT4 125 µg QD', labs: { tsh: '4.0', ft4: '1.0', tt4: '', tt3: '', tpoab: '', tgab: '', trab: '', other: '' }, symptoms: [], exam: '', iodine: { iodizedSalt: 'Yes', multivitamin: '不含 iodine', seaweedFreq: '1' } } },
  case5: { label: 'C5 SCH (TSH 5.2)', data: { age: '31', gravidity: '1', parity: '0', gaWeeks: '11', gaDays: '4', history: ['無甲狀腺病史'], labs: { tsh: '5.2', ft4: '1.1', tt4: '', tt3: '', tpoab: '', tgab: '', trab: '', other: '' }, symptoms: [], exam: '', iodine: { iodizedSalt: 'Yes', multivitamin: '不含 iodine', seaweedFreq: '1' } } },
  case6: { label: 'C6 Euthyroid TPOAb+', data: { age: '30', gravidity: '1', parity: '0', gaWeeks: '10', gaDays: '2', history: ['無甲狀腺病史'], labs: { tsh: '2.1', ft4: '1.2', tt4: '', tt3: '', tpoab: '250', tgab: '180', trab: '', other: '' }, symptoms: [], exam: '', iodine: { iodizedSalt: 'Yes', multivitamin: '不含 iodine', seaweedFreq: '2' } } },
  case7: { label: 'C7 Iodine gap', data: { age: '29', gravidity: '1', parity: '0', gaWeeks: '14', gaDays: '5', history: ['無甲狀腺病史'], meds: '葉酸 only', labs: { tsh: '1.8', ft4: '1.1', tt4: '', tt3: '', tpoab: '', tgab: '', trab: '', other: '' }, symptoms: [], exam: '', iodine: { iodizedSalt: 'No (海鹽)', multivitamin: 'No', seaweedFreq: '0' } } },
};

export default function Home() {
  const [form, setForm] = useState<AnyForm>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activePreset, setActivePreset] = useState<string>('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const draftDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load draft on mount
  useEffect(() => {
    (async () => {
      const d = await loadDraft();
      if (d && Object.keys(d).length) setForm({ ...emptyForm(), ...d });
      const s = await listSessions();
      setSessions(s);
    })();
  }, []);

  // Debounced auto-save draft
  useEffect(() => {
    if (draftDebounce.current) clearTimeout(draftDebounce.current);
    draftDebounce.current = setTimeout(() => {
      saveDraft(form).catch(() => {});
    }, 600);
    return () => {
      if (draftDebounce.current) clearTimeout(draftDebounce.current);
    };
  }, [form]);

  const update = (path: string, value: any) => {
    setActivePreset('');
    setForm((prev) => {
      const next: any = { ...prev };
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
    setActivePreset('');
    setForm((prev) => {
      const arr: string[] = path.split('.').reduce((o: any, k) => o[k], prev) || [];
      const updated = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
      const out: any = { ...prev };
      const parts = path.split('.');
      let target = out;
      for (let i = 0; i < parts.length - 1; i++) {
        target[parts[i]] = { ...target[parts[i]] };
        target = target[parts[i]];
      }
      target[parts.at(-1)!] = updated;
      return out;
    });
  };

  const loadPreset = (key: string) => {
    setActivePreset(key);
    setForm({ ...emptyForm(), ...PRESETS[key].data } as AnyForm);
    setOutput('');
    setError('');
  };

  const reset = () => {
    setActivePreset('');
    setForm(emptyForm());
    setOutput('');
    setError('');
    clearDraft().catch(() => {});
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

  const onSaveSession = async () => {
    const label = window.prompt('幫這位病人取個 label（不含真實姓名）', summarize(form)) || '';
    if (!label) return;
    await saveSession(label, form, output || undefined);
    setSessions(await listSessions());
  };

  const onLoadSession = async (id: string) => {
    const s = await loadSession(id);
    if (!s) return;
    setForm({ ...emptyForm(), ...s.form });
    setOutput(s.output || '');
    setError('');
    setActivePreset('');
  };

  const onDeleteSession = async (id: string) => {
    if (!window.confirm('確定刪除此 session？')) return;
    await deleteSession(id);
    setSessions(await listSessions());
  };

  // -------- Validation derived --------
  const flags = useMemo(
    () => ({
      tsh: flagTSH(form.labs.tsh, form.gaWeeks),
      ft4: flagFT4(form.labs.ft4, form.gaWeeks),
      tpoab: flagTPOAb(form.labs.tpoab),
      trab: flagTRAb(form.labs.trab, form.gaWeeks),
    }),
    [form.labs.tsh, form.labs.ft4, form.labs.tpoab, form.labs.trab, form.gaWeeks]
  );

  const hardStops = useMemo(() => detectHardStops(form), [form]);
  const missing = useMemo(() => detectMissing(form), [form]);

  const onLoadAndCloseSheet = async (id: string) => {
    await onLoadSession(id);
    setSheetOpen(false);
  };

  return (
    <main className="mx-auto max-w-[1440px] px-3 sm:px-4 py-3 sm:py-5 pb-[80px] lg:pb-5">
      {/* Hard-stop banner */}
      {hardStops.length > 0 && (
        <div className="mb-3 sm:mb-4 banner critical">
          <span className="font-semibold whitespace-nowrap">🚨 Hard stop</span>
          <div className="flex-1 space-y-1">
            {hardStops.map((s, i) => (
              <div key={i}>
                <strong>{s.trigger}</strong> — {s.detail}
              </div>
            ))}
            <div className="text-xs opacity-80 mt-1">建議直接請主治評估，不應僅依此 CDS 建議行動。</div>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:gap-5 lg:grid-cols-[400px_1fr_280px]">
        {/* LEFT (or top on mobile): Input form */}
        <section className="panel p-3 sm:p-4 space-y-4 sm:space-y-5 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:sticky lg:top-[60px] lg:self-start order-2 lg:order-1">
          {/* Preset selector — horizontal scroll on mobile */}
          <div>
            <div className="section-label">Case presets</div>
            <div className="preset-scroll">
              {Object.entries(PRESETS).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => loadPreset(k)}
                  className={`btn btn-link ${activePreset === k ? 'active' : ''}`}
                >
                  {v.label}
                </button>
              ))}
              <button onClick={reset} className="btn btn-link" style={{ color: 'var(--c-critical)' }}>
                Clear
              </button>
            </div>
          </div>

          {/* Demographics */}
          <div>
            <div className="section-label">Demographics</div>
            <div className="grid grid-cols-5 gap-2">
              <Field label="Age" value={form.age} onChange={(v) => update('age', v)} placeholder="32" />
              <Field label="G" value={form.gravidity} onChange={(v) => update('gravidity', v)} placeholder="1" />
              <Field label="P" value={form.parity} onChange={(v) => update('parity', v)} placeholder="0" />
              <Field label="GA wk" value={form.gaWeeks} onChange={(v) => update('gaWeeks', v)} placeholder="10" tabular />
              <Field label="GA d" value={form.gaDays} onChange={(v) => update('gaDays', v)} placeholder="2" tabular />
            </div>
          </div>

          {/* History */}
          <div>
            <div className="section-label">病史</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2">
              {HISTORY_OPTIONS.map((h) => (
                <Cbx key={h} label={h} checked={form.history.includes(h)} onChange={() => toggleArr('history', h)} />
              ))}
            </div>
            <Field label="病史補充" value={form.historyDetails} onChange={(v) => update('historyDetails', v)} placeholder="e.g. Graves × 2 yr" />
          </div>

          {/* Meds */}
          <div>
            <div className="section-label">目前用藥</div>
            <textarea
              className="input"
              rows={2}
              value={form.meds}
              onChange={(e) => update('meds', e.target.value)}
              placeholder="LT4 125 µg QD; MMI 5 mg QD; prenatal vitamin (含碘?); Fe..."
            />
          </div>

          {/* Labs */}
          <div>
            <div className="section-label">Labs</div>
            <div className="grid grid-cols-2 gap-2">
              <FieldFlagged label="TSH (mIU/L)" value={form.labs.tsh} onChange={(v) => update('labs.tsh', v)} placeholder="5.2" flag={flags.tsh} tabular />
              <FieldFlagged label="fT4 (ng/dL)" value={form.labs.ft4} onChange={(v) => update('labs.ft4', v)} placeholder="1.1" flag={flags.ft4} tabular />
              <Field label="TT4" value={form.labs.tt4} onChange={(v) => update('labs.tt4', v)} placeholder="" tabular />
              <Field label="TT3" value={form.labs.tt3} onChange={(v) => update('labs.tt3', v)} placeholder="" tabular />
              <FieldFlagged label="TPOAb (IU/mL)" value={form.labs.tpoab} onChange={(v) => update('labs.tpoab', v)} placeholder="" flag={flags.tpoab} tabular />
              <Field label="TgAb (IU/mL)" value={form.labs.tgab} onChange={(v) => update('labs.tgab', v)} placeholder="" tabular />
              <FieldFlagged label="TRAb / TSI" value={form.labs.trab} onChange={(v) => update('labs.trab', v)} placeholder="" flag={flags.trab} tabular />
              <Field label="Other" value={form.labs.other} onChange={(v) => update('labs.other', v)} placeholder="UIC, etc." />
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <div className="section-label">症狀 / 身體檢查</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2">
              {SYMPTOM_OPTIONS.map((s) => (
                <Cbx key={s} label={s} checked={form.symptoms.includes(s)} onChange={() => toggleArr('symptoms', s)} />
              ))}
            </div>
            <textarea
              className="input"
              rows={2}
              value={form.exam}
              onChange={(e) => update('exam', e.target.value)}
              placeholder="goiter / ophthalmopathy / HR / BP / 其他"
            />
          </div>

          {/* Iodine */}
          <div>
            <div className="section-label">Iodine 三題篩查</div>
            <div className="space-y-2">
              <Field label="家裡用加碘鹽？" value={form.iodine.iodizedSalt} onChange={(v) => update('iodine.iodizedSalt', v)} placeholder="Yes / No / 不確定" />
              <Field label="孕婦維他命含 iodine？" value={form.iodine.multivitamin} onChange={(v) => update('iodine.multivitamin', v)} placeholder="Yes (___ µg) / No / 不確定" />
              <Field label="海帶 / 海苔 (次/週)" value={form.iodine.seaweedFreq} onChange={(v) => update('iodine.seaweedFreq', v)} placeholder="0–7" tabular />
            </div>
          </div>

          {/* OB Hx */}
          <div>
            <div className="section-label">產科 / 自體免疫</div>
            <textarea
              className="input"
              rows={2}
              value={form.obHistory}
              onChange={(e) => update('obHistory', e.target.value)}
              placeholder="previous miscarriage, ART/IVF, recurrent implantation failure..."
            />
          </div>

          {/* Free text */}
          <div>
            <div className="section-label">補充說明</div>
            <textarea
              className="input"
              rows={3}
              value={form.freeText}
              onChange={(e) => update('freeText', e.target.value)}
              placeholder="任何不在表單中的補充資訊..."
            />
          </div>

          {/* Action bar — desktop only inline; mobile uses fixed bottom bar */}
          <div className="hidden lg:flex gap-2 sticky bottom-0 bg-white pt-2 -mx-4 px-4 border-t border-[color:var(--c-border-subtle)]">
            <button onClick={submit} disabled={loading} className="btn btn-primary flex-1">
              {loading ? '分析中…' : '🧠 開始分析'}
            </button>
            <button onClick={onSaveSession} className="btn btn-ghost" title="Save this case">
              💾 Save
            </button>
          </div>
        </section>

        {/* CENTER (or top on mobile): Output */}
        <section className="panel p-3 sm:p-5 min-h-[200px] lg:min-h-[400px] order-1 lg:order-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold">CDS Recommendation</h2>
            {output && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigator.clipboard.writeText(output)}
                title="Copy markdown"
              >
                📋 Copy
              </button>
            )}
          </div>

          {/* Missing-data chips */}
          {missing.length > 0 && (
            <div className="banner warning mb-3">
              <span className="font-semibold whitespace-nowrap">缺資料</span>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((m, i) => (
                  <span key={i} className="chip warning" title={m.why}>
                    {m.field}
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="banner critical mb-3">
              <span>❌</span>
              <div>{error}</div>
            </div>
          )}

          {!output && !loading && !error && (
            <div className="text-sm text-[color:var(--c-text-tertiary)] py-8 lg:py-12 text-center">
              <span className="lg:hidden">填寫下方資料 → 按底部「開始分析」</span>
              <span className="hidden lg:inline">填寫左側資料 → 按「開始分析」</span>
              <br />
              或點 <span className="chip muted">C1–C7</span> Preset 快速試跑。
            </div>
          )}

          {loading && (
            <div className="text-sm text-[color:var(--c-text-tertiary)] py-8">
              ⏳ Gemini 3.1 Flash Lite 正在依 7-section template 生成建議，約需 10–30 秒…
            </div>
          )}

          {output && (
            <div className="markdown-output">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
            </div>
          )}
        </section>

        {/* RIGHT: Session rail (desktop only) */}
        <aside className="panel p-4 max-h-[calc(100vh-120px)] overflow-y-auto sticky top-[60px] self-start hidden lg:block order-3">
          <SessionList
            sessions={sessions}
            onLoad={onLoadSession}
            onDelete={onDeleteSession}
          />
        </aside>
      </div>

      {/* Mobile bottom action bar */}
      <div className="action-bar-mobile">
        <button onClick={submit} disabled={loading} className="btn btn-primary flex-1">
          {loading ? '分析中…' : '🧠 開始分析'}
        </button>
        <button
          onClick={onSaveSession}
          className="btn btn-ghost"
          aria-label="Save session"
          title="Save this case"
        >
          💾
        </button>
        <button
          onClick={() => setSheetOpen(true)}
          className="btn btn-ghost relative"
          aria-label="Saved sessions"
          title="Saved sessions"
        >
          📁
          {sessions.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-[color:var(--c-action)] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold">
              {sessions.length}
            </span>
          )}
        </button>
      </div>

      {/* Mobile session sheet */}
      {sheetOpen && (
        <>
          <div className="sheet-backdrop lg:hidden" onClick={() => setSheetOpen(false)} />
          <div className="sheet lg:hidden" role="dialog" aria-label="Saved sessions">
            <div className="sheet-handle" />
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-[15px]">Saved sessions</h3>
                <button onClick={() => setSheetOpen(false)} className="text-[color:var(--c-text-tertiary)] text-xl leading-none px-2 py-1" aria-label="Close">
                  ✕
                </button>
              </div>
              <SessionList
                sessions={sessions}
                onLoad={onLoadAndCloseSheet}
                onDelete={onDeleteSession}
              />
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function SessionList({
  sessions,
  onLoad,
  onDelete,
}: {
  sessions: Session[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <div className="section-label">Saved sessions ({sessions.length})</div>
      {sessions.length === 0 && (
        <div className="text-xs text-[color:var(--c-text-tertiary)] py-4">
          還沒有儲存的 session。<br />
          填完表單後點 「💾 Save」可保存。<br /><br />
          <span className="text-[color:var(--c-warning)]">🔒 資料只存於本機瀏覽器 IndexedDB，不上傳。</span>
        </div>
      )}
      <ul className="space-y-1">
        {sessions.map((s) => (
          <li key={s.id} className="border border-[color:var(--c-border-subtle)] rounded p-2 hover:bg-[color:var(--c-surface-1)]">
            <div className="flex items-start gap-2">
              <button onClick={() => onLoad(s.id)} className="flex-1 text-left min-w-0">
                <div className="text-[13px] font-semibold truncate">{s.label}</div>
                <div className="text-[11px] text-[color:var(--c-text-tertiary)] truncate font-mono">{summarize(s.form)}</div>
                <div className="text-[10px] text-[color:var(--c-text-muted)] mt-0.5 tabular">
                  {new Date(s.updatedAt).toLocaleString('zh-TW', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </button>
              <button
                onClick={() => onDelete(s.id)}
                className="text-[color:var(--c-text-muted)] hover:text-[color:var(--c-critical)] text-base px-2 py-1"
                title="Delete"
                aria-label="Delete session"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

// ---------- Subcomponents ----------

function Field({
  label,
  value,
  onChange,
  placeholder,
  tabular,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  tabular?: boolean;
}) {
  return (
    <label className="block">
      <span className="input-label">{label}</span>
      <input
        type="text"
        inputMode={tabular ? 'decimal' : 'text'}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`input ${tabular ? 'tabular' : ''}`}
      />
    </label>
  );
}

function FieldFlagged({
  label,
  value,
  onChange,
  placeholder,
  flag,
  tabular,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  flag: FieldFlag | null;
  tabular?: boolean;
}) {
  const cls =
    flag?.level === 'critical'
      ? 'alert'
      : flag?.level === 'warning'
      ? 'warn'
      : '';
  return (
    <label className="block">
      <span className="input-label flex items-center justify-between gap-2">
        <span>{label}</span>
        {flag && flag.level !== 'muted' && (
          <span className={`chip ${flag.level}`} title={flag.hint || ''}>
            {flag.text}
          </span>
        )}
      </span>
      <input
        type="text"
        inputMode={tabular ? 'decimal' : 'text'}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`input ${tabular ? 'tabular' : ''} ${cls}`}
      />
    </label>
  );
}

function Cbx({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="cbx">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
