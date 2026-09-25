import {useCallback, useEffect, useMemo, useState} from 'react';
import {clearPersisted, loadState, saveState} from '../merge/persistence';
import {
  applyDecision,
  buildRelease,
  clearDecision,
  computeGroups,
  countPending,
  ReleaseRow,
  setProjectWithdrawn,
} from '../merge/rules';
import {FieldKey, MergeState, MergedGroup, ValueSource} from '../merge/types';

/**
 * 合并审核台状态：归并规则（src/merge/rules.ts）与持久化
 * （src/merge/persistence.ts）在这里被 React 状态粘合，页面只消费结果。
 */
export function useMergeReview() {
  const [state, setState] = useState<MergeState>(() => loadState());

  // 每次变动落盘：关掉重开还能接着审
  useEffect(() => {
    saveState(state);
  }, [state]);

  const groups: MergedGroup[] = useMemo(() => computeGroups(state), [state]);
  const pending = useMemo(() => countPending(groups), [groups]);
  const release: ReleaseRow[] = useMemo(() => buildRelease(state), [state]);

  const resolve = useCallback(
    (groupKey: string, field: FieldKey, chosen: ValueSource, value: string, custom: boolean) =>
      setState((s) => applyDecision(s, groupKey, field, chosen, value, custom)),
    [],
  );

  const reopen = useCallback(
    (groupKey: string, field: FieldKey) =>
      setState((s) => clearDecision(s, groupKey, field)),
    [],
  );

  const setWithdrawn = useCallback(
    (projectId: string, withdrawn: boolean) =>
      setState((s) => setProjectWithdrawn(s, projectId, withdrawn)),
    [],
  );

  const resetAll = useCallback(() => {
    clearPersisted();
    // 直接读初始状态（createInitialState 在 persistence.loadState 缺省时给出）
    setState(loadState());
  }, []);

  return {
    state,
    groups,
    pending,
    release,
    resolve,
    reopen,
    setWithdrawn,
    resetAll,
  };
}

export type MergeReviewApi = ReturnType<typeof useMergeReview>;
