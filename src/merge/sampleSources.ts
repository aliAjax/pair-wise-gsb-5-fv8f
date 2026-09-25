// 示例来源：同一条发布线上的两个前端仓库各自扫描出的依赖清单
import type {SourceManifest} from './types';

export const sampleSources: SourceManifest[] = [
  {
    project: 'aurora-web',
    deps: [
      {name: 'react', version: '18.3.1', license: 'MIT', copyright: 'Copyright (c) Meta Platforms, Inc. and affiliates.', path: 'apps/web/package.json → dependencies'},
      {name: 'lodash', version: '4.17.21', license: 'MIT', copyright: 'Copyright OpenJS Foundation and other contributors.', path: 'apps/web/package.json → dependencies'},
      {name: 'axios', version: '1.7.7', license: 'MIT', copyright: 'Copyright (c) 2014-present Matt Zabriskie.', path: 'apps/web/src/api/client.ts'},
      {name: 'chart.js', version: '4.4.4', license: 'MIT', copyright: 'Copyright (c) 2014-2024 Chart.js Contributors.', path: 'apps/web/src/charts/Trend.tsx'},
      {name: 'left-pad-pro', version: '1.3.0', license: 'MIT', copyright: 'Copyright (c) 2020 Aurora Team.', path: 'apps/web/package.json → dependencies'},
      {name: 'zustand', version: '4.5.5', license: 'MIT', copyright: 'Copyright (c) 2019 Paul Henschel.', path: 'apps/web/src/store.ts'},
      {name: 'semver', version: '7.6.3', license: 'ISC', copyright: 'Copyright (c) Isaac Z. Schlueter and Contributors.', path: 'apps/web/scripts/release.ts'},
      {name: 'highlight.js', version: '11.10.0', license: 'BSD-3-Clause', copyright: 'Copyright (c) 2006, Ivan Sagalaev.', path: 'apps/web/src/components/Code.tsx'},
    ],
  },
  {
    project: 'aurora-admin',
    deps: [
      {name: 'react', version: '18.3.1', license: 'MIT', copyright: 'Copyright (c) Meta Platforms, Inc. and affiliates.', path: 'apps/admin/package.json → dependencies'},
      {name: 'lodash', version: '4.17.21', license: 'MIT', copyright: 'Copyright OpenJS Foundation and other contributors.', path: 'apps/admin/package.json → dependencies'},
      {name: 'axios', version: '1.7.7', license: 'MIT', copyright: 'Copyright (c) 2014-present Matt Zabriskie and contributors.', path: 'apps/admin/src/lib/http.ts'},
      {name: 'chart.js', version: '4.4.4', license: 'MIT', copyright: 'Copyright (c) 2018 Chart.js Contributors.', path: 'apps/admin/src/widgets/UsageChart.tsx'},
      {name: 'left-pad-pro', version: '1.3.0', license: 'Apache-2.0', copyright: 'Copyright (c) 2020 Aurora Team.', path: 'apps/admin/package.json → dependencies'},
      {name: 'exceljs', version: '4.4.0', license: 'MIT', copyright: 'Copyright (c) 2014-2019 Guyon Roche.', path: 'apps/admin/src/export.ts'},
      {name: 'semver', version: '6.3.1', license: 'ISC', copyright: 'Copyright (c) Isaac Z. Schlueter and Contributors.', path: 'apps/admin/scripts/verify.ts'},
      {name: 'legacy-parser', version: '2.1.0', license: 'GPL-3.0', copyright: 'Copyright (c) 2015 Legacy Authors.', path: 'apps/admin/tools/import.ts'},
    ],
  },
];
