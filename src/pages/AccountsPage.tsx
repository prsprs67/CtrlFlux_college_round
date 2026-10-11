import React, { useState } from 'react';
import { X, ShieldAlert, UserCheck } from 'lucide-react';

export const AccountsPage: React.FC = () => {
  const [authNoticeModal, setAuthNoticeModal] = useState<{
    open: boolean;
    mode: 'signin' | 'signup' | null;
  }>({
    open: false,
    mode: null,
  });

  const handleOpenAuthNotice = (mode: 'signin' | 'signup') => {
    setAuthNoticeModal({ open: true, mode });
  };

  const handleCloseAuthNotice = () => {
    setAuthNoticeModal({ open: false, mode: null });
  };

  return (
    <div className="space-y-8 py-2 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b-[3px] border-[#050414]">
        <h1 className="font-display text-4xl tracking-wider text-[#FFD60A] uppercase -rotate-1 inline-block">
          DETECTIVE BADGE &amp; PRECINCT ID
        </h1>
        <p className="font-sans text-sm font-bold text-[#3DD6F5] mt-1">
          Local browser storage credentials and investigation rig settings.
        </p>
      </div>

      {/* Detective ID Card */}
      <section className="comic-panel-cyan p-6 space-y-5 bg-comic-stripes">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-[3px] border-[#050414]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#FFD60A] text-[#050414] border-[3px] border-[#050414] shadow-[3px_3px_0_#050414] flex items-center justify-center -rotate-3">
              <UserCheck className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="font-display text-2xl tracking-wider text-[#F5F1E8] uppercase">
                FREELANCE INVESTIGATOR (LOCAL MODE)
              </div>
              <span className="font-mono text-xs font-bold text-[#2EE6A6]">
                STATUS: STANDALONE BROWSER LOCKER
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenAuthNotice('signin')}
              className="comic-btn px-4 py-2 bg-[#3DD6F5] text-[#050414] font-display text-lg tracking-wider uppercase cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleOpenAuthNotice('signup')}
              className="comic-btn px-4 py-2 bg-[#FFD60A] text-[#050414] font-display text-lg tracking-wider uppercase cursor-pointer"
            >
              Issue New Badge
            </button>
          </div>
        </div>

        <p className="font-sans text-sm text-[#F5F1E8] leading-relaxed">
          Second Opinion runs in standalone detective mode. Your case history and evidence reports are stored inside this browser&apos;s local storage—no external account database is required.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="bg-[#0E0B2E] border-[3px] border-[#050414] p-3.5">
            <div className="text-[#3DD6F5] font-bold uppercase">STORAGE LOCKER</div>
            <div className="text-[#F5F1E8] font-bold mt-1">Browser localStorage</div>
          </div>
          <div className="bg-[#0E0B2E] border-[3px] border-[#050414] p-3.5">
            <div className="text-[#FFD60A] font-bold uppercase">QUOTE CHECKER</div>
            <div className="text-[#F5F1E8] font-bold mt-1">Strict Substring Match</div>
          </div>
          <div className="bg-[#0E0B2E] border-[3px] border-[#050414] p-3.5">
            <div className="text-[#FF2E93] font-bold uppercase">HAZARD RADAR</div>
            <div className="text-[#F5F1E8] font-bold mt-1">Unsafe &amp; Logic Alerts ON</div>
          </div>
        </div>
      </section>

      {/* Modal Notice */}
      {authNoticeModal.open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050414]/80"
        >
          <div className="w-full max-w-md comic-panel-yellow p-6 space-y-4 relative">
            <button
              type="button"
              onClick={handleCloseAuthNotice}
              className="comic-btn absolute top-4 right-4 p-1.5 bg-[#FF3B3B] text-[#F5F1E8] cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFD60A] text-[#050414] border-2 border-[#050414] font-display text-lg uppercase -rotate-1">
              <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
              <span>PRECINCT NOTICE</span>
            </div>

            <h3 className="font-display text-2xl tracking-wider text-[#F5F1E8] uppercase">
              {authNoticeModal.mode === 'signin'
                ? 'CLOUD SIGN-IN NOT CONNECTED'
                : 'BADGE REGISTRATION NOT CONNECTED'}
            </h3>

            <p className="font-sans text-sm text-[#F5F1E8]/90 leading-relaxed">
              Cloud accounts aren&apos;t hooked up in this build. Every case file you run is automatically saved right inside this browser&apos;s evidence locker.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleCloseAuthNotice}
                className="comic-btn px-5 py-2 bg-[#FFD60A] text-[#050414] font-display text-lg tracking-wider uppercase cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
