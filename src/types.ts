export type Verdict = 'correct' | 'wrong' | 'not in source' | 'unclear';

export type Confidence = 'high' | 'medium' | 'low';

export type OverallLabel = 'Looks reliable' | 'Use with caution' | 'Not reliable';

export interface AuditedClaim {
  id: string;
  claim_text: string;
  answer_excerpt: string;
  verdict: Verdict;
  evidence_quote: string;
  reason: string;
  logic_problem: boolean;
  unsafe: boolean;
  confidence: Confidence;
  // Computed in pure code (Step 3)
  quote_found_in_source: boolean;
}

export interface AuditResult {
  claims: AuditedClaim[];
  overall_summary: string;
  score: number; // 0-100 percent of claims that are "correct"
  overall_label: OverallLabel;
  fetched_source_text?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  source: string;
  answer: string;
  result: AuditResult;
}

export type PageId = 'home' | 'new-audit' | 'reports' | 'history' | 'accounts';
