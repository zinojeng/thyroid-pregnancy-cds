import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Thyroid–Pregnancy CDS | 孕期甲狀腺臨床決策支援',
  description: 'Clinical decision support for thyroid dysfunction and iodine nutrition during pregnancy.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                🩺 Thyroid–Pregnancy CDS
              </h1>
              <p className="text-xs text-slate-500">
                孕期甲狀腺與碘營養臨床決策支援
              </p>
            </div>
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              ⚠️ Decision support only — not a replacement for clinical judgment
            </span>
          </div>
        </header>
        {children}
        <footer className="border-t border-slate-200 bg-white mt-12">
          <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-500">
            Source: 童綜合 2026/05 黃君睿《Updates on thyroid dysfunction and iodine nutrition in pregnancy》+ 10-role panel review.
            Built with OpenAI GPT-5.5 + Next.js + Tailwind. <a className="underline" href="https://github.com/zinojeng/thyroid-pregnancy-cds" target="_blank" rel="noreferrer">GitHub</a>.
          </div>
        </footer>
      </body>
    </html>
  );
}
