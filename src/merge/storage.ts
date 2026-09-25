// 持久化：审核状态读写 localStorage，与归并规则、页面解耦
import type {ReviewState} from './types';

const STORAGE_KEY = 'license-lens-merge-review';

const empty: ReviewState = {sources: [], resolutions: {}};

export function loadReviewState(): ReviewState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<ReviewState>;
    return {
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      resolutions: parsed.resolutions && typeof parsed.resolutions === 'object' ? parsed.resolutions : {},
    };
  } catch {
    return empty;
  }
}

export function saveReviewState(state: ReviewState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 存储不可用时静默降级，审核状态仅保留在本次会话
  }
}
