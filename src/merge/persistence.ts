import { createInitialState } from './rules';
import { FieldKey, MergeState } from './types';

const STORAGE_KEY = 'license-lens:merge-review:v1';

/** 读出上次审核进度；损坏或缺省时回到初始两份清单、零裁决 */
export function loadState(): MergeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const data = JSON.parse(raw) as MergeState;
    if (!isValidState(data)) return createInitialState();
    return data;
  } catch {
    return createInitialState();
  }
}

export function saveState(state: MergeState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 隐私模式 / 配额不足时静默：不影响本次审核
  }
}

export function clearPersisted(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function isValidState(d: unknown): d is MergeState {
  if (!d || typeof d !== 'object') return false;
  const s = d as MergeState;
  return (
    s.version === 1 &&
    !!s.projects &&
    typeof s.projects === 'object' &&
    Array.isArray(s.entries) &&
    s.entries.every(
      (e) =>
        typeof e.name === 'string' &&
        typeof e.version === 'string' &&
        typeof e.projectId === 'string' &&
        typeof e.refPath === 'string',
    ) &&
    !!s.decisions &&
    typeof s.decisions === 'object' &&
    Object.values(s.decisions).every(
      (x) =>
        typeof x.value === 'string' &&
        typeof x.chosenProjectId === 'string' &&
        typeof x.at === 'string',
    )
  );
}

/** 判断某个裁决键对应的字段（供校验工具/测试使用） */
export function fieldOfDecisionKey(key: string): FieldKey | undefined {
  if (key.endsWith('::license')) return 'license';
  if (key.endsWith('::copyright')) return 'copyright';
  return undefined;
}
