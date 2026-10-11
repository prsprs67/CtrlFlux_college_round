import React from 'react';
import { PageId } from '../types';

interface FooterProps {
  onNavigate: (page: PageId) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t-[3px] border-[#050414] bg-[#17134A] text-[#F5F1E8] py-8 mt-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#050414]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display text-xl tracking-wider text-[#FFD60A] -rotate-1 inline-block">
              SECOND OPINION
            </span>
            <span className="text-xs font-sans font-bold text-[#3DD6F5] uppercase tracking-wider">
              Don&apos;t trust it. Check it.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-sans font-bold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => onNavigate('new-audit')}
              className="text-[#F5F1E8] hover:text-[#FFD60A] transition-colors cursor-pointer"
            >
              Investigation
            </button>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="text-[#F5F1E8] hover:text-[#FFD60A] transition-colors cursor-pointer"
            >
              Case Reports
            </button>
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="text-[#F5F1E8] hover:text-[#FFD60A] transition-colors cursor-pointer"
            >
              History
            </button>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="text-[#F5F1E8] hover:text-[#FFD60A] transition-colors cursor-pointer"
            >
              Detective Guide
            </button>
            <button
              type="button"
              onClick={() => onNavigate('accounts')}
              className="text-[#F5F1E8] hover:text-[#FFD60A] transition-colors cursor-pointer"
            >
              Badge &amp; ID
            </button>
          </div>
        </div>

        <p className="text-xs font-sans text-[#F5F1E8]/80 leading-relaxed max-w-4xl">
          Detective Note: Every claim is cross-checked strictly against the source material you supply, and quotes are verified character-for-character in code. Always verify medical, legal, or financial decisions directly against primary documents.
        </p>
      </div>
    </footer>
  );
};
