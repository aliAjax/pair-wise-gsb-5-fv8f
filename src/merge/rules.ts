import {
  decisionKey,
  FieldDecision,
  FieldKey,
  FieldState,
  ManifestEntry,
  MergeState,
  MergedGroup,
  SourceProject,
  ValueSource,
} from './types';

/** 并入同一发布线的两个前端仓库（初始依赖清单） */
export const initialProjects: SourceProject[] = [
  {
    id: 'storefront-web',
    name: 'storefront-web（商城前端）',
    repo: 'git@acme.dev:fe/storefront-web',
    withdrawn: false,
  },
  {
    id: 'admin-console',
    name: 'admin-console（管理后台）',
    repo: 'git@acme.dev:fe/admin-console',
    withdrawn: false,
  },
];

/**
 * 两份拼接前的依赖清单。
 * 同名同版本按一组归并；同名不同版本各自成组。
 */
export const initialEntries: ManifestEntry[] = [
  // storefront-web
  { projectId: 'storefront-web', projectName: 'storefront-web（商城前端）', name: 'react', version: '18.3.1', license: 'MIT', copyright: 'Copyright (c) Meta Platforms, Inc. and affiliates.', refPath: 'package.json › dependencies › react' },
  { projectId: 'storefront-web', projectName: 'storefront-web（商城前端）', name: 'lodash', version: '4.17.21', license: 'MIT', copyright: 'Copyright OpenJS Foundation and other contributors', refPath: 'package.json › dependencies › lodash' },
  { projectId: 'storefront-web', projectName: 'storefront-web（商城前端）', name: 'axios', version: '1.7.7', license: 'MIT', copyright: 'Copyright (c) 2014-present Matt Zabriskie', refPath: 'package.json › dependencies › axios' },
  { projectId: 'storefront-web', projectName: 'storefront-web（商城前端）', name: 'highlight.js', version: '11.10.0', license: 'BSD-3-Clause', copyright: 'Copyright (c) 2006, Ivan Sagalaev.', refPath: 'package.json › dependencies › highlight.js' },
  { projectId: 'storefront-web', projectName: 'storefront-web（商城前端）', name: 'legacy-parser', version: '2.1.0', license: 'GPL-3.0', copyright: 'Copyright (c) 2019 OldStack Ltd.', refPath: 'vendor/legacy-parser/package.json › license' },
  { projectId: 'storefront-web', projectName: 'storefront-web（商城前端）', name: 'dayjs', version: '1.11.13', license: 'MIT', copyright: 'Copyright (c) 2018-present, iamkun', refPath: 'package.json › dependencies › dayjs' },
  { projectId: 'storefront-web', projectName: 'storefront-web（商城前端）', name: 'qs', version: '6.13.0', license: 'BSD-3-Clause', copyright: 'Copyright (c) 2014 Nathan LaFreniere and other contributors.', refPath: 'package.json › dependencies › qs' },

  // admin-console（管理后台）
  { projectId: 'admin-console', projectName: 'admin-console（管理后台）', name: 'react', version: '18.3.1', license: 'MIT', copyright: 'Copyright (c) Meta Platforms, Inc. and affiliates.', refPath: 'package.json › dependencies › react' },
  { projectId: 'admin-console', projectName: 'admin-console（管理后台）', name: 'lodash', version: '4.17.21', license: 'MIT', copyright: 'Copyright OpenJS Foundation and other contributors', refPath: 'package.json › dependencies › lodash' },
  { projectId: 'admin-console', projectName: 'admin-console（管理后台）', name: 'chart.js', version: '4.4.4', license: 'MIT', copyright: 'Copyright 2014-2024 Chart.js Contributors', refPath: 'package.json › dependencies › chart.js' },
  { projectId: 'admin-console', projectName: 'admin-console（管理后台）', name: 'axios', version: '1.7.7', license: 'MIT', copyright: 'Copyright (c) 2014-present John Jacobs & contributors', refPath: 'package.json › dependencies › axios' },
  { projectId: 'admin-console', projectName: 'admin-console（管理后台）', name: 'highlight.js', version: '11.10.0', license: 'MIT', copyright: 'Copyright (c) 2006, Ivan Sagalaev.', refPath: 'package.json › devDependencies › highlight.js' },
  { projectId: 'admin-console', projectName: 'admin-console（管理后台）', name: 'legacy-parser', version: '2.1.0', license: 'GPL-3.0', copyright: 'Copyright (c) 2019 OldStack Ltd.', refPath: 'package.json › dependencies › legacy-parser' },
  { projectId: 'admin-console', projectName: 'admin-console（管理后台）', name: 'dayjs', version: '1.11.13', license: 'MIT', copyright: 'Copyright (c) 2018-present, iamkun', refPath: 'package.json › dependencies › dayjs' },
  { projectId: 'admin-console', projectName: 'admin-console（管理后台）', name: 'qs', version: '6.13.0', license: 'MIT', copyright: 'Copyright (c) 2014 Nathan LaFreniere and other contributors.', refPath: 'package.json › dependencies › qs' },
];

export function createInitialState(): MergeState {
  const projects: Record<string, SourceProject> = {};
  for (const p of initialProjects) projects[p.id] = { ...p };
  return {
    version: 1,
    projects,
    // 深拷贝，避免外部改动污染初始数据
    entries: initialEntries.map((e) => ({ ...e })),
    decisions: {},
  };
}

const norm = (v: string) => v.trim();

/** 某字段在在册来源中的各边原值 */
export function fieldValues(
  entries: ManifestEntry[],
  field: FieldKey,
): ValueSource[] {
  return entries.map((e) => ({
    projectId: e.projectId,
    projectName: e.projectName,
    refPath: e.refPath,
    value: e[field],
  }));
}

