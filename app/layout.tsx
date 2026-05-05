import type { Metadata, Viewport } from 'next';
import './globals.css';
import { EvidenceFooter } from '@/components/EvidenceFooter';

export const metadata: Metadata = {
  title: 'thypreg-cds | 孕期甲狀腺臨床決策支援',
  description: 'Clinical decision support for thyroid dysfunction and iodine nutrition during pregnancy.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'thypreg-cds',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FFFFFF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen">
        <header className="border-b border-[color:var(--c-border-subtle)] bg-white sticky top-0 z-20">
          <div className="mx-auto max-w-[1440px] px-3 sm:px-4 h-11 flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2 sm:gap-3 min-w-0">
              <span className="font-mono text-[13px] font-semibold tracking-tight whitespace-nowrap">thypreg-cds</span>
              <span className="text-[11px] text-[color:var(--c-text-tertiary)] truncate hidden sm:inline">
                Thyroid &amp; iodine in pregnancy · clinical decision support
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-[color:var(--c-warning)] whitespace-nowrap">
              <span className="hidden sm:inline">Decision support only · not a replacement for clinical judgment</span>
              <span className="sm:hidden">CDS · not a replacement</span>
            </span>
          </div>
        </header>
        {children}
        <footer className="border-t border-[color:var(--c-border-subtle)] bg-white mt-8 mb-[80px] lg:mb-0">
          <div className="mx-auto max-w-[1440px] px-4 py-4 text-[11px] text-[color:var(--c-text-tertiary)]">
            <EvidenceFooter />
            <div className="mt-3 pt-3 border-t border-[color:var(--c-border-subtle)] flex flex-wrap gap-x-3 gap-y-1">
              <span>Backend: Gemini 3.1 Flash Lite</span>
              <span className="hidden sm:inline">·</span>
              <a
                className="underline hover:text-[color:var(--c-text-primary)]"
                href="https://github.com/zinojeng/thyroid-pregnancy-cds"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
