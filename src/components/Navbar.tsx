import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { PageId } from '../types';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  reportCount?: number;
  onToggleHistoryDrawer?: () => void;
}

interface NavItem {
  id: PageId;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'new-audit', label: 'Investigation' },
  { id: 'reports', label: 'Case Reports' },
  { id: 'home', label: 'Detective Guide' },
  { id: 'accounts', label: 'Badge & ID' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  reportCount,
  onToggleHistoryDrawer,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (page: PageId) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b-[3px] border-[#050414] bg-[#17134A] bg-comic-stripes sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Tilted app wordmark "SECOND OPINION" with custom SVG magnifying glass + tagline */}
        <button
          type="button"
          onClick={() => handleNavClick('new-audit')}
          className="flex items-center gap-3 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD60A] shrink-0"
        >
          <div className="flex items-center gap-2 -rotate-2 bg-[#FF3B3B] border-[3px] border-[#050414] px-3 py-1 shadow-[3px_3px_0_#050414] group-hover:bg-[#FFD60A] transition-colors">
            {/* Custom SVG Magnifying Glass */}
            <svg
              viewBox="0 0 28 28"
              className="w-5 h-5 shrink-0 text-[#050414]"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="7.5"
                fill="#3DD6F5"
                stroke="#050414"
                strokeWidth="3"
              />
              <path
                d="M9 9.5C10.2 8.3 12 8.1 13.5 8.8"
                stroke="#F5F1E8"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="17.8"
                y1="17.8"
                x2="24.5"
                y2="24.5"
                stroke="#050414"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            <span className="font-display text-2xl sm:text-[26px] tracking-wider text-[#F5F1E8] group-hover:text-[#050414] leading-none whitespace-nowrap">
              SECOND OPINION
            </span>
          </div>

          <span className="hidden lg:inline-block font-sans text-xs font-extrabold uppercase tracking-wider text-[#FFD60A] bg-[#050414] px-2.5 py-1 border-2 border-[#050414] rotate-1 whitespace-nowrap">
            Don&apos;t trust it. Check it.
          </span>
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          className="hidden md:flex items-center gap-5"
          aria-label="Main Navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`font-sans text-xs font-extrabold uppercase tracking-wider px-2 py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD60A] ${
                  isActive
                    ? 'text-[#FFD60A] underline decoration-[3px] underline-offset-4'
                    : 'text-[#F5F1E8] hover:text-[#3DD6F5]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Sticker-styled "History" button on the right */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onToggleHistoryDrawer) {
                onToggleHistoryDrawer();
              } else {
                handleNavClick('history');
              }
            }}
            className="comic-btn rotate-2 inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FFD60A] text-[#050414] font-display text-lg tracking-wider uppercase cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3DD6F5]"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M12 7v5l4 2" />
            </svg>
            <span>History</span>
            {typeof reportCount === 'number' && reportCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-[#FF3B3B] text-[#F5F1E8] border-2 border-[#050414] font-mono text-xs font-bold tabular-nums leading-tight">
                {reportCount}
              </span>
            )}
          </button>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden comic-btn p-2 bg-[#3DD6F5] text-[#050414] cursor-pointer focus-visible:outline-none"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-[3px] border-[#050414] bg-[#17134A] px-4 py-3 space-y-2">
          <div className="text-xs font-sans font-extrabold uppercase tracking-wider text-[#FFD60A] pb-1">
            Don&apos;t trust it. Check it.
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left py-2 px-3 font-sans text-xs font-extrabold uppercase tracking-wider border-2 border-[#050414] cursor-pointer ${
                  isActive
                    ? 'bg-[#FFD60A] text-[#050414] shadow-[2px_2px_0_#050414]'
                    : 'bg-[#0E0B2E] text-[#F5F1E8]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => handleNavClick('history')}
            className="w-full text-left py-2 px-3 font-sans text-xs font-extrabold uppercase tracking-wider border-2 border-[#050414] bg-[#3DD6F5] text-[#050414] shadow-[2px_2px_0_#050414] cursor-pointer"
          >
            Full History Archive ({reportCount || 0})
          </button>
        </div>
      )}
    </header>
  );
};