/** 许可证或版权声明原值不同即构成冲突 */
export function hasConflict(values: ValueSource[]): boolean {
  if (values.length < 2) return false;
  const first = norm(values[0].value);
  return values.some((v) => norm(v.value) !== first);
}

function buildField(
  groupKey: string,
  entries: ManifestEntry[],
  field: FieldKey,
  decisions: Record<string, FieldDecision>,
): FieldState {
  const values = fieldValues(entries, field);
  const conflict = hasConflict(values);
  return {
    field,
    values,
    conflict,
    // 非冲突字段不查裁决；冲突字段若已处理则带出快照
    decision: conflict ? decisions[decisionKey(groupKey, field)] : undefined,
  };
}

/**
 * 归并规则核心：按 包名 + 版本 归并，已撤出项目的条目不参与。
 * 裁决表独立于当前来源，撤出项目不会删掉处理结论。
 */
export function computeGroups(state: MergeState): MergedGroup[] {
  const active = state.entries.filter(
    (e) => !state.projects[e.projectId]?.withdrawn,
  );
  const map = new Map<string, ManifestEntry[]>();
  for (const e of active) {
    const key = `${e.name}@${e.version}`;
    const list = map.get(key);
    if (list) list.push(e);
    else map.set(key, [e]);
  }
  const groups: MergedGroup[] = [];
  for (const [key, list] of map) {
    const [name, version] = splitKey(key);
    const fields = {
      license: buildField(key, list, 'license', state.decisions),
      copyright: buildField(key, list, 'copyright', state.decisions),
    };
    const conflictCount =
      (fields.license.conflict ? 1 : 0) +
      (fields.copyright.conflict ? 1 : 0);
    const resolved =
      conflictCount === 0 ||
      ((!fields.license.conflict || Boolean(fields.license.decision)) &&
        (!fields.copyright.conflict || Boolean(fields.copyright.decision)));
    groups.push({ key, name, version, entries: list, fields, conflictCount, resolved });
  }
  return groups.sort((a, b) =>
    Number(a.resolved) - Number(b.resolved) ||
    b.conflictCount - a.conflictCount ||
    a.name.localeCompare(b.name),
  );
}

export function splitKey(key: string): [string, string] {
  const idx = key.lastIndexOf('@');
  return idx <= 0 ? [key, ''] : [key.slice(0, idx), key.slice(idx + 1)];
}

/** 某字段的发布值：已裁决用裁决快照，否则取统一原值 */
export function effectiveValue(field: FieldState): string {
  if (field.decision) return field.decision.value;
  return field.values[0]?.value ?? '';
}

/** 全量未处理完的冲突数；为 0 才能看发布清单 */
export function countPending(groups: MergedGroup[]): number {
  let n = 0;
  for (const g of groups) {
    for (const f of [g.fields.license, g.fields.copyright]) {
      if (f.conflict && !f.decision) n += 1;
    }
  }
  return n;
}

/** 发布清单行：最终许可证/版权 + 全部归属（在册来源与引用路径） */
export interface ReleaseRow {
  name: string;
  version: string;
  license: string;
  copyright: string;
  sources: ValueSource[];
  /** 发布值沿用了某个已撤出来源的历史裁决时标注 */
  decidedFromWithdrawn: boolean;
}

export function buildRelease(state: MergeState): ReleaseRow[] {
  return computeGroups(state).map((g) => {
    const sources: ValueSource[] = g.entries.map((e) => ({
      projectId: e.projectId,
      projectName: e.projectName,
      refPath: e.refPath,
      value: e.license,
    }));
    const decidedFromWithdrawn =
      (g.fields.license.decision &&
        state.projects[g.fields.license.decision.chosenProjectId]?.withdrawn) ||
      (g.fields.copyright.decision &&
        state.projects[g.fields.copyright.decision.chosenProjectId]?.withdrawn) ||
      false;
    return {
      name: g.name,
      version: g.version,
      license: effectiveValue(g.fields.license),
      copyright: effectiveValue(g.fields.copyright),
      sources,
      decidedFromWithdrawn,
    };
  });
}

/**
 * 来源撤出 / 重新并入。
 * 只切换项目标记：归属随在册条目自然增减，裁决表原样保留。
 */
export function setProjectWithdrawn(
  state: MergeState,
  projectId: string,
  withdrawn: boolean,
): MergeState {
  const project = state.projects[projectId];
  if (!project) return state;
  return {
    ...state,
    projects: {
      ...state.projects,
      [projectId]: { ...project, withdrawn },
    },
  };
}

/** 记录一个冲突字段的裁决（可采用某边原值或自定义） */
export function applyDecision(
  state: MergeState,
  groupKey: string,
  field: FieldKey,
  chosen: ValueSource,
  value: string,
  custom: boolean,
): MergeState {
  const decision: FieldDecision = {
    chosenProjectId: chosen.projectId,
    chosenProjectName: chosen.projectName,
    value,
    custom,
    at: new Date().toISOString(),
  };
  return {
    ...state,
    decisions: {
      ...state.decisions,
      [decisionKey(groupKey, field)]: decision,
    },
  };
}

/** 重新比对（清空该字段裁决） */
export function clearDecision(
  state: MergeState,
  groupKey: string,
  field: FieldKey,
): MergeState {
  const key = decisionKey(groupKey, field);
  if (!(key in state.decisions)) return state;
  const decisions = { ...state.decisions };
  delete decisions[key];
  return { ...state, decisions };
}
