import React, { useEffect, useRef, useState } from 'react';
import {
  Link as LinkIcon,
  Upload,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  FolderOpen,
  ArrowRight,
} from 'lucide-react';
import { AuditResult, HistoryItem } from '../types';
import { checkAnswerAgainstSource, isSingleUrl } from '../auditPipeline';
import { EXAMPLE_ANSWER, EXAMPLE_SOURCE, PRELOADED_EXAMPLE_RESULT } from '../demoData';
import { findExistingAudit, saveAudit } from '../utils/storage';
import { AuditResultView } from '../components/AuditResultView';

const MAX_CHARS = 6000;

const CYCLING_LOADING_LINES = [
  'Reading the source...',
  'Interrogating claim 1...',
  'Cross-checking the evidence...',
];

interface NewAuditPageProps {
  onAuditFinished?: (newItem: HistoryItem) => void;
  onViewCompleteReport: (item: HistoryItem) => void;
  initialSource?: string;
  initialAnswer?: string;
  initialResult?: AuditResult | null;
}

export const NewAuditPage: React.FC<NewAuditPageProps> = ({
  onAuditFinished,
  onViewCompleteReport,
  initialSource = EXAMPLE_SOURCE,
  initialAnswer = EXAMPLE_ANSWER,
  initialResult = PRELOADED_EXAMPLE_RESULT,
}) => {
  const [source, setSource] = useState<string>(initialSource);
  const [answer, setAnswer] = useState<string>(initialAnswer);
  const [result, setResult] = useState<AuditResult | null>(initialResult);
  const [activeSavedItem, setActiveSavedItem] = useState<HistoryItem | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingLineIdx, setLoadingLineIdx] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Collapsible fetched source text when source is a URL
  const [showFetchedSource, setShowFetchedSource] = useState<boolean>(false);

  // File input refs for uploading source or answer
  const sourceFileInputRef = useRef<HTMLInputElement>(null);
  const answerFileInputRef = useRef<HTMLInputElement>(null);
  const [fileUploadNotice, setFileUploadNotice] = useState<string | null>(null);

  // Cycle detective status lines while checking
  useEffect(() => {
    if (!isLoading) {
      setLoadingLineIdx(0);
      return;
    }
    const interval = window.setInterval(() => {
      setLoadingLineIdx((prev) => (prev + 1) % CYCLING_LOADING_LINES.length);
    }, 1300);
    return () => window.clearInterval(interval);
  }, [isLoading]);

  // Reset to Medicine X example
  const handleTryExample = () => {
    setSource(EXAMPLE_SOURCE);
    setAnswer(EXAMPLE_ANSWER);
    setResult(PRELOADED_EXAMPLE_RESULT);
    setActiveSavedItem(null);
    setError(null);
    setShowFetchedSource(false);
    setFileUploadNotice(null);
  };

  // Clear inputs to start a fresh audit
  const handleClearInputs = () => {
    setSource('');
    setAnswer('');
    setResult(null);
    setActiveSavedItem(null);
    setError(null);
    setShowFetchedSource(false);
    setFileUploadNotice(null);
  };

  // Handle file uploads
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'source' | 'answer'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError(`File "${file.name}" is over 2MB. Choose a smaller text file.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      if (text.length > MAX_CHARS) {
        setError(
          `File has ${text.length.toLocaleString()} characters and was trimmed to the ${MAX_CHARS.toLocaleString()} character limit.`
        );
      }
      const safeText = text.slice(0, MAX_CHARS);
      if (target === 'source') {
        setSource(safeText);
        setFileUploadNotice(`Loaded ${file.name} (${safeText.length.toLocaleString()} chars) into Source.`);
      } else {
        setAnswer(safeText);
        setFileUploadNotice(`Loaded ${file.name} (${safeText.length.toLocaleString()} chars) into Answer.`);
      }
      setResult(null);
      setActiveSavedItem(null);
    };
    reader.onerror = () => {
      setError(`Couldn't read that file. Paste the text instead.`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Run the audit end to end
  const handleCheckAnswer = async () => {
    if (!source.trim() || !answer.trim()) {
      setError('Nothing to investigate yet. Paste a source and an answer.');
      return;
    }
    if (isLoading) return;

    if (source.length > MAX_CHARS || answer.length > MAX_CHARS) {
      setError(`Inputs are limited to ${MAX_CHARS.toLocaleString()} characters per box.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingLineIdx(0);

    try {
      const auditResult = await checkAnswerAgainstSource(source, answer);
      setResult(auditResult);
      if (auditResult.fetched_source_text) {
        setShowFetchedSource(true);
      }

      const newItem: HistoryItem = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source,
        answer,
        result: auditResult,
      };

      const { savedItem } = saveAudit(newItem);
      setActiveSavedItem(savedItem);
      if (onAuditFinished) {
        onAuditFinished(savedItem);
      }
    } catch (err: any) {
      setError(err?.message || "Couldn't read that link. Paste the text instead.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clicking "View Complete Audit Report"
  const handleOpenCompleteReport = () => {
    if (!result) {
      setError('Nothing to investigate yet. Paste a source and an answer.');
      return;
    }

    try {
      let itemToOpen = activeSavedItem;

      if (!itemToOpen) {
        const existing = findExistingAudit(source, answer, result.overall_summary);
        if (existing) {
          itemToOpen = existing;
        } else {
          const newItem: HistoryItem = {
            id: `audit-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source,
            answer,
            result,
          };
          const { savedItem } = saveAudit(newItem);
          itemToOpen = savedItem;
          if (onAuditFinished) {
            onAuditFinished(savedItem);
          }
        }
        setActiveSavedItem(itemToOpen);
      }

      if (!itemToOpen) {
        throw new Error('Could not open the saved case report.');
      }

      onViewCompleteReport(itemToOpen);
    } catch (err: any) {
      setError(err?.message || 'Could not open the case report.');
    }
  };

  const isInputEmpty = !source.trim() || !answer.trim();
  const isTooLong = source.length > MAX_CHARS || answer.length > MAX_CHARS;
  const sourceLooksLikeUrl = isSingleUrl(source);

  return (
    <div className="space-y-7 py-2">
      {/* Top Action Bar: "Try a case file", Clear, Character limit */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleTryExample}
            disabled={isLoading}
            className="comic-btn -rotate-1 inline-flex items-center gap-2 px-4 py-2 bg-[#3DD6F5] text-[#050414] font-display text-lg tracking-wider uppercase cursor-pointer disabled:opacity-50"
          >
            <FolderOpen className="w-4 h-4 stroke-[2.5]" />
            <span>Try a case file</span>
          </button>

          {(source.length > 0 || answer.length > 0 || result !== null) && (
            <button
              type="button"
              onClick={handleClearInputs}
              disabled={isLoading}
              className="comic-btn inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#17134A] text-[#F5F1E8] hover:bg-[#FF3B3B] hover:text-[#F5F1E8] font-sans text-xs font-extrabold uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Clear Desk</span>
            </button>
          )}
        </div>

        <span className="font-mono text-xs font-bold text-[#F5F1E8]/80 bg-[#17134A] border-2 border-[#050414] px-3 py-1 shadow-[2px_2px_0_#050414]">
          MAX {MAX_CHARS.toLocaleString()} CHARS PER PANEL
        </span>
      </div>

      {/* File Upload Notice */}
      {fileUploadNotice && (
        <div className="comic-panel-mint px-4 py-2.5 flex items-center justify-between text-xs font-mono font-bold text-[#2EE6A6]">
          <span>{fileUploadNotice}</span>
          <button
            type="button"
            onClick={() => setFileUploadNotice(null)}
            className="text-[#F5F1E8] hover:text-[#FFD60A] cursor-pointer ml-4 text-base leading-none"
            aria-label="Dismiss notice"
          >
            ×
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={sourceFileInputRef}
        onChange={(e) => handleFileUpload(e, 'source')}
        accept=".txt,.md,.markdown,.json,.csv,.text"
        className="hidden"
      />
      <input
        type="file"
        ref={answerFileInputRef}
        onChange={(e) => handleFileUpload(e, 'answer')}
        accept=".txt,.md,.markdown,.json,.csv,.text"
        className="hidden"
      />

      {/* TWO INPUT PANELS SIDE BY SIDE WITH COLORED HEADER STRIPS AND A "VS" STARBURST BETWEEN THEM */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-7 items-stretch">
        {/* PANEL 1: "1. THE SOURCE" in Cyan */}
        <div className="comic-panel-cyan flex flex-col animate-slide-left overflow-hidden">
          <div className="bg-[#3DD6F5] border-b-[3px] border-[#050414] px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label
                htmlFor="source-box"
                className="font-display text-2xl tracking-wider text-[#050414] uppercase cursor-pointer"
              >
                1. THE SOURCE
              </label>
              {sourceLooksLikeUrl && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#050414] text-[#3DD6F5] font-mono text-[11px] font-bold uppercase">
                  <LinkIcon className="w-3 h-3" />
                  <span>Link</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => sourceFileInputRef.current?.click()}
                disabled={isLoading}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#050414] text-[#F5F1E8] hover:text-[#FFD60A] font-sans text-xs font-extrabold uppercase tracking-wider cursor-pointer"
                title="Upload text file"
              >
                <Upload className="w-3 h-3" />
                <span>Upload</span>
              </button>
              <span
                className={`font-mono text-xs font-bold tabular-nums px-1.5 py-0.5 bg-[#050414] ${
                  source.length > MAX_CHARS ? 'text-[#FF3B3B]' : 'text-[#F5F1E8]'
                }`}
              >
                {source.length.toLocaleString()}/{MAX_CHARS.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col bg-[#17134A]">
            <textarea
              id="source-box"
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                if (result) {
                  setResult(null);
                  setActiveSavedItem(null);
                }
              }}
              disabled={isLoading}
              rows={9}
              placeholder="Paste the official fact sheet, ground-truth article, or a single https:// web link..."
              className="w-full flex-1 bg-[#0E0B2E] border-[3px] border-[#050414] focus:border-[#3DD6F5] focus:outline-none p-3.5 text-sm font-sans text-[#F5F1E8] placeholder:text-[#F5F1E8]/40 leading-relaxed resize-y"
            />
          </div>
        </div>

        {/* "VS" Starburst Badge in the Center on Desktop */}
        <div
          aria-hidden="true"
          className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
        >
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full drop-shadow-[3px_3px_0_#050414]"
            >
              <polygon
                points="50,2 63,20 85,12 82,35 98,50 82,65 85,88 63,80 50,98 37,80 15,88 18,65 2,50 18,35 15,12 37,20"
                fill="#FF3B3B"
                stroke="#050414"
                strokeWidth="5"
              />
            </svg>
            <span className="absolute font-display text-2xl text-[#F5F1E8] tracking-wider -rotate-6">
              VS
            </span>
          </div>
        </div>

        {/* PANEL 2: "2. THE ANSWER" in Electric Yellow */}
        <div className="comic-panel-yellow flex flex-col animate-slide-right overflow-hidden">
          <div className="bg-[#FFD60A] border-b-[3px] border-[#050414] px-4 py-2.5 flex items-center justify-between gap-2">
            <label
              htmlFor="answer-box"
              className="font-display text-2xl tracking-wider text-[#050414] uppercase cursor-pointer"
            >
              2. THE ANSWER
            </label>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => answerFileInputRef.current?.click()}
                disabled={isLoading}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#050414] text-[#F5F1E8] hover:text-[#3DD6F5] font-sans text-xs font-extrabold uppercase tracking-wider cursor-pointer"
                title="Upload AI response file"
              >
                <Upload className="w-3 h-3" />
                <span>Upload</span>
              </button>
              <span
                className={`font-mono text-xs font-bold tabular-nums px-1.5 py-0.5 bg-[#050414] ${
                  answer.length > MAX_CHARS ? 'text-[#FF3B3B]' : 'text-[#F5F1E8]'
                }`}
              >
                {answer.length.toLocaleString()}/{MAX_CHARS.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col bg-[#17134A]">
            <textarea
              id="answer-box"
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                if (result) {
                  setResult(null);
                  setActiveSavedItem(null);
                }
              }}
              disabled={isLoading}
              rows={9}
              placeholder="Paste the suspect AI answer you want to interrogate against the source..."
              className="w-full flex-1 bg-[#0E0B2E] border-[3px] border-[#050414] focus:border-[#FFD60A] focus:outline-none p-3.5 text-sm font-sans text-[#F5F1E8] placeholder:text-[#F5F1E8]/40 leading-relaxed resize-y"
            />
          </div>
        </div>
      </div>

      {/* Error Callout */}
      {error && (
        <div
          role="alert"
          className="comic-panel-red bg-[#FF3B3B] text-[#F5F1E8] p-4 flex items-center gap-3 font-sans text-sm font-extrabold"
        >
          <AlertTriangle className="w-6 h-6 shrink-0 text-[#FFD60A] stroke-[2.5]" />
          <span>{error}</span>
        </div>
      )}

      {/* MAIN ACTION ROW: Chunky Electric Yellow "Check answer" Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCheckAnswer}
            disabled={isInputEmpty || isTooLong || isLoading}
            className="w-full sm:w-auto comic-btn inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-[#FFD60A] text-[#050414] disabled:bg-[#17134A] disabled:text-[#F5F1E8]/40 font-display text-2xl tracking-wider uppercase cursor-pointer"
          >
            {/* Small SVG Magnifying Glass Icon */}
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="20" y1="20" x2="16.2" y2="16.2" />
            </svg>
            <span>Check answer</span>
          </button>

          {!isLoading && !result && isInputEmpty && (
            <span className="font-sans text-sm font-bold text-[#3DD6F5]">
              Nothing to investigate yet. Paste a source and an answer.
            </span>
          )}
        </div>

        {result && !isLoading && (
          <button
            type="button"
            onClick={handleOpenCompleteReport}
            className="comic-btn inline-flex items-center gap-2 px-4 py-2 bg-[#2EE6A6] text-[#050414] font-display text-lg tracking-wider uppercase cursor-pointer"
          >
            <span>View Complete Audit Report</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* ANIMATED DETECTIVE INVESTIGATION STAGE WHILE CHECKING */}
      {isLoading && (
        <div className="comic-panel-cyan p-8 text-center space-y-4 bg-comic-stripes">
          <div className="relative mx-auto w-36 h-16 flex items-center justify-center">
            {/* Background lines representing text under inspection */}
            <div className="w-28 space-y-2 opacity-40">
              <div className="h-2 bg-[#3DD6F5] rounded-xs w-full" />
              <div className="h-2 bg-[#FFD60A] rounded-xs w-4/5 mx-auto" />
              <div className="h-2 bg-[#FF3B3B] rounded-xs w-11/12" />
            </div>

            {/* Sweeping SVG Magnifying Glass */}
            <svg
              viewBox="0 0 64 64"
              className="w-14 h-14 absolute animate-magnifier drop-shadow-[3px_3px_0_#050414]"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="26"
                cy="26"
                r="16"
                fill="#3DD6F5"
                fillOpacity="0.35"
                stroke="#FFD60A"
                strokeWidth="5"
              />
              <circle cx="26" cy="26" r="19" stroke="#050414" strokeWidth="3" />
              <line
                x1="39"
                y1="39"
                x2="56"
                y2="56"
                stroke="#FF3B3B"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <line
                x1="39"
                y1="39"
                x2="56"
                y2="56"
                stroke="#050414"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="font-display text-2xl sm:text-3xl tracking-wider text-[#FFD60A] uppercase">
            {CYCLING_LOADING_LINES[loadingLineIdx]}
          </div>
        </div>
      )}

      {/* Collapsible Fetched Source Text Section (shown when URL was fetched) */}
      {result?.fetched_source_text && (
        <div className="comic-panel-cyan">
          <button
            type="button"
            onClick={() => setShowFetchedSource(!showFetchedSource)}
            className="w-full px-4 py-3 flex items-center justify-between text-left font-sans text-xs font-extrabold uppercase tracking-wider text-[#3DD6F5] hover:text-[#FFD60A] cursor-pointer transition-colors"
          >
            <span>Fetched Source Wire (from link)</span>
            {showFetchedSource ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {showFetchedSource && (
            <div className="p-4 border-t-[3px] border-[#050414] bg-[#0E0B2E] text-xs text-[#F5F1E8] whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed font-mono">
              {result.fetched_source_text}
            </div>
          )}
        </div>
      )}

      {/* Full Results Section */}
      {result && !isLoading && (
        <AuditResultView
          result={result}
          answer={answer}
          showSourceAccordion={false}
        />
      )}
    </div>
  );
};
