import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'thypreg-cds | 孕期甲狀腺臨床決策支援',
  description: 'Clinical decision support for thyroid dysfunction and iodine nutrition during pregnancy.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen">
        <header className="border-b border-[color:var(--c-border-subtle)] bg-white">
          <div className="mx-auto max-w-[1440px] px-4 h-11 flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[13px] font-semibold tracking-tight">thypreg-cds</span>
              <span className="text-[11px] text-[color:var(--c-text-tertiary)]">
                Thyroid &amp; iodine in pregnancy · clinical decision support
              </span>
            </div>
            <span className="text-[11px] text-[color:var(--c-warning)]">
              Decision support only · not a replacement for clinical judgment
            </span>
          </div>
        </header>
        {children}
        <footer className="border-t border-[color:var(--c-border-subtle)] bg-white mt-8">
          <div className="mx-auto max-w-[1440px] px-4 py-3 text-[11px] text-[color:var(--c-text-tertiary)] flex flex-wrap gap-x-4">
            <span>Source: 童綜合 2026/05 黃君睿 + 10-role panel review</span>
            <span>·</span>
            <span>Backend: OpenAI GPT-5.5</span>
            <span>·</span>
            <a className="underline hover:text-[color:var(--c-text-primary)]" href="https://github.com/zinojeng/thyroid-pregnancy-cds" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
