// 合并审核台的数据模型：来源清单 → 归并包 → 处理结论

/** 某个来源项目上报的一行依赖 */
export interface SourceDep {
  name: string;
  version: string;
  license: string;
  copyright: string;
  /** 引用路径，例如 apps/web/package.json → dependencies */
  path: string;
}

/** 一个来源项目（发布线上的一条前端仓库）提交的依赖清单 */
export interface SourceManifest {
  project: string;
  deps: SourceDep[];
}

/** 归并后的一条归属记录：谁、在哪条路径、上报的原值是什么 */
export interface Attribution {
  project: string;
  path: string;
  license: string;
  copyright: string;
}

/** 按 包名@版本 归并后的包 */
export interface MergedPackage {
  key: string;
  name: string;
  version: string;
  attributions: Attribution[];
  /** 各方上报的去重后的许可证原值 */
  licenses: string[];
  /** 各方上报的去重后的版权声明原值 */
  copyrights: string[];
  licenseConflict: boolean;
  copyrightConflict: boolean;
  conflict: boolean;
}

/** 一条处理结论：只记录冲突字段的选定值 */
export interface Resolution {
  license?: string;
  copyright?: string;
  note?: string;
  resolvedAt: string;
}

export type ResolutionMap = Record<string, Resolution>;

/** 审核台的持久化状态：来源清单 + 处理结论，归并结果由二者推导 */
export interface ReviewState {
  sources: SourceManifest[];
  resolutions: ResolutionMap;
}
