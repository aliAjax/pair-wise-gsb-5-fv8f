import {AlertTriangle, CheckCircle2, Download, Lock} from 'lucide-react';
import {MergeReviewApi} from '../hooks/useMergeReview';

export default function ReleasePage({api, onGoReview}: {api: MergeReviewApi; onGoReview: () => void}) {
  const {release, pending} = api;

  const exportMd = () => {
    const lines: string[] = ['# 发布许可证清单', '', `生成时间：${new Date().toLocaleString('zh-CN')}`, ''];
    for (const r of release) {
      lines.push(`## ${r.name}@${r.version}`);
      lines.push(`- 许可证：${r.license}`);
      lines.push(`- 版权声明：${r.copyright}`);
      lines.push('- 归属来源：');
      for (const s of r.sources) lines.push(`  - ${s.projectName} · ${s.refPath}`);
      lines.push('');
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], {type: 'text/markdown'}));
    a.download = 'release-attribution.md';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <header>
        <div>
          <div className="crumb">RELEASE LINE / <b>PUBLICATION MANIFEST</b></div>
          <h1>发布清单</h1>
          <p>冲突全部裁决后生成；每个包保留所有在册来源项目与引用路径作为归属。</p>
        </div>
        {pending === 0 && (
          <div className="head-actions">
            <button className="primary" onClick={exportMd}><Download size={15}/>导出版权归属</button>
          </div>
        )}
      </header>

      {pending > 0 ? (
        <section className="release-lock">
          <div className="lock-icon"><Lock size={26}/></div>
          <h2>冲突未处理完，发布清单暂不可见</h2>
          <p>还剩 <b className="red">{pending}</b> 个许可证 / 版权声明冲突等待裁决。处理完后此页自动解锁，无需重新归并。</p>
          <button className="primary" onClick={onGoReview}><AlertTriangle size={15}/>回到合并审核台</button>
        </section>
      ) : (
        <>
          <section className="gate-banner ok">
            <CheckCircle2 size={17}/>
            <div>
              <b>审核完成：{release.length} 个包均可发布</b>
              <p>发布值已按裁决归并；来源项目撤出只会移除其归属行，已做裁决继续保留。</p>
            </div>
          </section>
          <section className="table-pane release-pane">
            <div className="pane-head">
              <div><h2>发布许可证清单</h2><p>包名@版本归并，归属按来源逐条保留</p></div>
            </div>
            <div className="release-list">
              {release.map((r) => (
                <div className="release-row" key={`${r.name}@${r.version}`}>
                  <div className="release-main">
                    <span className="pkg-name">{r.name}</span>
                    <span className="pkg-version">{r.version}</span>
                    <div className="release-fields">
                      <span className="license-final">{r.license}</span>
                      <p className="copyright-final">{r.copyright}</p>
                    </div>
                  </div>
                  <div className="release-sources">
                    {r.sources.map((s, i) => (
                      <div className="attr-row" key={`${s.projectId}-${i}`}>
                        <span className="proj-tag">{s.projectName}</span>
                        <code>{s.refPath}</code>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
