// 许可证依赖清单归并的领域模型

/** 需要归并比对的字段：许可证、版权声明 */
export type FieldKey = 'license' | 'copyright';

export const FIELD_LABELS: Record<FieldKey, string> = {
  license: '许可证',
  copyright: '版权声明',
};

/** 来源项目（并入同一条发布线的前端仓库） */
export interface SourceProject {
  id: string;
  name: string;
  repo: string;
  /** 撤出后不再参与归并、其归属从发布清单移除，但历史裁决保留 */
  withdrawn: boolean;
}

/** 一条依赖清单条目，来自某个来源项目 */
export interface ManifestEntry {
  projectId: string;
  projectName: string;
  name: string;
  version: string;
  license: string;
  copyright: string;
  /** 在来源项目中的引用路径，例如 package.json › dependencies › react */
  refPath: string;
}

/** 某个字段的一边原值（带归属） */
export interface ValueSource {
  projectId: string;
  projectName: string;
  refPath: string;
  value: string;
}

/**
 * 审核裁决。按 groupKey::field 存放。
 * 保存值快照：来源项目撤出后，结论依然完整保留。
 */
export interface FieldDecision {
  /** 采用的来源项目 id；自定义时值为 '' */
  chosenProjectId: string;
  chosenProjectName: string;
  /** 裁决采用的值快照 */
  value: string;
  custom: boolean;
  at: string;
}

export interface FieldState {
  field: FieldKey;
  /** 各来源的原值（仅含在册项目） */
  values: ValueSource[];
  /** 各来源原值是否不一致 */
  conflict: boolean;
  decision?: FieldDecision;
}

export interface MergedGroup {
  /** name@version */
  key: string;
  name: string;
  version: string;
  /** 在册来源条目 */
  entries: ManifestEntry[];
  fields: Record<FieldKey, FieldState>;
  /** 该组冲突字段数 */
  conflictCount: number;
  /** 所有冲突字段是否都已裁决 */
  resolved: boolean;
}

export interface MergeState {
  version: 1;
  projects: Record<string, SourceProject>;
  entries: ManifestEntry[];
  /** key 为 `${groupKey}::${field}`，重开后据此续审 */
  decisions: Record<string, FieldDecision>;
}

export const decisionKey = (groupKey: string, field: FieldKey): string =>
  `${groupKey}::${field}`;

export const groupKeyOf = (name: string, version: string): string =>
  `${name}@${version}`;
