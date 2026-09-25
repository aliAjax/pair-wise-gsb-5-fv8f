// React 桥：把归并规则与持久化接到组件上，状态变更即落盘，重开可继续审核
import {useEffect, useMemo, useState} from 'react';
import type {Resolution, ReviewState, SourceManifest} from './types';
import {mergeManifests, unresolvedConflicts, upsertManifests, withdrawProject} from './mergeRules';
import {loadReviewState, saveReviewState} from './storage';

export function useMergeReview() {
  const [state, setState] = useState<ReviewState>(loadReviewState);

  useEffect(() => {
    saveReviewState(state);
  }, [state]);

  const packages = useMemo(() => mergeManifests(state.sources), [state.sources]);
  const pending = useMemo(() => unresolvedConflicts(packages, state.resolutions), [packages, state.resolutions]);

  const importSources = (manifests: SourceManifest[]) =>
    setState(s => ({...s, sources: upsertManifests(s.sources, manifests)}));

  const withdraw = (project: string) =>
    setState(s => ({...s, sources: withdrawProject(s.sources, project)}));

  const resolve = (key: string, resolution: Resolution) =>
    setState(s => ({...s, resolutions: {...s.resolutions, [key]: resolution}}));

  const reopen = (key: string) =>
    setState(s => {
      const resolutions = {...s.resolutions};
      delete resolutions[key];
      return {...s, resolutions};
    });

  return {state, packages, pending, importSources, withdraw, resolve, reopen};
}
