// 领域归并规则验证：纯规则层（src/merge）无 React/浏览器依赖，
// 先临时转译成 CommonJS 再执行，避免把测试逻辑混进页面。
// 运行：node scripts/check-rules.cjs
const {execFileSync} = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'license-lens-'));
try {
  execFileSync(
    process.execPath,
    [
      path.join(ROOT, 'node_modules/typescript/lib/tsc.js'),
      '--ignoreConfig',
      '--module', 'commonjs',
      '--target', 'ES2020',
      '--outDir', out,
      '--rootDir', path.join(ROOT, 'src'),
      path.join(ROOT, 'src/merge/types.ts'),
      path.join(ROOT, 'src/merge/rules.ts'),
    ],
    {stdio: 'pipe'},
  );
  const rules = require(path.join(out, 'merge/rules.js'));
  run(rules);
} finally {
  fs.rmSync(out, {recursive: true, force: true});
}

function run(rules) {
  let pass = 0, fail = 0;
  const ok = (name, cond) => { cond ? (pass++, console.log('  ✓', name)) : (fail++, console.log('  ✗', name)); };

  let state = rules.createInitialState();
  let groups = rules.computeGroups(state);

  console.log('1) 归并与冲突检测');
  ok('按 name@version 归并为 8 组', groups.length === 8);
  const axios = groups.find((g) => g.name === 'axios');
  ok('axios 版权声明冲突', axios.fields.copyright.conflict === true && axios.fields.license.conflict === false);
  const hljs = groups.find((g) => g.name === 'highlight.js');
  ok('highlight.js 许可证冲突', hljs.fields.license.conflict === true);
  const qs = groups.find((g) => g.name === 'qs');
  ok('qs 许可证冲突、版权一致', qs.fields.license.conflict && !qs.fields.copyright.conflict);
  const react = groups.find((g) => g.name === 'react');
  ok('react 无冲突且有两个归属', react.conflictCount === 0 && react.entries.length === 2);
  ok('每组保留引用路径', react.entries.every((e) => e.refPath.includes('package.json')));

  console.log('2) 发布闸门');
  ok('初始有 3 个待裁决字段', rules.countPending(groups) === 3);

  console.log('3) 裁决流程');
  // highlight.js 采用商城前端一边的 BSD-3-Clause
  const v = hljs.fields.license.values.find((x) => x.projectId === 'storefront-web');
  state = rules.applyDecision(state, hljs.key, 'license', v, v.value, false);
  groups = rules.computeGroups(state);
  ok('裁决后 pending 减少', rules.countPending(groups) === 2);
  const hljs2 = groups.find((g) => g.name === 'highlight.js');
  ok('发布值采用裁决快照 BSD-3-Clause', rules.effectiveValue(hljs2.fields.license) === 'BSD-3-Clause');

  console.log('4) 来源撤出：只移除其归属，结论保留');
  const beforeDecisions = Object.keys(state.decisions).length;
  state = rules.setProjectWithdrawn(state, 'admin-console', true);
  groups = rules.computeGroups(state);
  ok('裁决表不动', Object.keys(state.decisions).length === beforeDecisions);
  const hljs3 = groups.find((g) => g.name === 'highlight.js');
  ok('撤出后该包只剩 1 个归属', hljs3.entries.length === 1 && hljs3.entries[0].projectId === 'storefront-web');
  ok('撤出后许可证字段不再冲突（剩一边）', hljs3.fields.license.conflict === false);
  ok('发布值仍是裁决快照 BSD-3-Clause（保留结论）', rules.effectiveValue(hljs3.fields.license) === 'BSD-3-Clause');
  const adminOnly = groups.find((g) => g.name === 'chart.js');
  ok('仅管理后台带来的 chart.js 随撤出消失', adminOnly === undefined);
  const release = rules.buildRelease(state);
  ok('发布清单不含已撤出归属', release.every((r) => r.sources.every((s) => s.projectId === 'storefront-web')));
  ok('全部冲突随撤出去除，发布解锁', rules.countPending(groups) === 0);

  console.log('5) 来源恢复：条目回来，历史裁决仍在');
  state = rules.setProjectWithdrawn(state, 'admin-console', false);
  groups = rules.computeGroups(state);
  ok('恢复后包数回到 8', groups.length === 8);
  const hljs4 = groups.find((g) => g.name === 'highlight.js');
  ok('恢复后冲突重现但已有裁决，直接为已处理', hljs4.fields.license.conflict === true && Boolean(hljs4.fields.license.decision));
  ok('其余 2 个冲突仍待处理', rules.countPending(groups) === 2);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
