import {useMemo, useState} from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  FileCode2,
  GitMerge,
  Lock,
  Package,
  Pencil,
  RotateCcw,
  Search,
  Undo2,
  XCircle,
} from 'lucide-react';
import {MergeReviewApi} from '../hooks/useMergeReview';
import {FIELD_LABELS, FieldKey, FieldState, MergedGroup, ValueSource} from '../merge/types';

type Filter = 'all' | 'conflict' | 'resolved';

export default function MergeReviewPage({api}: {api: MergeReviewApi}) {
  const {state, groups, pending, setWithdrawn, resetAll} = api;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const projects = Object.values(state.projects);
  const conflictGroups = groups.filter((g) => g.conflictCount > 0).length;

  const visible = useMemo(
    () =>
      groups.filter((g) => {
        if (filter === 'conflict' && g.resolved) return false;
        if (filter === 'resolved' && !g.resolved) return false;
        return `${g.name}@${g.version}`.toLowerCase().includes(query.toLowerCase());
      }),
    [groups, filter, query],
  );

  return (
    <>
      <header>
        <div>
          <div className="crumb">WORKSPACE / <b>RELEASE LINE · MERGE</b></div>
          <h1>合并审核台</h1>
          <p>多份依赖清单按「包名 + 版本」归并；许可证或版权声明不一致的冲突逐项裁决后，才能生成发布清单。</p>
        </div>
        <div className="head-actions">
          <button className="outline" onClick={resetAll} title="清空已保存的裁决，回到两份清单初始状态">
            <RotateCcw size={15}/>重置审核
          </button>
        </div>
      </header>

      {/* 发布线与来源项目 */}
      <section className="merge-board">
        <div className="release-line">
          <GitMerge size={18}/>
          <div>
            <b>同一条发布线</b>
            <small>前端仓库合入后，依赖在此统一归并审核</small>
          </div>
        </div>
        <div className="project-flow">
          {projects.map((p) => (
            <div key={p.id} className={`project-chip ${p.withdrawn ? 'withdrawn' : ''}`}>
              <FileCode2 size={15}/>
              <div className="chip-text">
                <b>{p.name}</b>
                <small>{p.repo}</small>
              </div>
              {p.withdrawn ? (
                <button className="chip-btn restore" onClick={() => setWithdrawn(p.id, false)} title="重新并入发布线">
                  <Undo2 size={13}/>恢复
                </button>
              ) : (
                <button className="chip-btn withdraw" onClick={() => setWithdrawn(p.id, true)} title="撤出：仅移除它带来的归属，裁决保留">
                  <XCircle size={13}/>撤出
                </button>
              )}
            </div>
          ))}
          <ChevronRight className="flow-arrow" size={18}/>
          <div className={`release-target ${pending > 0 ? 'locked' : ''}`}>
            {pending > 0 ? <Lock size={16}/> : <Package size={16}/>}
            <b>发布清单</b>
            <small>{pending > 0 ? `还差 ${pending} 项裁决` : '审核完成，可查看'}</small>
          </div>
        </div>
      </section>

      {/* 未处理完的硬性闸门：看不到发布清单 */}
      {pending > 0 && (
        <section className="gate-banner">
          <AlertTriangle size={17}/>
          <div>
            <b>发布清单已锁定：还有 {pending} 个冲突没有处理完</b>
            <p>冲突包 {conflictGroups} 个。逐项采用某一边原值或给出统一值后，发布清单自动解锁。</p>
          </div>
        </section>
      )}

      <section className="summary merge-summary">
        <div><span>归并后包数（包名@版本）</span><b>{groups.length}</b><small>同名不同版本各自成组</small></div>
        <div><span>含冲突的包</span><b className="orange">{conflictGroups}</b><small>许可证 / 版权声明不一致</small></div>
        <div><span>待裁决字段</span><b className="red">{pending}</b><small>未归零前无法发布</small></div>
        <div><span>已归并一致</span><b className="teal">{groups.filter((g) => g.conflictCount === 0).length}</b><small>直接沿用统一原值</small></div>
      </section>

      <section className="table-pane merge-pane">
        <div className="pane-head">
          <div><h2>归并结果（{visible.length}）</h2><p>每组保留全部来源项目与引用路径</p></div>
          <div className="tools">
            <div className="search"><Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索包名"/></div>
            <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
              <option value="all">全部</option>
              <option value="conflict">仅待处理</option>
              <option value="resolved">仅已处理</option>
            </select>
          </div>
        </div>
        <div className="group-list">
          {visible.length === 0 && <div className="empty">没有匹配的包</div>}
          {visible.map((g) => <GroupCard key={g.key} group={g} api={api}/>)}
        </div>
      </section>
    </>
  );
}

