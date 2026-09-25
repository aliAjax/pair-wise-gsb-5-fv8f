// 归并规则：纯函数，不依赖存储与 UI
import type {MergedPackage, Resolution, ResolutionMap, SourceManifest} from './types';

export const packageKey = (name: string, version: string) => `${name}@${version}`;

const distinct = (values: string[]) => [...new Set(values)];

/** 把多条来源清单按 包名@版本 归并，保留每条归属的来源项目与引用路径 */
export function mergeManifests(sources: SourceManifest[]): MergedPackage[] {
  const byKey = new Map<string, MergedPackage>();
  for (const source of sources) {
    for (const dep of source.deps) {
      const key = packageKey(dep.name, dep.version);
      let pkg = byKey.get(key);
      if (!pkg) {
        pkg = {
          key,
          name: dep.name,
          version: dep.version,
          attributions: [],
          licenses: [],
          copyrights: [],
          licenseConflict: false,
          copyrightConflict: false,
          conflict: false,
        };
        byKey.set(key, pkg);
      }
      pkg.attributions.push({
        project: source.project,
        path: dep.path,
        license: dep.license,
        copyright: dep.copyright,
      });
    }
  }
  const pkgs = [...byKey.values()];
  for (const pkg of pkgs) {
    pkg.licenses = distinct(pkg.attributions.map(a => a.license));
    pkg.copyrights = distinct(pkg.attributions.map(a => a.copyright));
    // 许可证或版权声明出现两种及以上原值 → 进入冲突
    pkg.licenseConflict = pkg.licenses.length > 1;
    pkg.copyrightConflict = pkg.copyrights.length > 1;
    pkg.conflict = pkg.licenseConflict || pkg.copyrightConflict;
  }
  return pkgs.sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
}

/** 冲突包的每个冲突字段都已选定值，才算处理完成 */
export function isResolved(pkg: MergedPackage, resolution?: Resolution): boolean {
  if (!pkg.conflict) return true;
  if (!resolution) return false;
  if (pkg.licenseConflict && !resolution.license) return false;
  if (pkg.copyrightConflict && !resolution.copyright) return false;
  return true;
}

/** 仍未处理的冲突包 */
export function unresolvedConflicts(pkgs: MergedPackage[], resolutions: ResolutionMap): MergedPackage[] {
  return pkgs.filter(p => p.conflict && !isResolved(p, resolutions[p.key]));
}

/** 生效值：冲突字段取处理结论，一致字段取共同原值 */
export function effectiveLicense(pkg: MergedPackage, resolution?: Resolution): string {
  return pkg.licenseConflict ? resolution?.license ?? '' : pkg.licenses[0] ?? '';
}

export function effectiveCopyright(pkg: MergedPackage, resolution?: Resolution): string {
  return pkg.copyrightConflict ? resolution?.copyright ?? '' : pkg.copyrights[0] ?? '';
}

export interface ReleaseRow {
  key: string;
  name: string;
  version: string;
  license: string;
  copyright: string;
  projects: string[];
}

/** 生成发布清单；尚有未处理冲突时返回 null（看不到发布清单） */
export function buildReleaseManifest(pkgs: MergedPackage[], resolutions: ResolutionMap): ReleaseRow[] | null {
  if (unresolvedConflicts(pkgs, resolutions).length > 0) return null;
  return pkgs.map(pkg => ({
    key: pkg.key,
    name: pkg.name,
    version: pkg.version,
    license: effectiveLicense(pkg, resolutions[pkg.key]),
    copyright: effectiveCopyright(pkg, resolutions[pkg.key]),
    projects: distinct(pkg.attributions.map(a => a.project)),
  }));
}

/** 来源项目撤出：只移除它带来的归属；归并结果由剩余来源重新推导，处理结论保留在 resolutions 中不受影响 */
export function withdrawProject(sources: SourceManifest[], project: string): SourceManifest[] {
  return sources.filter(s => s.project !== project);
}

/** 导入来源清单；同名项目视为重新扫描，整体替换其清单 */
export function upsertManifests(sources: SourceManifest[], incoming: SourceManifest[]): SourceManifest[] {
  const replaced = new Set(incoming.map(m => m.project));
  return [...sources.filter(s => !replaced.has(s.project)), ...incoming];
}
