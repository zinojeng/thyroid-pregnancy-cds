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

// ---- TT4 flag (GA-aware) ----
// Non-pregnant TT4 ULN ~ 11.7 µg/dL.
// 7–16 wk: ULN rises 5%/wk above non-preg ULN (so wk 7 = +5%, wk 8 = +10%, ... wk 16 = +50%).
// >16 wk: ULN = 1.5 × non-preg ULN (~17.6 µg/dL).
// Source: ATA 2017 + slide deck.
const TT4_NONPREG_LO = 5.4;
const TT4_NONPREG_HI = 11.7;

function tt4UpperFor(gaWeeks?: string): number {
  const w = Number(gaWeeks);
  if (!Number.isFinite(w) || w < 7) return TT4_NONPREG_HI;
  if (w >= 16) return TT4_NONPREG_HI * 1.5;
  // 7–15 weeks: +5% per week starting wk 7
  return TT4_NONPREG_HI * (1 + 0.05 * (w - 6));
}

export function flagTT4(value: string | undefined, gaWeeks?: string): FieldFlag | null {
  if (!value) return null;
  const n = SAFE_NUM(value);
  if (n === null) return { level: 'muted', text: 'unparsable' };
  const hi = tt4UpperFor(gaWeeks);
  const lo = TT4_NONPREG_LO; // lower bound stays similar
  if (n > hi * 1.3) return { level: 'critical', text: `↑↑ TT4 high`, hint: 'Severe thyrotoxicosis — escalate' };
  if (n > hi) return { level: 'warning', text: `↑ above ${hi.toFixed(1)}`, hint: 'GA-adjusted ULN exceeded' };
  if (n < lo) return { level: 'warning', text: `↓ low`, hint: 'Maternal hypothyroxinemia' };
  return { level: 'ok', text: 'in range' };
}

// ---- Reference-range hint (display string for UI) ----
export interface RefHint {
  display: string;
  note?: string;
  source: string;
}

export function getRefHint(
  lab: 'tsh' | 'ft4' | 'tt4' | 'tpoab' | 'trab' | 'tt3' | 'tgab',
  gaWeeks?: string
): RefHint | null {
  const t = getTrimester(gaWeeks);
  const w = Number(gaWeeks);

  switch (lab) {
    case 'tsh': {
      if (t === 1) return { display: 'T1 ref 0.1–4.0 mIU/L', source: 'ATA 2017 / slide' };
      if (t === 2) return { display: 'T2 ref 0.2–4.0 mIU/L', source: 'ATA 2017 / slide' };
      if (t === 3) return { display: 'T3 ref 0.3–4.0 mIU/L', source: 'ATA 2017 / slide' };
      return { display: 'Pregnancy 0.1–4.0 mIU/L', source: 'ATA 2017' };
    }
    case 'ft4': {
      const aboveT1 = Number.isFinite(w) && w >= 16;
      return {
        display: 'fT4 ref 0.93–1.7 ng/dL (assay-specific)',
        note: aboveT1 ? '⚠️ fT4 immunoassay 在 >16 wk 不可靠 → 改用 TT4×1.5 ULN' : undefined,
        source: 'assay-specific; 各實驗室 RR',
      };
    }
    case 'tt4': {
      if (!Number.isFinite(w) || w < 7) {
        return { display: 'Non-preg TT4 5.4–11.7 µg/dL', source: 'ATA 2017' };
      }
      if (w >= 16) {
        return {
          display: `>16 wk: ULN ~${(TT4_NONPREG_HI * 1.5).toFixed(1)} µg/dL (×1.5)`,
          source: 'ATA 2017 / slide',
        };
      }
      const pct = Math.round((w - 6) * 5);
      const upper = TT4_NONPREG_HI * (1 + pct / 100);
      return {
        display: `Wk ${w}: ULN ~${upper.toFixed(1)} µg/dL (+${pct}%)`,
        source: 'ATA 2017 / slide',
      };
    }
    case 'tt3':
      return { display: 'Non-preg 80–200 ng/dL; TT3/TT4 >20 → Graves likely', source: 'assay-specific' };
    case 'tpoab':
      return { display: 'Pos > ~34 IU/mL (assay-specific)', source: '各實驗室 cutoff' };
    case 'tgab':
      return { display: 'Pos > ~115 IU/mL (assay-specific)', source: '各實驗室 cutoff' };
    case 'trab':
      return {
        display: 'Pos > ~1.75 IU/L; >3× ULN → fetal scan; >5× ULN → hard-stop',
        source: 'ATA 2017',
      };
  }
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
