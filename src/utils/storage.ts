import { HistoryItem } from '../types';

export const STORAGE_KEY = 'second_opinion_history_v1';

export function getSavedAudits(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out invalid items to handle corrupted storage gracefully
    return parsed.filter((item): item is HistoryItem => {
      return (
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.timestamp === 'string' &&
        typeof item.answer === 'string' &&
        item.result &&
        typeof item.result === 'object'
      );
    });
  } catch (err) {
    console.error('Failed to load audits from localStorage:', err);
    return [];
  }
}

export function findExistingAudit(
  source: string,
  answer: string,
  overallSummary?: string
): HistoryItem | undefined {
  const current = getSavedAudits();
  return current.find((h) => {
    const sameAnswer = h.answer.trim() === answer.trim();
    const sameSource = h.source.trim() === source.trim();
    if (!overallSummary) return sameAnswer && sameSource;
    return (
      sameAnswer &&
      sameSource &&
      h.result?.overall_summary === overallSummary
    );
  });
}

export function saveAudit(item: HistoryItem): {
  items: HistoryItem[];
  savedItem: HistoryItem;
  isDuplicate: boolean;
} {
  try {
    const current = getSavedAudits();

    // 1. Check if an item with the exact same ID already exists
    const existingById = current.find((h) => h.id === item.id);
    if (existingById) {
      return { items: current, savedItem: existingById, isDuplicate: true };
    }

    // 2. Check if an item with identical answer, source, and summary already exists
    const existingByContent = current.find(
      (h) =>
        h.answer.trim() === item.answer.trim() &&
        h.source.trim() === item.source.trim() &&
        h.result?.overall_summary === item.result?.overall_summary
    );
    if (existingByContent) {
      return { items: current, savedItem: existingByContent, isDuplicate: true };
    }

    // Prepend new item and keep max 50
    const updated = [item, ...current].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { items: updated, savedItem: item, isDuplicate: false };
  } catch (err) {
    console.error('Failed to save audit to localStorage:', err);
    return { items: getSavedAudits(), savedItem: item, isDuplicate: false };
  }
}

export function deleteAudit(id: string): HistoryItem[] {
  try {
    const current = getSavedAudits();
    const updated = current.filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to delete audit from localStorage:', err);
    return getSavedAudits();
  }
}

export function clearAudits(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear audits from localStorage:', err);
  }
}
