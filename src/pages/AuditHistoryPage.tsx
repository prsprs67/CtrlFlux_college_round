import React, { useMemo, useState } from 'react';
import {
  Search,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { HistoryItem, PageId } from '../types';

interface AuditHistoryPageProps {
  history: HistoryItem[];
  onDelete: (id: string) => void;
  onNavigate: (page: PageId) => void;
  onViewFullReport: (item: HistoryItem) => void;
  isDrawer?: boolean;
  onCloseDrawer?: () => void;
}

export const AuditHistoryPage: React.FC<AuditHistoryPageProps> = ({
  history,
  onDelete,
  onNavigate,
  onViewFullReport,
  isDrawer = false,
  onCloseDrawer,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    const q = searchQuery.toLowerCase().trim();

    return history.filter((item) => {
      const matchAnswer = item.answer?.toLowerCase().includes(q);
      const matchSource = item.source?.toLowerCase().includes(q);
      const matchSummary = item.result?.overall_summary?.toLowerCase().includes(q);
      const matchClaims = (item.result?.claims || []).some(
        (c) =>
          c.claim_text?.toLowerCase().includes(q) ||
          c.reason?.toLowerCase().includes(q) ||
          c.evidence_quote?.toLowerCase().includes(q)
      );

      return matchAnswer || matchSource || matchSummary || matchClaims;
    });
  }, [history, searchQuery]);

  const handleConfirmDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onDelete(id);
    setPendingDeleteId(null);
  };

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b-[3px] border-[#050414]">
        <div>
          <h1 className="font-display text-3xl tracking-wider text-[#FFD60A] uppercase -rotate-1 inline-block">
            EVIDENCE FILE HISTORY
          </h1>
          <p className="font-sans text-xs font-bold text-[#3DD6F5] uppercase tracking-wider">
            {history.length} logged case file{history.length === 1 ? '' : 's'}
          </p>
        </div>

        {isDrawer && onCloseDrawer ? (
          <button
            type="button"
            onClick={onCloseDrawer}
            className="comic-btn p-2 bg-[#FF3B3B] text-[#F5F1E8] cursor-pointer"
            aria-label="Close history drawer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate('new-audit')}
            className="comic-btn inline-flex items-center gap-2 px-4 py-2 bg-[#FFD60A] text-[#050414] font-display text-lg tracking-wider uppercase cursor-pointer"
          >
            <span>New Investigation</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Search Bar */}
      {history.length > 0 && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#3DD6F5]">
            <Search className="w-4 h-4 stroke-[2.5]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search evidence files by keyword..."
            className="w-full bg-[#0E0B2E] border-[3px] border-[#050414] focus:border-[#FFD60A] focus:outline-none pl-10 pr-9 py-2.5 text-xs font-sans font-bold text-[#F5F1E8] placeholder:text-[#F5F1E8]/50 shadow-[3px_3px_0_#050414]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#F5F1E8] hover:text-[#FFD60A] cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Tape-Labeled Evidence-File Cards */}
      {history.length === 0 ? (
        <div className="comic-panel-yellow p-8 text-center space-y-3">
          <div className="font-display text-2xl text-[#FFD60A] uppercase">
            NO CASE FILES ON RECORD
          </div>
          <p className="font-sans text-xs font-bold text-[#F5F1E8]">
            Nothing to investigate yet. Paste a source and an answer.
          </p>
          <button
            type="button"
            onClick={() => {
              onCloseDrawer?.();
              onNavigate('new-audit');
            }}
            className="comic-btn inline-flex items-center gap-2 px-5 py-2 bg-[#FFD60A] text-[#050414] font-display text-lg tracking-wider uppercase cursor-pointer"
          >
            <span>Check answer</span>
          </button>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="comic-panel p-6 text-center space-y-2">
          <p className="font-sans text-sm font-bold text-[#F5F1E8]">
            No evidence files match &ldquo;{searchQuery}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="comic-btn px-3 py-1 bg-[#3DD6F5] text-[#050414] font-sans text-xs font-extrabold uppercase cursor-pointer"
          >
            Clear filter
          </button>
        </div>
      ) : (
        <div className="space-y-6 pt-2">
          {filteredHistory.map((item, idx) => {
            const res = item.result || ({} as any);
            const claims = res.claims || [];
            const correctCount = claims.filter((c: any) => c.verdict === 'correct').length;
            const isPendingDelete = pendingDeleteId === item.id;

            const label = res.overall_label || 'Use with caution';
            const stampStyle =
              label === 'Looks reliable'
                ? { bg: 'bg-[#2EE6A6]', text: 'text-[#050414]', Icon: CheckCircle2 }
                : label === 'Use with caution'
                ? { bg: 'bg-[#FFD60A]', text: 'text-[#050414]', Icon: AlertTriangle }
                : { bg: 'bg-[#FF3B3B]', text: 'text-[#F5F1E8]', Icon: XCircle };

            const StampIcon = stampStyle.Icon;
            const tilt = idx % 2 === 0 ? '-rotate-[0.4deg]' : 'rotate-[0.4deg]';

            return (
              <div
                key={item.id}
                onClick={() => {
                  onCloseDrawer?.();
                  onViewFullReport(item);
                }}
                className={`relative bg-[#17134A] border-[3px] border-[#050414] shadow-[4px_4px_0_#3DD6F5] p-4 pt-6 space-y-3 cursor-pointer comic-card-hover ${tilt}`}
              >
                {/* Masking Tape Label at the top */}
                <div className="absolute -top-3 left-5 bg-[#FFD60A] text-[#050414] border-2 border-[#050414] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider -rotate-2 shadow-[2px_2px_0_#050414]">
                  EVIDENCE #{history.length - idx} ·{' '}
                  {new Date(item.timestamp).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>

                {/* Top row: Verdict Stamp + Score Stamp */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 border-2 border-[#050414] shadow-[2px_2px_0_#050414] font-display text-base tracking-wider uppercase -rotate-1 ${stampStyle.bg} ${stampStyle.text}`}
                  >
                    <StampIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{label}</span>
                  </span>

                  <span className="px-2.5 py-0.5 bg-[#050414] text-[#FFD60A] border-2 border-[#FFD60A] font-display text-lg tracking-wider rotate-2 tabular-nums">
                    {correctCount}/{claims.length} ({res.score ?? 0}%)
                  </span>
                </div>

                {/* Preview text */}
                <p className="font-sans text-xs font-bold text-[#F5F1E8] line-clamp-2 leading-relaxed">
                  {item.answer || res.overall_summary}
                </p>

                {/* Actions Footer */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t-2 border-[#050414] text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseDrawer?.();
                      onViewFullReport(item);
                    }}
                    className="px-2.5 py-1 bg-[#3DD6F5] text-[#050414] border-2 border-[#050414] font-sans text-[11px] font-extrabold uppercase tracking-wider cursor-pointer"
                  >
                    View Full Report
                  </button>

                  {!isPendingDelete ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDeleteId(item.id);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[#F5F1E8]/70 hover:text-[#FF3B3B] font-sans text-[11px] font-bold uppercase cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  ) : (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5"
                    >
                      <button
                        type="button"
                        onClick={(e) => handleConfirmDelete(item.id, e)}
                        className="px-2 py-0.5 bg-[#FF3B3B] text-[#F5F1E8] border-2 border-[#050414] font-sans text-[11px] font-extrabold uppercase cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDeleteId(null);
                        }}
                        className="px-2 py-0.5 bg-[#0E0B2E] text-[#F5F1E8] border-2 border-[#050414] font-sans text-[11px] font-bold uppercase cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