function GroupCard({group, api}: {group: MergedGroup; api: MergeReviewApi}) {
  return (
    <div className={`group-card ${group.resolved ? 'resolved' : 'open'}`}>
      <div className="group-head">
        <span className="pkg-name"><Package size={14}/> {group.name}</span>
        <span className="pkg-version">{group.version}</span>
        <span className="source-count">{group.entries.length} 个来源</span>
        <span className={`group-badge ${group.resolved ? 'ok' : 'bad'}`}>
          {group.resolved ? <><CheckCircle2 size={13}/> 已处理</> : <><AlertTriangle size={13}/> {group.conflictCount} 项冲突</>}
        </span>
      </div>

      {(['license', 'copyright'] as FieldKey[]).map((f) => (
        <FieldBlock key={f} group={group} field={group.fields[f]} api={api}/>
      ))}

      <div className="attribution">
        <span className="attr-title">来源与引用路径（归属）</span>
        <div className="attr-list">
          {group.entries.map((e, i) => (
            <div className="attr-row" key={`${e.projectId}-${i}`}>
              <span className="proj-tag">{e.projectName}</span>
              <code>{e.refPath}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FieldBlock({group, field, api}: {group: MergedGroup; field: FieldState; api: MergeReviewApi}) {
  const {resolve, reopen} = api;
  const [custom, setCustom] = useState(false);
  const [text, setText] = useState('');
  const label = FIELD_LABELS[field.field];

  if (!field.conflict) {
    return (
      <div className="field-block agreed">
        <div className="field-label"><Check size={13}/> {label}一致</div>
        <div className="agreed-value">{field.values[0]?.value}</div>
      </div>
    );
  }

  // 去重后的候选原值（值相同的来源合并展示，但逐条保留出处）
  const distinct: {value: string; sources: ValueSource[]}[] = [];
  for (const v of field.values) {
    const hit = distinct.find((d) => d.value === v.value);
    if (hit) hit.sources.push(v);
    else distinct.push({value: v.value, sources: [v]});
  }

  const choose = (v: ValueSource) => {
    setCustom(false);
    resolve(group.key, field.field, v, v.value, false);
  };
  const submitCustom = () => {
    if (!text.trim()) return;
    resolve(group.key, field.field, {projectId: '', projectName: '自定义统一值', refPath: '', value: text.trim()}, text.trim(), true);
    setText('');
    setCustom(false);
  };

  return (
    <div className={`field-block conflict ${field.decision ? 'decided' : ''}`}>
      <div className="field-label">
        <AlertTriangle size={13}/> {label}冲突
        {field.decision && <span className="decided-tag"><Check size={12}/> 已裁决</span>}
      </div>

      {/* 两边原值并列指出 */}
      <div className="value-candidates">
        {field.values.map((v, i) => (
          <div className="value-side" key={`${v.projectId}-${i}`}>
            <div className="side-head">
              <span className="proj-tag">{v.projectName}</span>
              <code className="side-path">{v.refPath}</code>
            </div>
            <pre className="side-value">{v.value}</pre>
          </div>
        ))}
      </div>

      {field.decision ? (
        <div className="decision-line">
          <Check size={14}/>
          <span>
            发布采用：<b>{field.decision.value}</b>
            <em>
              {field.decision.custom
                ? '（自定义统一值）'
                : `（采用 ${field.decision.chosenProjectName} 一边）`}
              {' '}· {new Date(field.decision.at).toLocaleString('zh-CN')}
            </em>
          </span>
          <button className="link-btn" onClick={() => reopen(group.key, field.field)}>
            <Undo2 size={13}/>重新比对
          </button>
        </div>
      ) : (
        <div className="decision-actions">
          {distinct.map((d) => (
            <button key={d.value} className="candidate-btn" onClick={() => choose(d.sources[0])}>
              <Check size={13}/> 采用该值
              <code title={d.value}>{d.value.length > 44 ? d.value.slice(0, 44) + '…' : d.value}</code>
              <small>{d.sources.map((s) => s.projectName).join('、')}</small>
            </button>
          ))}
          {custom ? (
            <div className="custom-editor">
              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`输入统一的${label}`}
                rows={2}
              />
              <div>
                <button className="primary small" onClick={submitCustom}>确认统一值</button>
                <button className="link-btn" onClick={() => setCustom(false)}>取消</button>
              </div>
            </div>
          ) : (
            <button className="candidate-btn ghost" onClick={() => setCustom(true)}>
              <Pencil size={13}/> 自定义统一值
            </button>
          )}
        </div>
      )}
    </div>
  );
}
