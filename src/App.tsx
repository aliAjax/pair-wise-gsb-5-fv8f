import {useState} from 'react';
import {AlertTriangle, ChevronDown, FileCode2, GitMerge, Layers3, Lock, PackageCheck, ShieldCheck, Sparkles} from 'lucide-react';
import {useMergeReview} from './hooks/useMergeReview';
import OverviewPage from './pages/OverviewPage';
import MergeReviewPage from './pages/MergeReviewPage';
import ReleasePage from './pages/ReleasePage';

type View = 'overview' | 'merge' | 'release';

export default function App() {
  // 审核状态挂在外壳上：切换页面、关闭重开都能接着审
  const api = useMergeReview();
  const [view, setView] = useState<View>('merge');
  const {groups, pending, state} = api;
  const riskCount = groups.filter((g) => g.fields.license.values.some((v) => v.value === 'GPL-3.0')).length;

  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <div className="brand-icon"><ShieldCheck size={18}/></div>
          <div><b>License Lens</b><small>dependency clarity</small></div>
        </div>
        <div className="nav-title">WORKSPACE</div>
        <button className={`nav ${view === 'overview' ? 'active' : ''}`} onClick={() => setView('overview')}>
          <Layers3 size={16}/>依赖总览
        </button>
        <button className={`nav ${view === 'merge' ? 'active' : ''}`} onClick={() => setView('merge')}>
          <GitMerge size={16}/>合并审核台
          {pending > 0 && <span className="red">{pending}</span>}
        </button>
        <button className={`nav ${view === 'release' ? 'active' : ''}`} onClick={() => setView('release')}>
          {pending > 0 ? <Lock size={16}/> : <PackageCheck size={16}/>}发布清单
          {pending > 0 ? <span className="red">锁定</span> : <span>就绪</span>}
        </button>
        <button className="nav">
          <FileCode2 size={16}/>归并后包数 <span>{groups.length}</span>
        </button>
        <button className="nav">
          <AlertTriangle size={16}/>高风险许可 <span className="red">{riskCount}</span>
        </button>
        <div className="aside-bottom">
          <div className="mini-card">
            <Sparkles size={16}/>
            <div>
              <b>{pending > 0 ? `待处理冲突 ${pending} 项` : '冲突已全部处理'}</b>
              <small>{Object.values(state.projects).filter((p) => !p.withdrawn).length} 个来源项目在发布线上</small>
            </div>
          </div>
          <div className="user">
            <div className="avatar">ZL</div><span>Zen Li</span><ChevronDown size={14}/>
          </div>
        </div>
      </aside>
      <main>
        {view === 'overview' && <OverviewPage/>}
        {view === 'merge' && <MergeReviewPage api={api}/>}
        {view === 'release' && <ReleasePage api={api} onGoReview={() => setView('merge')}/>}
      </main>
    </div>
  );
}
