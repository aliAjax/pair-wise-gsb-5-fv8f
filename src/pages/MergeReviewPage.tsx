import {useEffect,useState} from 'react';
import {AlertTriangle,Check,Download,FolderGit2,GitMerge,Lock,RotateCcw,ShieldCheck,Upload,X} from 'lucide-react';
import type {Resolution} from '../merge/types';
import {buildReleaseManifest,isResolved} from '../merge/mergeRules';
import {sampleSources} from '../merge/sampleSources';
import type {useMergeReview} from '../merge/useMergeReview';

type Review=ReturnType<typeof useMergeReview>;

const licColors:Record<string,string>={MIT:'#35b995','BSD-3-Clause':'#6d9ee8','GPL-3.0':'#ec8c75','Apache-2.0':'#b18ee4',ISC:'#6d9ee8'};

export default function MergeReviewPage({review}:{review:Review}){
  const {state,packages,pending,importSources,withdraw,resolve,reopen}=review;
  const [selectedKey,setSelectedKey]=useState('');
  const selected=packages.find(p=>p.key===selectedKey);
  const [draft,setDraft]=useState({license:'',copyright:'',note:''});
  useEffect(()=>{
    const r=selected?state.resolutions[selected.key]:undefined;
    setDraft({license:r?.license??'',copyright:r?.copyright??'',note:r?.note??''});
  },[selectedKey,state.resolutions]);// 切换包或结论变化时重置草稿

  const release=buildReleaseManifest(packages,state.resolutions);
  const resolvedCount=packages.filter(p=>p.conflict&&isResolved(p,state.resolutions[p.key])).length;

  const exportRelease=()=>{
    if(!release)return;
    const text=`# 发布清单\n\n| 依赖 | 版本 | 许可证 | 版权声明 | 来源项目 |\n|---|---|---|---|---|\n${release.map(r=>`| ${r.name} | ${r.version} | ${r.license} | ${r.copyright} | ${r.projects.join('、')} |`).join('\n')}`;
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([text],{type:'text/markdown'}));
    a.download='release-manifest.md';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const needsLicense=!!selected?.licenseConflict;
  const needsCopyright=!!selected?.copyrightConflict;
  const canSubmit=!!selected&&(!needsLicense||!!draft.license)&&(!needsCopyright||!!draft.copyright);
  const submit=()=>{
    if(!selected||!canSubmit)return;
    const res:Resolution={resolvedAt:new Date().toISOString()};
    if(selected.licenseConflict)res.license=draft.license;
    if(selected.copyrightConflict)res.copyright=draft.copyright;
    if(draft.note.trim())res.note=draft.note.trim();
    resolve(selected.key,res);
    const next=pending.find(p=>p.key!==selected.key);
    if(next)setSelectedKey(next.key);// 自动跳到下一个待处理冲突，接着审核
  };

  return <main>
    <header>
      <div>
        <div className="crumb">RELEASE TRAIN / <b>MERGE REVIEW</b></div>
        <h1>合并审核台</h1>
        <p>同一条发布线上各前端的依赖清单在此按 包名@版本 归并，冲突处理完成后才生成发布清单。</p>
      </div>
      <div className="head-actions">
        <button className="outline" onClick={()=>importSources(sampleSources)}><Upload size={15}/>同步示例来源</button>
        <button className="primary" disabled={!release||release.length===0} onClick={exportRelease}><Download size={15}/>导出发布清单</button>
      </div>
    </header>

    <section className="src-strip">
      {state.sources.map(s=><div className="src-card" key={s.project}>
        <div className="src-icon"><FolderGit2 size={16}/></div>
        <div className="src-meta"><b>{s.project}</b><small>{s.deps.length} 个依赖 · 归属 {packages.filter(p=>p.attributions.some(a=>a.project===s.project)).length} 个归并包</small></div>
        <button className="icon-btn" title="撤出该来源" onClick={()=>{if(window.confirm(`将 ${s.project} 撤出发布线？\n只移除它带来的归属，其他来源与处理结论保留。`))withdraw(s.project)}}><X size={14}/></button>
      </div>)}
      {state.sources.length===0&&<div className="src-empty">
        <GitMerge size={18}/>
        <div><b>还没有来源清单</b><small>把发布线上各前端仓库的扫描结果接进来，这里会按 包名@版本 自动归并。</small></div>
        <button className="primary" onClick={()=>importSources(sampleSources)}><Upload size={15}/>载入示例来源</button>
      </div>}
    </section>

    <section className="summary">
      <div><span>归并后依赖</span><b>{packages.length}</b><small>按 包名@版本 去重</small></div>
      <div><span>来源项目</span><b>{state.sources.length}</b><small>{state.sources.map(s=>s.project).join('、')||'—'}</small></div>
      <div><span>待处理冲突</span><b className="red">{pending.length}</b><small>处理完才生成发布清单</small></div>
      <div><span>已处理结论</span><b className="teal">{resolvedCount}</b><small>重开后继续生效</small></div>
    </section>

    {packages.length>0&&<>
    <section className="workspace">
      <div className="table-pane">
        <div className="pane-head"><div><h2>归并结果</h2><p>同名同版本合并为一行，归属全部保留</p></div></div>
        <div className="table mp">
          <div className="tr th"><span>依赖</span><span>来源项目</span><span>许可证</span><span>状态</span></div>
          {packages.map(p=>{
            const done=isResolved(p,state.resolutions[p.key]);
            const projects=[...new Set(p.attributions.map(a=>a.project))];
            return <button className={p.key===selectedKey?'tr selected':'tr'} key={p.key} onClick={()=>setSelectedKey(p.key)}>
              <span className="dep-name"><span className="pkg-dot"/>{p.name}<span className="ver">@{p.version}</span></span>
              <span className="srcs">{projects.map(pr=><i className="chip" key={pr}>{pr}</i>)}</span>
              <span>{p.licenseConflict?<span className="multi">{p.licenses.length} 个值</span>:<i className="license" style={{color:licColors[p.licenses[0]]||'#888',background:(licColors[p.licenses[0]]||'#888')+'18'}}>{p.licenses[0]}</i>}</span>
              <span className={'status '+(p.conflict?(done?'ok':'risk'):'ok')}>{p.conflict?(done?<><Check size={13}/>已处理</>:<><AlertTriangle size={13}/>冲突</>):<><Check size={13}/>一致</>}</span>
            </button>;
          })}
        </div>
      </div>

      {selected?<div className="detail">
        <div className="detail-head">
          <div className="detail-icon" style={{background:'#2eab8e1c',color:'#2eab8e'}}><GitMerge size={20}/></div>
          <div><span>MERGED PACKAGE</span><h2>{selected.name}@{selected.version}</h2></div>
          <button className="close" onClick={()=>setSelectedKey('')}><X size={16}/></button>
        </div>

        <div className="block-title">归属 · {selected.attributions.length} 条（来源项目 / 引用路径 / 各方原值）</div>
        {selected.attributions.map((a,i)=><div className="attr" key={a.project+a.path+i}>
          <div className="attr-head"><span className="proj">{a.project}</span><span className="path">{a.path}</span></div>
          <div className="attr-vals">
            <div><label>许可证</label><b className={selected.licenseConflict?'diff':''}>{a.license}</b></div>
            <div><label>版权声明</label><b className={selected.copyrightConflict?'diff':''}>{a.copyright}</b></div>
          </div>
        </div>)}

        {!selected.conflict&&<div className="finding ok"><div className="finding-icon"><Check size={16}/></div><div><b>各方上报一致</b><p>所有来源给出的许可证与版权声明相同，无需处理，直接进入发布清单。</p></div></div>}

        {selected.conflict&&!isResolved(selected,state.resolutions[selected.key])&&<div className="conflict-form">
          {needsLicense&&<div className="fc">
            <div className="fc-title"><AlertTriangle size={13}/>许可证冲突 · 两边原值如下，选择生效值</div>
            {selected.licenses.map(v=>{const from=selected.attributions.filter(a=>a.license===v).map(a=>a.project);
              return <label className={draft.license===v?'opt chosen':'opt'} key={v}>
                <input type="radio" checked={draft.license===v} onChange={()=>setDraft(d=>({...d,license:v}))}/>
                <span className="opt-value">{v}</span>
                <span className="opt-from">来自 {from.join('、')}</span>
              </label>;})}
          </div>}
          {needsCopyright&&<div className="fc">
            <div className="fc-title"><AlertTriangle size={13}/>版权声明冲突 · 两边原值如下，选择生效值</div>
            {selected.copyrights.map(v=>{const from=selected.attributions.filter(a=>a.copyright===v).map(a=>a.project);
              return <label className={draft.copyright===v?'opt chosen':'opt'} key={v}>
                <input type="radio" checked={draft.copyright===v} onChange={()=>setDraft(d=>({...d,copyright:v}))}/>
                <span className="opt-value">{v}</span>
                <span className="opt-from">来自 {from.join('、')}</span>
              </label>;})}
          </div>}
          <label className="note-label">处理备注（可选）<input value={draft.note} onChange={e=>setDraft(d=>({...d,note:e.target.value}))} placeholder="例如：以法务确认的 SPDX 为准"/></label>
          <button className="primary full" disabled={!canSubmit} onClick={submit}><Check size={15}/>确认处理结论</button>
        </div>}

        {selected.conflict&&isResolved(selected,state.resolutions[selected.key])&&(()=>{const res=state.resolutions[selected.key];
          return <div className="conclusion">
            <div className="block-title"><ShieldCheck size={14}/>处理结论 · {new Date(res.resolvedAt).toLocaleString()}</div>
            {selected.licenseConflict&&<div className="c-row"><label>许可证定为</label><b>{res.license}</b></div>}
            {selected.copyrightConflict&&<div className="c-row"><label>版权声明定为</label><b>{res.copyright}</b></div>}
            {res.note&&<p className="c-note">备注:{res.note}</p>}
            <button className="outline sm" onClick={()=>reopen(selected.key)}><RotateCcw size={13}/>撤销结论，重新处理</button>
          </div>;})()}
      </div>:<div className="detail placeholder"><GitMerge size={22}/><p>选择左侧依赖，查看归属与冲突原值。</p></div>}
    </section>

    <section className="release">
      <div className="pane-head">
        <div><h2>发布清单</h2><p>{release?'所有冲突已处理，可按此清单发布':'冲突全部处理完成后才会生成'}</p></div>
        {release&&<button className="outline" onClick={exportRelease}><Download size={15}/>导出发布清单</button>}
      </div>
      {release?<div className="rel-table">
        <div className="rel-tr rel-th"><span>依赖</span><span>版本</span><span>许可证</span><span>版权声明</span><span>来源项目</span></div>
        {release.map(r=><div className="rel-tr" key={r.key}>
          <span className="dep-name">{r.name}</span><span className="muted">{r.version}</span><span>{r.license}</span><span className="muted">{r.copyright}</span><span>{r.projects.join('、')}</span>
        </div>)}
      </div>:<div className="locked">
        <div className="lock-icon"><Lock size={18}/></div>
        <div><b>发布清单未解锁</b><p>还有 {pending.length} 个冲突未处理，全部处理完成后才能查看发布清单。</p></div>
        <div className="pending-chips">{pending.map(p=><button key={p.key} onClick={()=>setSelectedKey(p.key)}>{p.name}@{p.version}</button>)}</div>
      </div>}
    </section>
    </>}
  </main>;
}
