import {useEffect,useState} from 'react';
import {AlertTriangle,ChevronDown,FileCode2,GitMerge,Layers3,ShieldCheck,Sparkles} from 'lucide-react';
import OverviewPage,{initialDeps} from './pages/OverviewPage';
import type {Dep} from './pages/OverviewPage';
import MergeReviewPage from './pages/MergeReviewPage';
import {useMergeReview} from './merge/useMergeReview';
export default function App(){
  const [page,setPage]=useState<'overview'|'merge'>('overview');
  const [deps,setDeps]=useState<Dep[]>(()=>{try{return JSON.parse(localStorage.getItem('license-lens')||'')||initialDeps}catch{return initialDeps}});
  useEffect(()=>localStorage.setItem('license-lens',JSON.stringify(deps)),[deps]);
  const review=useMergeReview();
  const pendingCount=review.pending.length;
  return <div className="shell"><aside><div className="brand"><div className="brand-icon"><ShieldCheck size={18}/></div><div><b>License Lens</b><small>dependency clarity</small></div></div><div className="nav-title">WORKSPACE</div><button className={page==='overview'?'nav active':'nav'} onClick={()=>setPage('overview')}><Layers3 size={16}/>依赖总览</button><button className={page==='merge'?'nav active':'nav'} onClick={()=>setPage('merge')}><GitMerge size={16}/>合并审核台 {pendingCount>0&&<span className="red">{pendingCount}</span>}</button><button className="nav"><FileCode2 size={16}/>许可证清单 <span>{deps.length}</span></button><button className="nav"><AlertTriangle size={16}/>待处理风险 <span className="red">{deps.filter(d=>d.status==='risk').length}</span></button><div className="aside-bottom"><div className="mini-card"><Sparkles size={16}/><div><b>扫描已更新</b><small>刚刚完成 5 个依赖的分析</small></div></div><div className="user"><div className="avatar">ZL</div><span>Zen Li</span><ChevronDown size={14}/></div></div></aside>{page==='overview'?<OverviewPage deps={deps} setDeps={setDeps}/>:<MergeReviewPage review={review}/>}</div>;
}
