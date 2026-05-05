// Evidence-based references for the CDS footer.
// Sources are real publications; links use DOI (preferred) or PubMed search URL.
// EBM levels per Oxford CEBM 2011 (1A meta-analysis of RCTs, 1B individual RCT,
// 2 cohort, 3 case-control, 4 expert opinion) and GRADE quality (high/moderate/low/very low).

interface Ref {
  cite: string;     // "Author Year Journal vol:page"
  url: string;      // DOI or PubMed
  note?: string;    // optional one-line context
}

interface RefSection {
  title: string;
  level?: string;   // EBM level / GRADE quality
  refs: Ref[];
}

const REFERENCES: RefSection[] = [
  {
    title: 'Guidelines',
    level: 'Level 5 / GRADE Strong–Moderate',
    refs: [
      { cite: 'Alexander EK, et al. 2017 ATA Guideline. Thyroid 2017;27(3):315-389', url: 'https://doi.org/10.1089/thy.2016.0457' },
      { cite: 'ACOG Practice Bulletin No. 223. Obstet Gynecol 2020;135(6):e261-e274', url: 'https://doi.org/10.1097/AOG.0000000000003892' },
      { cite: 'ASRM Practice Committee. Subclinical hypothyroidism in infertile women (2024 update). Fertil Steril', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=ASRM+subclinical+hypothyroidism+infertile+female+2024' },
      { cite: '2023 Korean Thyroid Association (KTA) guideline on thyroid disorders in pregnancy', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Korean+Thyroid+Association+pregnancy+2023' },
    ],
  },
  {
    title: 'Landmark RCTs — SCH treatment',
    level: 'Level 1B (individual RCT) / GRADE High',
    refs: [
      { cite: 'Lazarus JH, et al. CATS-I. NEJM 2012;366(6):493-501', url: 'https://doi.org/10.1056/NEJMoa1106104', note: 'Antenatal screening + LT4; 3-y IQ no diff' },
      { cite: 'Casey BM, et al. NIH SCH Trial. NEJM 2017;376(9):815-825', url: 'https://doi.org/10.1056/NEJMoa1606205', note: '5-y IQ diff 3 pts (NS)' },
      { cite: 'Hales C, et al. CATS-II 9.5-y. JCEM 2018;103(4):1583-1591', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Hales+CATS-II+JCEM+2018' },
      { cite: 'Hales C, et al. CATS-II behavior. JCEM 2020;105(3):e416-e427', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Hales+CATS-II+ADHD+JCEM+2020', note: 'Overtreatment ↔ ADHD/behavior signal' },
    ],
  },
  {
    title: 'TPOAb (+) euthyroid LT4 — three concordant negative RCTs',
    level: 'Level 1A (multiple RCTs) / GRADE High — strong recommendation against',
    refs: [
      { cite: 'Wang H, et al. JAMA 2017;318(22):2190-2198', url: 'https://doi.org/10.1001/jama.2017.18249', note: 'ART/IVF cohort, LT4 25–50 µg, no live-birth ↑' },
      { cite: 'Dhillon-Smith RK, et al. TABLET. NEJM 2019;380(14):1316-1325', url: 'https://doi.org/10.1056/NEJMoa1812537', note: 'n=952, miscarriage/infertility hx' },
      { cite: 'van Dijk MM, et al. T4LIFE. Lancet Diabetes Endocrinol 2022;10(5):322-329', url: 'https://doi.org/10.1016/S2213-8587(22)00045-6', note: 'Recurrent miscarriage' },
    ],
  },
  {
    title: 'IPD meta-analysis & cohorts (associations only)',
    level: 'Level 2 / GRADE Low–Moderate',
    refs: [
      { cite: 'Korevaar TIM, et al. JAMA 2019;322(7):632-641', url: 'https://doi.org/10.1001/jama.2019.10931', note: 'IPD meta-analysis: SCH+TPOAb(+) ↑ PTB' },
      { cite: 'Korevaar TIM, et al. Lancet Diabetes Endocrinol 2016;4(1):35-43', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Korevaar+Generation+R+IQ+thyroid+2016', note: 'Generation R: fT4–IQ U-shape' },
      { cite: 'Knøsgaard L, et al. Eur Thyroid J 2022;11(2):e210055', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Knosgaard+thyroid+pregnancy+repeated+samples+2022', note: 'Danish cohort: ~50% TFT abnormalities normalize' },
      { cite: 'Gao X, et al. Thyroid 2019;29(10):1475-1484', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Gao+thyroid+pregnancy+persistence+Chinese+2019', note: 'Chinese cohort n=42492' },
    ],
  },
  {
    title: 'ATD safety / teratogenicity',
    level: 'Level 2 (registry cohort) / GRADE Moderate',
    refs: [
      { cite: 'Andersen SL, et al. JCEM 2016;101(4):1606-1614', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Andersen+antithyroid+drug+birth+defect+JCEM+2016', note: 'Danish nationwide; PTU 3% vs MMI/CMZ 5%' },
      { cite: 'Seo GH, et al. Ann Intern Med 2018;168(6):405-413', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Seo+antithyroid+pregnancy+Korea+Annals+2018' },
    ],
  },
  {
    title: 'TPOAb (+) SCH — single positive RCT (limited generalizability)',
    level: 'Level 1B / GRADE Low (single-center, open-label, narrow CI)',
    refs: [
      { cite: 'Nazarpour S, et al. Eur J Endocrinol 2017;176(2):253-265', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Nazarpour+Tehran+TPO+pregnancy+2017', note: 'Tehran Thyroid & Pregnancy Study; NNT preterm 5.9' },
      { cite: 'Nazarpour S, et al. JCEM 2018;103(3):926-935', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Nazarpour+TPO-negative+SCH+JCEM+2018' },
    ],
  },
  {
    title: 'Iodine — cohorts & RCT',
    level: 'Level 2 (cohorts) + Level 1B (RCT) / GRADE Moderate',
    refs: [
      { cite: 'Bath SC, et al. ALSPAC. Lancet 2013;382(9889):331-337', url: 'https://doi.org/10.1016/S0140-6736(13)60436-5', note: 'UIC <150 → child verbal IQ ↓ 3–4 pts' },
      { cite: 'Gowachirapant S, et al. Lancet Diabetes Endocrinol 2017;5(11):853-863', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Gowachirapant+iodine+pregnancy+RCT+2017', note: 'Mid-pregnancy iodine RCT — null on 5-y IQ (timing late)' },
      { cite: 'Pan LH, et al. BMC Pregnancy Childbirth 2025;25(1):323', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Pan+Taiwan+pregnancy+thyroid+UIC+2025', note: 'Taiwan trimester-specific cohort (T1/T2/T3 UIC 156/146/170 µg/L)' },
      { cite: 'Chao JCJ, et al. NAHSIT-PW 2017–2019', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Chao+NAHSIT+pregnant+Taiwan+iodine', note: 'Taiwan national pregnancy cohort, median UIC 148 µg/L' },
    ],
  },
];

export function EvidenceFooter() {
  return (
    <details className="group">
      <summary className="cursor-pointer select-none flex items-center gap-2 hover:text-[color:var(--c-text-primary)] list-none">
        <span className="font-semibold">📖 Evidence base · References</span>
        <span className="text-[color:var(--c-text-muted)] group-open:hidden">(click to expand)</span>
        <span className="text-[color:var(--c-text-muted)] hidden group-open:inline">(click to collapse)</span>
      </summary>

      <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
        {REFERENCES.map((sec) => (
          <div key={sec.title}>
            <div className="font-semibold text-[color:var(--c-text-primary)] text-[11px]">{sec.title}</div>
            {sec.level && (
              <div className="text-[10px] text-[color:var(--c-text-muted)] italic mb-1">{sec.level}</div>
            )}
            <ul className="space-y-1">
              {sec.refs.map((r, i) => (
                <li key={i} className="leading-snug">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-[color:var(--c-text-primary)]"
                  >
                    {r.cite}
                  </a>
                  {r.note && (
                    <span className="block text-[color:var(--c-text-muted)] text-[10px]"> — {r.note}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-[color:var(--c-surface-2)] rounded text-[10px] leading-relaxed">
        <strong>EBM 註記</strong>：
        SCH 治療 RCT (CATS-I/II + Casey NIH) timing 多 ≥ 13 週、power 不足以驗證 child IQ；
        TPOAb (+) euthyroid 三 RCT 一致 negative 為 thyroid 領域少見強訊號 (GRADE high)；
        Pan LH 2025 為 Taiwan 在地 trimester reference，遇實驗室 population-/assay-specific RR 應以 lab 為準。
        本 CDS 不引用未經 peer-review 的單中心 case series 或撤稿文獻 (e.g. Abdel Rahman 2010 retracted)。
      </div>
    </details>
  );
}
