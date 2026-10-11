import { AuditedClaim, AuditResult, Confidence, OverallLabel, Verdict } from './types';

/**
 * Check if the input string is a single URL starting with http:// or https://
 */
export function isSingleUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false;
  }
  // No spaces or newlines inside a single URL
  return !/\s/.test(trimmed);
}

/**
 * Normalize text by lowercasing and collapsing extra whitespace for quote verification.
 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Step 3 (Pure code, no AI): Check whether evidence_quote really appears in the source
 * (ignoring case and extra whitespace).
 */
export function verifyQuoteInSource(quote: string, sourceText: string): boolean {
  if (!quote || !quote.trim()) return false;
  const normQuote = normalizeText(quote);
  const normSource = normalizeText(sourceText);
  if (normSource.includes(normQuote)) return true;

  // Also strip surrounding quotation marks or trailing punctuation in case the model included them
  const strippedQuote = normQuote.replace(/^["'“”‘’]+|["'“”‘’.,;]+$/g, '').trim();
  return strippedQuote.length > 5 && normSource.includes(strippedQuote);
}

/**
 * Locate answer_excerpt inside the AI's answer so we can highlight it in the UI.
 */
export function findExcerptSpan(answer: string, excerpt: string): { start: number; end: number } | null {
  if (!excerpt || !excerpt.trim()) return null;
  const trimmed = excerpt.trim();

  // Exact match
  const exactIdx = answer.indexOf(trimmed);
  if (exactIdx !== -1) {
    return { start: exactIdx, end: exactIdx + trimmed.length };
  }

  // Case-insensitive match
  const lowerIdx = answer.toLowerCase().indexOf(trimmed.toLowerCase());
  if (lowerIdx !== -1) {
    return { start: lowerIdx, end: lowerIdx + trimmed.length };
  }

  return null;
}

/**
 * Full 4-step audit flow:
 * 1. Get the source text (fetch from link via Gemini urlContext if input is a single URL).
 * 2. Make ONE Gemini call with the source and the answer using structured JSON output.
 * 3. In code (no AI), check that each evidence_quote really appears in the source; if not, lower confidence to low.
 * 4. Compute the simple score (% of claims that are "correct") and overall label.
 */
export async function checkAnswerAgainstSource(
  rawSourceInput: string,
  answerInput: string,
  onStatus?: (msg: string) => void
): Promise<AuditResult> {
  let activeSourceText = rawSourceInput.trim();
  let fetchedSourceText: string | undefined;

  // Step 1: Fetch source text from URL if the input is a single URL
  if (isSingleUrl(activeSourceText)) {
    onStatus?.('Reading the source...');
    const urlRes = await fetch('/api/fetch-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: activeSourceText }),
    });

    if (!urlRes.ok) {
      const errData = await urlRes.json().catch(() => ({}));
      throw new Error(errData.error || "Couldn't read that link. Paste the text instead.");
    }

    const urlData = await urlRes.json();
    activeSourceText = urlData.text;
    fetchedSourceText = urlData.text;
  }

  // Step 2: Make ONE Gemini call with the source and the answer
  onStatus?.('Interrogating claim 1...');
  const checkRes = await fetch('/api/check-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: activeSourceText,
      answer: answerInput.trim(),
    }),
  });

  if (!checkRes.ok) {
    const errData = await checkRes.json().catch(() => ({}));
    throw new Error(errData.error || 'Could not check the answer. Try again.');
  }

  const data = await checkRes.json();
  const rawClaims: any[] = Array.isArray(data.claims) ? data.claims : [];

  if (rawClaims.length === 0) {
    throw new Error('No claims were found in the answer. Check your input and try again.');
  }

  // Step 3: In code (no AI), verify each evidence_quote in the source text
  const auditedClaims: AuditedClaim[] = rawClaims.map((c, idx) => {
    const quote = typeof c.evidence_quote === 'string' ? c.evidence_quote.trim() : '';
    const quoteFound = quote ? verifyQuoteInSource(quote, activeSourceText) : false;

    // Lower confidence to "low" if an evidence quote was expected or provided but not found in source
    const needsQuote = c.verdict === 'correct' || c.verdict === 'wrong' || quote.length > 0;
    const confidence: Confidence =
      needsQuote && !quoteFound ? 'low' : (c.confidence as Confidence) || 'medium';

    return {
      id: c.id || `claim-${idx + 1}`,
      claim_text: c.claim_text || '',
      answer_excerpt: c.answer_excerpt || '',
      verdict: (c.verdict as Verdict) || 'unclear',
      evidence_quote: quote,
      reason: c.reason || '',
      logic_problem: Boolean(c.logic_problem),
      unsafe: Boolean(c.unsafe),
      confidence,
      quote_found_in_source: quoteFound,
    };
  });

  // Step 4: Compute simple score (% of claims that are "correct") and overall label
  const correctCount = auditedClaims.filter((c) => c.verdict === 'correct').length;
  const wrongCount = auditedClaims.filter((c) => c.verdict === 'wrong').length;
  const unsafeCount = auditedClaims.filter((c) => c.unsafe).length;

  const score = Math.round((correctCount / auditedClaims.length) * 100);

  let overall_label: OverallLabel = 'Use with caution';
  if (wrongCount > 0 || unsafeCount > 0) {
    overall_label = 'Not reliable';
  } else if (score >= 80 && wrongCount === 0) {
    overall_label = 'Looks reliable';
  }

  return {
    claims: auditedClaims,
    overall_summary: data.overall_summary || 'Audit complete.',
    score,
    overall_label,
    fetched_source_text: fetchedSourceText,
  };
}
