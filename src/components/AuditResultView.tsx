import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
} from 'lucide-react';
import { AuditResult, Verdict } from '../types';
import { findExcerptSpan } from '../auditPipeline';

export const VERDICT_STYLES: Record<
  Verdict,
  {
    label: string;
    stampLabel: string;
    bgHex: string;
    textOnBgHex: string;
    highlightClass: string;
    badgeBgClass: string;
    cardShadowClass: string;
    stampRotation: string;
    Icon: React.FC<{ className?: string }>;
  }
> = {
  correct: {
    label: 'Correct',
    stampLabel: 'CORRECT',
    bgHex: '#2EE6A6',
    textOnBgHex: '#050414',
    highlightClass:
      'bg-[#2EE6A6] text-[#050414] font-bold border-b-[3px] border-[#050414] hover:brightness-105',
    badgeBgClass: 'bg-[#2EE6A6] text-[#050414]',
    cardShadowClass: 'shadow-[5px_5px_0_#2EE6A6] hover:shadow-[8px_8px_0_#2EE6A6]',
    stampRotation: '-rotate-3',
    Icon: CheckCircle2,
  },
  wrong: {
    label: 'Wrong',
    stampLabel: 'WRONG',
    bgHex: '#FF3B3B',
    textOnBgHex: '#F5F1E8',
    highlightClass:
      'bg-[#FF3B3B] text-[#F5F1E8] font-bold border-b-[3px] border-[#050414] hover:brightness-110',
    badgeBgClass: 'bg-[#FF3B3B] text-[#F5F1E8]',
    cardShadowClass: 'shadow-[5px_5px_0_#FF3B3B] hover:shadow-[8px_8px_0_#FF3B3B]',
    stampRotation: 'rotate-3',
    Icon: XCircle,
  },
  'not in source': {
    label: 'Not in source',
    stampLabel: 'NOT IN SOURCE',
    bgHex: '#FFD60A',
    textOnBgHex: '#050414',
    highlightClass:
      'bg-[#FFD60A] text-[#050414] font-bold border-b-[3px] border-[#050414] hover:brightness-105',
    badgeBgClass: 'bg-[#FFD60A] text-[#050414]',
    cardShadowClass: 'shadow-[5px_5px_0_#FFD60A] hover:shadow-[8px_8px_0_#FFD60A]',
    stampRotation: '-rotate-2',
    Icon: AlertTriangle,
  },
  unclear: {
    label: 'Unclear',
    stampLabel: 'UNCLEAR',
    bgHex: '#3DD6F5',
    textOnBgHex: '#050414',
    highlightClass:
      'bg-[#3DD6F5] text-[#050414] font-bold border-b-[3px] border-[#050414] hover:brightness-105',
    badgeBgClass: 'bg-[#3DD6F5] text-[#050414]',
    cardShadowClass: 'shadow-[5px_5px_0_#3DD6F5] hover:shadow-[8px_8px_0_#3DD6F5]',
    stampRotation: 'rotate-2',
    Icon: HelpCircle,
  },
};

interface AuditResultViewProps {
  result: AuditResult;
  answer: string;
  source?: string;
  showSourceAccordion?: boolean;
}

