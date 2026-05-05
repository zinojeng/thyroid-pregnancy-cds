// Clinical validation & flagging logic for thyroid–pregnancy lab values.
// All thresholds match the SKILL.md hard-stops + treatment_thresholds.md cutoffs.

export type FlagLevel = 'critical' | 'warning' | 'info' | 'ok' | 'muted';

export interface FieldFlag {
  level: FlagLevel;
  text: string;
  hint?: string;
}

export type Trimester = 1 | 2 | 3 | null;

export function getTrimester(gaWeeks: string | undefined): Trimester {
  const w = Number(gaWeeks);
  if (!Number.isFinite(w)) return null;
  if (w < 14) return 1;
  if (w < 28) return 2;
  return 3;
}

// Trimester-specific TSH reference (commonly used; if local lab provides
// population-specific RR, those should override). Source: ATA 2017 + Slide 5.
const TSH_REF: Record<NonNullable<Trimester>, [number, number]> = {
  1: [0.1, 4.0],
  2: [0.2, 4.0],
  3: [0.3, 4.0],
};

const FT4_REF: [number, number] = [0.93, 1.7]; // typical assay range; fallback only

const SAFE_NUM = (v: string | undefined): number | null => {
  if (!v) return null;
  // Handle leading "<" or ">" common in TSH suppression reporting
  const cleaned = v.trim().replace(/^[<>]/, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

export function flagTSH(value: string | undefined, gaWeeks?: string): FieldFlag | null {
  if (!value) return null;
  const n = SAFE_NUM(value);
  if (n === null) return { level: 'muted', text: 'unparsable' };
  const t = getTrimester(gaWeeks);
  const [lo, hi] = t ? TSH_REF[t] : [0.4, 4.5];
  const isSuppressed = value.trim().startsWith('<') || n < 0.005;

  if (n > 20) return { level: 'critical', text: `↑↑ TSH > 20`, hint: 'Overt-equivalent — consider LT4 immediately, escalate' };
  if (n > 10) return { level: 'critical', text: `↑↑ > 10`, hint: 'Treat as overt; LT4 indicated regardless of TPOAb' };
  if (n > hi) return { level: 'warning', text: `↑ above T${t ?? '?'} ULN ${hi}`, hint: '需重驗 + 加驗 TPOAb' };
  if (isSuppressed || n < lo) return { level: 'warning', text: `↓ suppressed`, hint: '驗 TRAb / TT3 鑑別 GTT vs Graves' };
  return { level: 'ok', text: `in T${t ?? '?'} range` };
}

export function flagFT4(value: string | undefined, gaWeeks?: string): FieldFlag | null {
  if (!value) return null;
  const n = SAFE_NUM(value);
  if (n === null) return { level: 'muted', text: 'unparsable' };
  const [lo, hi] = FT4_REF;
  const t = getTrimester(gaWeeks);
  // Severe high
  if (n > hi * 2) return { level: 'critical', text: `↑↑ fT4 > 2× ULN`, hint: 'Possible thyroid storm — escalate' };
  if (n > hi) return { level: 'warning', text: `↑ above ULN ${hi}`, hint: t === 1 ? 'GA T1 hCG-driven 也可能；驗 TRAb/TSI' : '需鑑別' };
  if (n < lo) return { level: 'warning', text: `↓ low`, hint: 'Hypothyroxinemia — 評估 LT4 起始或加量' };
  return { level: 'ok', text: 'normal' };
}

export function flagTPOAb(value: string | undefined): FieldFlag | null {
  if (!value) return null;
  const n = SAFE_NUM(value);
  if (n === null) return { level: 'muted', text: 'unparsable' };
  // Typical positive cutoff ~34 IU/mL (assay-specific)
  if (n > 500) return { level: 'warning', text: `+++ high titer`, hint: 'Postpartum thyroiditis 風險高，產後追蹤' };
  if (n > 34) return { level: 'warning', text: `+ positive`, hint: 'Marker of progression; 4-week retest TFT' };
  return { level: 'ok', text: 'negative' };
}

export function flagTRAb(value: string | undefined, gaWeeks?: string): FieldFlag | null {
  if (!value) return null;
  const n = SAFE_NUM(value);
  if (n === null) return { level: 'muted', text: 'unparsable' };
  // Cutoffs vary by assay; using generic 1.75 IU/L pos, ATA hard-stop 5×
  if (n > 5) return { level: 'critical', text: `↑↑ > 5× ULN`, hint: 'Hard-stop: high fetal/neonatal Graves risk — 主治評估' };
  if (n > 3) return { level: 'warning', text: `↑ > 3× ULN`, hint: gaWeeks && Number(gaWeeks) >= 22 ? 'Late trim hard-stop trigger' : '安排 18-22 週 fetal scan' };
  if (n > 1.75) return { level: 'warning', text: `+ positive`, hint: 'Active Graves autoimmunity' };
  return { level: 'ok', text: 'negative' };
}

// ---- Hard-stop pre-flight ----
export interface HardStop {
  trigger: string;
  detail: string;
}

export function detectHardStops(form: any): HardStop[] {
  const stops: HardStop[] = [];
  const tsh = SAFE_NUM(form?.labs?.tsh);
  const ft4 = SAFE_NUM(form?.labs?.ft4);
  const trab = SAFE_NUM(form?.labs?.trab);
  const ga = Number(form?.gaWeeks);
  const symptoms: string[] = form?.symptoms ?? [];
  const exam: string = form?.exam ?? '';

  if (tsh !== null && tsh > 20)
    stops.push({ trigger: 'TSH > 20', detail: 'Severe overt hypothyroidism — 立即 LT4 + 主治評估' });

  if (ft4 !== null && ft4 > 1.7 * 2)
    stops.push({
      trigger: 'fT4 > 2× ULN',
      detail: 'Severe thyrotoxicosis — 評估 thyroid storm；Burch-Wartofsky score',
    });

  if (trab !== null && trab > 5)
    stops.push({
      trigger: 'TRAb > 5× ULN',
      detail: 'High fetal/neonatal Graves risk — fetal scan + neonatal plan',
    });

  if (Number.isFinite(ga) && ga >= 22 && trab !== null && trab > 3)
    stops.push({
      trigger: 'TRAb > 3× ULN at GA ≥ 22',
      detail: '需 fetal goiter / tachycardia / IUGR scan',
    });

  if (
    /goiter|tachycardia|IUGR|fetal/.test(exam) &&
    (form?.history ?? []).some((h: string) => h.includes('Graves'))
  ) {
    stops.push({
      trigger: 'Possible fetal compromise + maternal Graves',
      detail: '請 MFM + Endo 評估',
    });
  }

  if (
    symptoms.includes('Severe N/V (HG)') &&
    symptoms.includes('Dehydration / ketonuria') &&
    (Number(form?.labs?.tsh) > 20 || ft4 !== null && ft4 > 1.7 * 2)
  ) {
    stops.push({ trigger: 'HG + severe biochemical thyrotoxicosis', detail: '排除 mole / multiple gestation' });
  }

  return stops;
}

// ---- Missing-data warnings ----
export interface MissingItem {
  field: string;
  why: string;
}

export function detectMissing(form: any): MissingItem[] {
  const missing: MissingItem[] = [];
  const tsh = SAFE_NUM(form?.labs?.tsh);
  const ft4 = SAFE_NUM(form?.labs?.ft4);
  const tpo = form?.labs?.tpoab;
  const trab = form?.labs?.trab;
  const isGraves = (form?.history ?? []).some((h: string) => h.includes('Graves'));
  const symptomsCount = (form?.symptoms ?? []).length;

  if (!form?.gaWeeks) missing.push({ field: 'GA (weeks)', why: 'Trimester-specific RR 需要' });
  if (tsh === null) missing.push({ field: 'TSH', why: 'Core lab' });
  if (ft4 === null) missing.push({ field: 'fT4', why: 'Differentiates overt vs subclinical' });

  // SCH borderline → TPOAb required
  if (tsh !== null && tsh > 4 && tsh < 10 && !tpo)
    missing.push({ field: 'TPOAb', why: 'SCH 借界—決定治療閾值' });

  // Suspected Graves or known Graves → TRAb required
  if ((isGraves || (tsh !== null && tsh < 0.1)) && !trab)
    missing.push({ field: 'TRAb / TSI', why: 'Differentiates GTT vs Graves; fetal risk stratification' });

  // Iodine question with no behavior history
  const i = form?.iodine ?? {};
  if (!i.iodizedSalt && !i.multivitamin && !i.seaweedFreq && symptomsCount === 0 && tsh !== null && tsh < 4 && tsh > 0.4)
    missing.push({ field: 'Iodine intake (3 questions)', why: 'TFT 正常但碘攝取行為缺—Case 7 type' });

  return missing;
}
