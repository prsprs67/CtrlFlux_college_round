import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  FolderOpen,
  ArrowRight,
} from 'lucide-react';
import { PageId } from '../types';

interface HomePageProps {
  onNavigate: (page: PageId) => void;
  onTryExample?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onTryExample }) => {
  return (
    <div className="space-y-10 py-4">
      {/* Comic Detective Briefing Panel */}
      <section className="comic-panel-yellow p-6 sm:p-10 bg-comic-stripes relative">
        <div className="max-w-3xl space-y-5">
          <div className="inline-block bg-[#3DD6F5] text-[#050414] border-[3px] border-[#050414] px-3 py-1 font-display text-lg tracking-wider uppercase -rotate-1 shadow-[3px_3px_0_#050414]">
            CASE BRIEFING // FACT-CHECK DETECTIVE
          </div>

          <h1 className="font-display text-4xl sm:text-6xl tracking-wider text-[#F5F1E8] leading-[1.05] uppercase">
            THE AI&apos;S ANSWER IS THE SUSPECT.{' '}
            <span className="text-[#FFD60A] underline decoration-[#FF3B3B] decoration-4 underline-offset-4">
              INTERROGATE IT.
            </span>
          </h1>

          <p className="font-sans text-base sm:text-lg text-[#F5F1E8] leading-relaxed max-w-2xl">
            AI assistants love to sound confident even when they invent numbers, twist rules, or hand out risky advice. Drop in your source document and the AI&apos;s answer to break every statement into an evidence tag and stamp it against the facts.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('new-audit')}
              className="comic-btn inline-flex items-center gap-2.5 px-6 py-3 bg-[#FFD60A] text-[#050414] font-display text-2xl tracking-wider uppercase cursor-pointer"
            >
              <span>Check answer</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>

            {onTryExample && (
              <button
                type="button"
                onClick={onTryExample}
                className="comic-btn -rotate-1 inline-flex items-center gap-2 px-5 py-3 bg-[#3DD6F5] text-[#050414] font-display text-xl tracking-wider uppercase cursor-pointer"
              >
                <FolderOpen className="w-5 h-5 stroke-[2.5]" />
                <span>Try a case file</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="comic-btn inline-flex items-center gap-2 px-4 py-3 bg-[#17134A] text-[#F5F1E8] hover:bg-[#2EE6A6] hover:text-[#050414] font-sans text-xs font-extrabold uppercase tracking-wider cursor-pointer"
            >
              <span>Open Case Reports</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3-Panel Comic Strip: How the Investigation Works */}
      <section className="space-y-4">
        <div className="inline-block bg-[#050414] border-[3px] border-[#050414] px-4 py-1.5 -rotate-1 shadow-[3px_3px_0_#FFD60A]">
          <h2 className="font-display text-2xl tracking-wider text-[#FFD60A] uppercase">
            HOW THE INVESTIGATION WORKS
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="comic-panel-cyan p-5 space-y-3 -rotate-[0.5deg] comic-card-hover">
            <div className="inline-block px-3 py-0.5 bg-[#3DD6F5] text-[#050414] border-2 border-[#050414] font-display text-xl">
              PANEL 01
            </div>
            <h3 className="font-display text-2xl tracking-wide text-[#F5F1E8] uppercase">
              PIN UP THE SOURCE
            </h3>
            <p className="font-sans text-sm text-[#F5F1E8]/90 leading-relaxed">
              Paste the official document, policy, or a web link in Panel 1. That becomes the only ground truth allowed in the room.
            </p>
          </div>

          <div className="comic-panel-yellow p-5 space-y-3 rotate-[0.5deg] comic-card-hover">
            <div className="inline-block px-3 py-0.5 bg-[#FFD60A] text-[#050414] border-2 border-[#050414] font-display text-xl">
              PANEL 02
            </div>
            <h3 className="font-display text-2xl tracking-wide text-[#F5F1E8] uppercase">
              SWIPE &amp; ISOLATE CLAIMS
            </h3>
            <p className="font-sans text-sm text-[#F5F1E8]/90 leading-relaxed">
              We split the AI&apos;s answer into individual atomic claims and cross-check each one against the source text—no outside guessing.
            </p>
          </div>

          <div className="comic-panel-mint p-5 space-y-3 -rotate-[0.5deg] comic-card-hover">
            <div className="inline-block px-3 py-0.5 bg-[#2EE6A6] text-[#050414] border-2 border-[#050414] font-display text-xl">
              PANEL 03
            </div>
            <h3 className="font-display text-2xl tracking-wide text-[#F5F1E8] uppercase">
              VERIFY EVERY QUOTE IN CODE
            </h3>
            <p className="font-sans text-sm text-[#F5F1E8]/90 leading-relaxed">
              Pure code checks that every evidence quote actually exists character-for-character inside your source before stamping the verdict.
            </p>
          </div>
        </div>
      </section>

      {/* Detective Stamp Guide */}
      <section className="comic-panel p-6 space-y-4">
        <h2 className="font-display text-2xl tracking-wider text-[#3DD6F5] uppercase">
          EVIDENCE STAMP KEY
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-[#0E0B2E] border-[3px] border-[#050414] p-3.5 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#2EE6A6] text-[#050414] border-2 border-[#050414] font-display text-base uppercase -rotate-2">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>CORRECT</span>
            </span>
            <p className="font-sans text-xs text-[#F5F1E8]/90">
              Backed directly by the source text or an accurate paraphrase.
            </p>
          </div>

          <div className="bg-[#0E0B2E] border-[3px] border-[#050414] p-3.5 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#FF3B3B] text-[#F5F1E8] border-2 border-[#050414] font-display text-base uppercase rotate-2">
              <XCircle className="w-4 h-4 stroke-[2.5]" />
              <span>WRONG</span>
            </span>
            <p className="font-sans text-xs text-[#F5F1E8]/90">
              Directly contradicts the source numbers, facts, or rules.
            </p>
          </div>

          <div className="bg-[#0E0B2E] border-[3px] border-[#050414] p-3.5 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#FFD60A] text-[#050414] border-2 border-[#050414] font-display text-base uppercase -rotate-1">
              <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
              <span>NOT IN SOURCE</span>
            </span>
            <p className="font-sans text-xs text-[#F5F1E8]/90">
              Never mentioned in the source. Unverified alibi.
            </p>
          </div>

          <div className="bg-[#0E0B2E] border-[3px] border-[#050414] p-3.5 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#3DD6F5] text-[#050414] border-2 border-[#050414] font-display text-base uppercase rotate-1">
              <HelpCircle className="w-4 h-4 stroke-[2.5]" />
              <span>UNCLEAR</span>
            </span>
            <p className="font-sans text-xs text-[#F5F1E8]/90">
              Too vague or ambiguous to prove or disprove from the text.
            </p>
          </div>

          <div className="bg-[#0E0B2E] border-[3px] border-[#050414] p-3.5 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#FF2E93] text-[#050414] border-2 border-[#050414] font-display text-base uppercase -rotate-2">
              <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
              <span>UNSAFE ADVICE</span>
            </span>
            <p className="font-sans text-xs text-[#F5F1E8]/90">
              Flags high-risk dosage, legal, or safety instructions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