export const AuditResultView: React.FC<AuditResultViewProps> = ({
  result,
  answer,
  source,
  showSourceAccordion = true,
}) => {
  const [flashingClaimId, setFlashingClaimId] = useState<string | null>(null);
  const [showFullSource, setShowFullSource] = useState<boolean>(false);
  const [answerViewMode, setAnswerViewMode] = useState<'highlighted' | 'raw'>('highlighted');
  const [copiedState, setCopiedState] = useState<boolean>(false);
  const claimRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const correctCount = result.claims.filter((c) => c.verdict === 'correct').length;
  const totalCount = result.claims.length;

  // Quick count-up animation for the starburst score when result changes
  const [displayCorrect, setDisplayCorrect] = useState<number>(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || correctCount === 0) {
      setDisplayCorrect(correctCount);
      return;
    }

    setDisplayCorrect(0);
    let current = 0;
    const stepMs = Math.max(40, Math.min(110, Math.floor(450 / Math.max(1, correctCount))));
    const timer = window.setInterval(() => {
      current += 1;
      if (current >= correctCount) {
        setDisplayCorrect(correctCount);
        window.clearInterval(timer);
      } else {
        setDisplayCorrect(current);
      }
    }, stepMs);

    return () => window.clearInterval(timer);
  }, [correctCount, result]);

  // Build highlighted segments for the AI's answer using answer_excerpt and attach 1-based claim number
  const highlightedAnswerSegments = useMemo(() => {
    if (!result || !answer) return [];

    const spans: {
      start: number;
      end: number;
      claim: AuditResult['claims'][0];
      claimNumber: number;
    }[] = [];

    result.claims.forEach((claim, idx) => {
      const match = findExcerptSpan(answer, claim.answer_excerpt);
      if (match && match.end > match.start) {
        spans.push({ start: match.start, end: match.end, claim, claimNumber: idx + 1 });
      }
    });

    spans.sort((a, b) => a.start - b.start);

    const segments: {
      text: string;
      claim?: AuditResult['claims'][0];
      claimNumber?: number;
    }[] = [];
    let cursor = 0;

    for (const s of spans) {
      const start = Math.max(cursor, s.start);
      const end = Math.min(answer.length, s.end);
      if (end <= start) continue;

      if (start > cursor) {
        segments.push({ text: answer.slice(cursor, start) });
      }
      segments.push({
        text: answer.slice(start, end),
        claim: s.claim,
        claimNumber: s.claimNumber,
      });
      cursor = end;
    }

    if (cursor < answer.length) {
      segments.push({ text: answer.slice(cursor) });
    }

    return segments;
  }, [answer, result]);

  const scrollToClaimCard = (claimId: string) => {
    setFlashingClaimId(null);
    const el = claimRefs.current[claimId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => {
        setFlashingClaimId(claimId);
      }, 120);
      window.setTimeout(() => {
        setFlashingClaimId((prev) => (prev === claimId ? null : prev));
      }, 1200);
    }
  };

  const handleCopySummary = () => {
    const text = `CASE VERDICT: ${result.overall_label} (${correctCount}/${totalCount} — ${result.score}%)\n${result.overall_summary}`;
    navigator.clipboard?.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const overallAccent =
    result.overall_label === 'Looks reliable'
      ? { bg: 'bg-[#2EE6A6]', text: 'text-[#050414]', Icon: CheckCircle2 }
      : result.overall_label === 'Use with caution'
      ? { bg: 'bg-[#FFD60A]', text: 'text-[#050414]', Icon: AlertTriangle }
      : { bg: 'bg-[#FF3B3B]', text: 'text-[#F5F1E8]', Icon: XCircle };

  const OverallIcon = overallAccent.Icon;

  return (
    <section className="space-y-8 pt-4">
      {/* Optional Reference Source Dossier Accordion */}
      {showSourceAccordion && source && (
        <div className="comic-panel-cyan">
          <button
            type="button"
            onClick={() => setShowFullSource(!showFullSource)}
            className="w-full px-4 py-3 flex items-center justify-between text-left font-sans text-xs font-extrabold uppercase tracking-wider text-[#3DD6F5] hover:text-[#FFD60A] cursor-pointer transition-colors"
          >
            <span>Exhibit A: Source Document ({source.length.toLocaleString()} chars)</span>
            <span className="inline-flex items-center gap-1 font-mono text-xs">
              <span>{showFullSource ? 'Hide' : 'Inspect'}</span>
              {showFullSource ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          </button>
          {showFullSource && (
            <div className="p-4 border-t-[3px] border-[#050414] bg-[#0E0B2E] text-xs text-[#F5F1E8] whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed font-mono">
              {source}
            </div>
          )}
        </div>
      )}

      {/* 1. TOP ROW: SPEECH-BUBBLE VERDICT CALLOUT + COMIC STARBURST SCORE */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_230px] gap-8 items-center">
        {/* Speech-Bubble Callout with Tail */}
        <div className="relative bg-[#F5F1E8] text-[#050414] border-[4px] border-[#050414] p-5 sm:p-6 shadow-[6px_6px_0_#3DD6F5]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 bg-[#050414] text-[#FFD60A] font-display text-sm tracking-widest uppercase">
                DETECTIVE VERDICT
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 border-[3px] border-[#050414] font-display text-xl tracking-wider uppercase -rotate-1 shadow-[3px_3px_0_#050414] ${overallAccent.bg} ${overallAccent.text}`}
              >
                <OverallIcon className="w-5 h-5 shrink-0 stroke-[2.5]" />
                <span>{result.overall_label}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopySummary}
              className="comic-btn inline-flex items-center gap-1.5 px-3 py-1 bg-[#3DD6F5] text-[#050414] font-sans text-xs font-extrabold uppercase tracking-wider cursor-pointer"
            >
              {copiedState ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedState ? 'Copied' : 'Copy Report'}</span>
            </button>
          </div>

          <p className="font-sans text-base sm:text-lg font-bold text-[#050414] leading-snug">
            &ldquo;{result.overall_summary}&rdquo;
          </p>

          {/* Speech Bubble Tail (bottom-left comic pointer) */}
          <svg
            viewBox="0 0 40 28"
            className="w-9 h-7 absolute -bottom-7 left-10 pointer-events-none"
            aria-hidden="true"
          >
            <polygon
              points="0,0 32,0 10,25"
              fill="#F5F1E8"
              stroke="#050414"
              strokeWidth="4"
              strokeLinejoin="miter"
            />
            <line x1="2" y1="0" x2="30" y2="0" stroke="#F5F1E8" strokeWidth="5" />
          </svg>
        </div>

        {/* Starburst Score Shape ("5/8" big comic number) */}
        <div className="flex justify-center">
          <div className="relative w-48 h-48 flex items-center justify-center select-none">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full drop-shadow-[5px_5px_0_#050414] rotate-3"
              aria-hidden="true"
            >
              <polygon
                points="100,4 123,36 162,18 160,59 196,76 171,111 190,149 149,157 142,196 105,175 70,196 60,157 18,152 35,114 8,80 45,61 42,20 80,36"
                fill="#FFD60A"
                stroke="#050414"
                strokeWidth="6"
                strokeLinejoin="miter"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center -rotate-3 px-4">
              <span className="font-sans text-[10px] font-extrabold uppercase tracking-widest text-[#050414] bg-[#F5F1E8] px-2 py-0.5 border-2 border-[#050414] mb-1">
                CLAIMS VERIFIED
              </span>
              <div className="font-display text-5xl leading-none text-[#050414] tabular-nums">
                {displayCorrect}/{totalCount}
              </div>
              <span className="font-mono text-xs font-bold text-[#050414] mt-1 tabular-nums">
                {result.score}% ACCURATE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. THE SUSPECT STATEMENT: COMIC-PANEL BOX WITH MARKER SWIPE HIGHLIGHTS */}
      <div className="comic-panel-yellow overflow-hidden">
        {/* Panel Header Strip */}
        <div className="bg-[#FFD60A] border-b-[3px] border-[#050414] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl tracking-wider text-[#050414] uppercase">
              SUSPECT TRANSCRIPT (MARKED UP)
            </h2>
            <div className="inline-flex border-2 border-[#050414] bg-[#050414] p-0.5">
              <button
                type="button"
                onClick={() => setAnswerViewMode('highlighted')}
                className={`px-2.5 py-0.5 font-sans text-xs font-extrabold uppercase cursor-pointer transition-colors ${
                  answerViewMode === 'highlighted'
                    ? 'bg-[#3DD6F5] text-[#050414]'
                    : 'text-[#F5F1E8] hover:text-[#FFD60A]'
                }`}
              >
                Marker View
              </button>
              <button
                type="button"
                onClick={() => setAnswerViewMode('raw')}
                className={`px-2.5 py-0.5 font-sans text-xs font-extrabold uppercase cursor-pointer transition-colors ${
                  answerViewMode === 'raw'
                    ? 'bg-[#3DD6F5] text-[#050414]'
                    : 'text-[#F5F1E8] hover:text-[#FFD60A]'
                }`}
              >
                Raw Copy
              </button>
            </div>
          </div>

          {/* Accessible Legend with Icon + Label */}
          {answerViewMode === 'highlighted' && (
            <div className="flex flex-wrap items-center gap-2 text-xs font-sans font-extrabold uppercase">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#2EE6A6] text-[#050414] border-2 border-[#050414]">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Correct</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FF3B3B] text-[#F5F1E8] border-2 border-[#050414]">
                <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Wrong</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FFD60A] text-[#050414] border-2 border-[#050414]">
                <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Not in source</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#3DD6F5] text-[#050414] border-2 border-[#050414]">
                <HelpCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Unclear</span>
              </span>
            </div>
          )}
        </div>

        {/* Highlighted Answer Body */}
        <div className="p-5 sm:p-7 bg-[#17134A] bg-comic-stripes">
          {answerViewMode === 'highlighted' ? (
            <div className="font-sans text-base sm:text-[17px] leading-[2.05] text-[#F5F1E8] whitespace-pre-wrap">
              {highlightedAnswerSegments.map((seg, i) => {
                if (!seg.claim) {
                  return <span key={i}>{seg.text}</span>;
                }
                const style = VERDICT_STYLES[seg.claim.verdict] || VERDICT_STYLES.unclear;
                const SegIcon = style.Icon;
                return (
                  <span
                    key={seg.claim.id || i}
                    role="button"
                    tabIndex={0}
                    onClick={() => scrollToClaimCard(seg.claim!.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        scrollToClaimCard(seg.claim!.id);
                      }
                    }}
                    title={`Evidence #${seg.claimNumber} (${style.label}) — click to inspect card`}
                    className={`marker-swipe px-1.5 py-0.5 mx-0.5 cursor-pointer transition-transform inline ${style.highlightClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F1E8]`}
                  >
                    <SegIcon className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5 stroke-[2.5]" />
                    <span>{seg.text}</span>
                    <span className="inline-flex items-center justify-center w-5 h-5 ml-1.5 text-[11px] font-mono font-bold rounded-full bg-[#050414] text-[#F5F1E8] border-2 border-[#F5F1E8] align-middle leading-none">
                      {seg.claimNumber}
                    </span>
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="font-mono text-sm leading-relaxed text-[#F5F1E8] whitespace-pre-wrap bg-[#0E0B2E] p-4 border-[3px] border-[#050414]">
              {answer}
            </div>
          )}
        </div>
      </div>

      {/* 3. EVIDENCE TAGS: TWO-COLUMN MASONRY-LIKE LAYOUT ON DESKTOP */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 bg-[#050414] border-[3px] border-[#050414] px-3.5 py-1.5 -rotate-1 shadow-[3px_3px_0_#3DD6F5]">
            <h2 className="font-display text-2xl tracking-wider text-[#F5F1E8] uppercase">
              EVIDENCE LOCKER ({result.claims.length} CLAIMS)
            </h2>
          </div>
          <span className="font-sans text-xs font-bold text-[#3DD6F5] uppercase tracking-wider">
            Click any highlighted claim above to spotlight its evidence card
          </span>
        </div>

        <div className="columns-1 md:columns-2 gap-6 space-y-6">
          {result.claims.map((claim, idx) => {
            const style = VERDICT_STYLES[claim.verdict] || VERDICT_STYLES.unclear;
            const VerdictIcon = style.Icon;
            const isFlashing = flashingClaimId === claim.id;
            const slightTilt = idx % 3 === 0 ? 'md:-rotate-[0.5deg]' : idx % 3 === 1 ? 'md:rotate-[0.5deg]' : '';

            return (
              <div
                key={claim.id || idx}
                ref={(el) => {
                  claimRefs.current[claim.id] = el;
                }}
                style={{ animationDelay: `${idx * 60}ms` }}
                className={`break-inside-avoid bg-[#17134A] border-[3px] border-[#050414] p-5 space-y-3.5 comic-card-hover animate-card-pop ${style.cardShadowClass} ${slightTilt} ${
                  isFlashing ? 'animate-flash-shake ring-4 ring-[#FFD60A]' : ''
                }`}
              >
                {/* Top Header: Number Badge + Slamming Verdict Stamp */}
                <div className="flex items-start justify-between gap-3 pb-2 border-b-2 border-[#050414]">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#050414] text-[#FFD60A] border-2 border-[#FFD60A] font-display text-xl tabular-nums">
                      #{idx + 1}
                    </span>
                    <span className="font-mono text-[11px] font-bold uppercase text-[#F5F1E8]/80 bg-[#0E0B2E] px-2 py-0.5 border border-[#050414]">
                      CONFIDENCE: {claim.confidence.toUpperCase()}
                    </span>
                  </div>

                  {/* Rotated Stamp Badge with Icon + Display Label */}
                  <div
                    style={{
                      animationDelay: `${idx * 60 + 120}ms`,
                      backgroundColor: style.bgHex,
                      color: style.textOnBgHex,
                    }}
                    className={`animate-stamp-slam ${style.stampRotation} inline-flex items-center gap-1.5 px-3 py-1 border-[3px] border-[#050414] shadow-[3px_3px_0_#050414] font-display text-lg tracking-wider uppercase shrink-0`}
                  >
                    <VerdictIcon className="w-4 h-4 shrink-0 stroke-[2.5]" />
                    <span>{style.stampLabel}</span>
                  </div>
                </div>

                {/* Unsafe / Logic Hazard Stickers */}
                {(claim.unsafe || claim.logic_problem) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {claim.unsafe && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FF2E93] text-[#050414] border-2 border-[#050414] shadow-[2px_2px_0_#050414] font-sans text-xs font-extrabold uppercase tracking-wider -rotate-1">
                        <ShieldAlert className="w-4 h-4 shrink-0 stroke-[2.5]" />
                        <span>UNSAFE ADVICE</span>
                      </span>
                    )}
                    {claim.logic_problem && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#3DD6F5] text-[#050414] border-2 border-[#050414] shadow-[2px_2px_0_#050414] font-sans text-xs font-extrabold uppercase tracking-wider rotate-1">
                        <BrainCircuit className="w-4 h-4 shrink-0 stroke-[2.5]" />
                        <span>LOGIC FLAW</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Claim Statement */}
                <p className="font-sans text-base font-extrabold text-[#F5F1E8] leading-snug">
                  {claim.claim_text}
                </p>

                {/* Detective Reasoning */}
                <p className="font-sans text-sm text-[#F5F1E8]/90 leading-relaxed">
                  {claim.reason}
                </p>

                {/* Verbatim Source Quote Box in Space Mono */}
                {(claim.evidence_quote ||
                  claim.verdict === 'correct' ||
                  claim.verdict === 'wrong') && (
                  <div className="bg-[#0E0B2E] border-[3px] border-[#050414] p-3.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono font-bold uppercase">
                      <span className="text-[#3DD6F5]">EVIDENCE QUOTE</span>
                      {claim.quote_found_in_source ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#2EE6A6] text-[#050414] border border-[#050414]">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Verified in source</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FFD60A] text-[#050414] border border-[#050414]">
                          <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Quote not in source</span>
                        </span>
                      )}
                    </div>

                    {claim.evidence_quote ? (
                      <blockquote className="font-mono text-xs text-[#F5F1E8] leading-relaxed pl-3 border-l-[3px] border-[#3DD6F5]">
                        &ldquo;{claim.evidence_quote}&rdquo;
                      </blockquote>
                    ) : (
                      <p className="font-mono text-xs text-[#F5F1E8]/60 italic">
                        No verbatim quote found in source.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
