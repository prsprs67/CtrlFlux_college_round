import React, { useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { HistoryItem, PageId } from '../types';
import { AuditResultView } from '../components/AuditResultView';

interface AuditReportsPageProps {
  reports: HistoryItem[];
  selectedReportId?: string | null;
  onSelectReport: (id: string | null) => void;
  onNavigate: (page: PageId) => void;
  onDeleteReport?: (id: string) => void;
}

export const AuditReportsPage: React.FC<AuditReportsPageProps> = ({
  reports,
  selectedReportId,
  onSelectReport,
  onNavigate,
}) => {
  const selectedReport = useMemo(() => {
    if (!selectedReportId) return null;
    return reports.find((r) => r.id === selectedReportId) || null;
  }, [reports, selectedReportId]);

  if (selectedReport) {
    const claims = selectedReport.result?.claims || [];
    const hasFullClaimsData = Array.isArray(claims) && claims.length > 0;
    const correctCount = claims.filter((c) => c.verdict === 'correct').length;

    const label = selectedReport.result?.overall_label || 'Use with caution';
    const stampStyle =
      label === 'Looks reliable'
        ? { bg: 'bg-[#2EE6A6]', text: 'text-[#050414]', Icon: CheckCircle2 }
        : label === 'Use with caution'
        ? { bg: 'bg-[#FFD60A]', text: 'text-[#050414]', Icon: AlertTriangle }
        : { bg: 'bg-[#FF3B3B]', text: 'text-[#F5F1E8]', Icon: XCircle };

    const StampIcon = stampStyle.Icon;

    return (
      <div className="space-y-6 py-2">
        {/* Top bar for selected report */}
        <div className="comic-panel-cyan p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => onSelectReport(null)}
              className="inline-flex items-center gap-1.5 font-sans text-xs font-extrabold uppercase tracking-wider text-[#3DD6F5] hover:text-[#FFD60A] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back to Reports</span>
            </button>
            <h1 className="font-display text-3xl tracking-wider text-[#F5F1E8] uppercase">
              CASE DOSSIER
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs font-bold text-[#F5F1E8]/80 bg-[#0E0B2E] px-2.5 py-1 border-2 border-[#050414]">
              {new Date(selectedReport.timestamp).toLocaleString()}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 border-[3px] border-[#050414] shadow-[3px_3px_0_#050414] font-display text-lg uppercase -rotate-2 ${stampStyle.bg} ${stampStyle.text}`}
            >
              <StampIcon className="w-4 h-4 stroke-[2.5]" />
              <span>{label}</span>
            </span>
            <span className="px-3 py-1 bg-[#FFD60A] text-[#050414] border-[3px] border-[#050414] shadow-[3px_3px_0_#050414] font-display text-xl rotate-1 tabular-nums">
              {correctCount}/{claims.length}
            </span>
          </div>
        </div>

        {hasFullClaimsData ? (
          <AuditResultView
            result={selectedReport.result}
            answer={selectedReport.answer}
            source={selectedReport.source}
            showSourceAccordion={true}
          />
        ) : (
          <div className="comic-panel-yellow p-6 space-y-4">
            <p className="font-sans text-xs font-extrabold uppercase text-[#FFD60A]">
              Full claim annotations are unavailable for this older case record.
            </p>
            <p className="font-sans text-base font-bold text-[#F5F1E8]">
              {selectedReport.result?.overall_summary || 'No summary recorded.'}
            </p>
            <div className="p-4 bg-[#0E0B2E] border-[3px] border-[#050414] font-mono text-xs text-[#F5F1E8] whitespace-pre-wrap leading-relaxed">
              {selectedReport.answer}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-[3px] border-[#050414]">
        <div>
          <h1 className="font-display text-4xl tracking-wider text-[#F5F1E8] uppercase -rotate-1 inline-block">
            CASE REPORTS ARCHIVE
          </h1>
          <p className="font-sans text-sm text-[#3DD6F5] font-bold mt-1">
            Inspect complete saved investigations, evidence tags, and source quotes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('new-audit')}
          className="comic-btn inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFD60A] text-[#050414] font-display text-xl tracking-wider uppercase cursor-pointer self-start sm:self-auto"
        >
          <span>New Investigation</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="comic-panel-cyan p-10 text-center space-y-4 max-w-xl mx-auto">
          <div className="font-display text-3xl text-[#FFD60A] uppercase">
            NO CASE FILES LOGGED YET
          </div>
          <p className="font-sans text-sm text-[#F5F1E8]">
            Nothing to investigate yet. Paste a source and an answer.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('new-audit')}
            className="comic-btn inline-flex items-center gap-2 px-6 py-2.5 bg-[#FFD60A] text-[#050414] font-display text-xl tracking-wider uppercase cursor-pointer"
          >
            <span>Check answer</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 pt-2">
          {reports.map((item, idx) => {
            const res = item.result || ({} as any);
            const claims = res.claims || [];
            const correct = claims.filter((c: any) => c.verdict === 'correct').length;
            const wrong = claims.filter((c: any) => c.verdict === 'wrong').length;
            const notInSource = claims.filter((c: any) => c.verdict === 'not in source').length;

            const label = res.overall_label || 'Use with caution';
            const stampStyle =
              label === 'Looks reliable'
                ? { bg: 'bg-[#2EE6A6]', text: 'text-[#050414]', Icon: CheckCircle2 }
                : label === 'Use with caution'
                ? { bg: 'bg-[#FFD60A]', text: 'text-[#050414]', Icon: AlertTriangle }
                : { bg: 'bg-[#FF3B3B]', text: 'text-[#F5F1E8]', Icon: XCircle };

            const StampIcon = stampStyle.Icon;
            const tilt = idx % 2 === 0 ? '-rotate-[0.5deg]' : 'rotate-[0.5deg]';

            return (
              <div
                key={item.id}
                onClick={() => onSelectReport(item.id)}
                className={`relative comic-panel p-5 pt-7 space-y-3.5 cursor-pointer comic-card-hover ${tilt}`}
              >
                {/* Top Tape Label */}
                <div className="absolute -top-3.5 left-6 bg-[#FFD60A] text-[#050414] border-2 border-[#050414] px-3 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider -rotate-2 shadow-[2px_2px_0_#050414]">
                  CASE FILE // {new Date(item.timestamp).toLocaleDateString()}
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-[#050414] shadow-[2px_2px_0_#050414] font-display text-base uppercase -rotate-1 ${stampStyle.bg} ${stampStyle.text}`}
                  >
                    <StampIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{label}</span>
                  </span>

                  <div className="px-2.5 py-0.5 bg-[#3DD6F5] text-[#050414] border-2 border-[#050414] shadow-[2px_2px_0_#050414] font-display text-xl rotate-2 tabular-nums">
                    {correct}/{claims.length} ({res.score ?? 0}%)
                  </div>
                </div>

                <p className="font-sans text-sm font-extrabold text-[#F5F1E8] leading-snug line-clamp-2">
                  {res.overall_summary || item.answer}
                </p>

                <p className="font-mono text-xs text-[#F5F1E8]/75 bg-[#0E0B2E] p-2.5 border-2 border-[#050414] line-clamp-2">
                  {item.answer}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t-2 border-[#050414] text-xs font-mono font-bold">
                  <div className="flex items-center gap-2">
                    <span className="text-[#2EE6A6]">{correct} OK</span>
                    <span>·</span>
                    <span className="text-[#FF3B3B]">{wrong} WRONG</span>
                    {notInSource > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-[#FFD60A]">{notInSource} UNVERIFIED</span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectReport(item.id);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FFD60A] text-[#050414] border-2 border-[#050414] font-sans text-xs font-extrabold uppercase cursor-pointer"
                  >
                    <span>Open Full Report</span>
                    <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
