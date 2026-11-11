import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const repo = '/tmp/proofwall-ui-dashboard';
const dir = `${repo}/features/proofo-ui/evidence/dashboard-final/coverage`;
const metadata = JSON.parse(readFileSync(`${dir}/run-metadata.json`, 'utf8'));
const summary = JSON.parse(readFileSync(`${dir}/raw/coverage-summary.json`, 'utf8'));
const raw = JSON.parse(readFileSync(`${dir}/raw/coverage-final.json`, 'utf8'));
const metrics = ['lines', 'branches', 'functions', 'statements'];
const expected = new Set(metadata.scope.map(file => `${repo}/${file}`));
if (Object.keys(raw).length !== 4 || Object.keys(raw).some(file => !expected.has(file))) throw new Error('Unexpected coverage scope');
const lcov = readFileSync(`${dir}/raw/lcov.info`, 'utf8');
const uncoveredLinesByFile = Object.fromEntries(lcov.split('end_of_record').filter(part => part.includes('SF:')).map(part => {
  const file = part.match(/^SF:(.*)$/m)[1];
  const lines = [...part.matchAll(/^DA:(\d+),0(?:,.*)?$/gm)].map(match => Number(match[1]));
  return [file, lines];
}));
const gaps = Object.entries(raw).map(([absolute, coverage]) => {
  const relative = absolute.slice(repo.length + 1);
  const webRelative = absolute.slice(`${repo}/apps/web/`.length);
  const uncoveredBranches = Object.entries(coverage.b).flatMap(([id, counters]) => counters.flatMap((hits, index) => hits === 0 ? [{
    id, index, type: coverage.branchMap[id].type, location: coverage.branchMap[id].locations[index] ?? coverage.branchMap[id].loc,
  }] : []));
  const uncoveredFunctions = Object.entries(coverage.f).filter(([, hits]) => hits === 0).map(([id]) => ({id, name: coverage.fnMap[id].name, location: coverage.fnMap[id].loc}));
  return {
    file: relative, critical: metadata.thresholds.criticalFiles.includes(relative), metrics: summary[absolute],
    uncoveredLines: uncoveredLinesByFile[webRelative] ?? uncoveredLinesByFile[absolute] ?? [],
    uncoveredBranches, uncoveredFunctions,
  };
});
const checks = [
  ...metrics.map(metric => ({scope: 'four-file total', metric, actual: summary.total[metric].pct, threshold: 80, passed: summary.total[metric].pct >= 80})),
  ...gaps.filter(file => file.critical).flatMap(file => metrics.map(metric => ({scope: file.file, metric, actual: file.metrics[metric].pct, threshold: 90, passed: file.metrics[metric].pct >= 90}))),
];
const result = {metadata: 'run-metadata.json', total: summary.total, gaps, gates: checks, coverageGatesPassed: checks.every(check => check.passed)};
writeFileSync(`${dir}/coverage-analysis.json`, JSON.stringify(result, null, 2) + '\n');
const render = value => `${value.covered}/${value.total} (${value.pct}%)`;
const text = [
  '# Фактическое покрытие dashboard', '',
  `Измерено: ${metadata.started} — ${metadata.finished}. Exit Vitest: ${metadata.exitCode}. Исходники и тесты стабильны во время запуска: ${metadata.sourceAndTestsStable}.`, '',
  `Реальный provider: @vitest/coverage-v8@${metadata.versions.provider}; Vitest ${metadata.versions.vitest}; Node ${metadata.node}; V8 ${metadata.v8}.`, '',
  'Область: ровно четыре новых/изменённых product-файла dashboard целиком, all:true. Это scoped coverage целых файлов, а не вычисленное diff coverage и не процент пройденных test cases. CSS, существующие тарифные/DB/session helpers, браузерный E2E и другие файлы в знаменатель не входят.', '',
  'Запущены unit/SSR, isolated PostgreSQL integration и frozen fixture tests. JSX runtime настроен automatic; fixture output unset, эталоны не создавались/не обновлялись. Только DATABASE_URL/TEST_DATABASE_URL переданы из безопасного env после проверки loopback и proofwall_ui_test. REVOKE, production, S3 и mail не использовались.', '',
  '| Файл | Lines | Branches | Functions | Statements |',
  '| --- | --- | --- | --- | --- |',
  `| **Итого** | ${metrics.map(metric => render(summary.total[metric])).join(' | ')} |`,
  ...gaps.map(file => `| ${file.file} | ${metrics.map(metric => render(file.metrics[metric])).join(' | ')} |`), '',
  `Gate для новых файлов: ≥80% для каждой метрики по общей области. Критические read-model/auth/error файлы summary/page/error: ≥90% для каждой метрики отдельно. Итог coverage gate: **${result.coverageGatesPassed ? 'PASS' : 'FAIL'}**.`,
  ...checks.filter(check => !check.passed).map(check => `- FAIL: ${check.scope}, ${check.metric}: ${check.actual}% < ${check.threshold}%.`), '',
  '## Реальные пробелы', '',
  ...gaps.flatMap(file => [
    `### ${file.file}`, '',
    `Непокрытые строки (LCOV DA=0): ${file.uncoveredLines.join(', ') || 'нет'}.`,
    `Непокрытые функции: ${file.uncoveredFunctions.map(fn => `${fn.name} (L${fn.location.start.line})`).join(', ') || 'нет'}.`,
    `Непокрытые ветви: ${file.uncoveredBranches.map(branch => `#${branch.id}[${branch.index}] ${branch.type} L${branch.location.start.line}:${branch.location.start.column}–L${branch.location.end.line}:${branch.location.end.column}`).join('; ') || 'нет'}.`, '',
  ]),
  'Приоритет пробелов: (1) защитный отказ count() при нецелом/отрицательном/небезопасном счётчике — синтетический mocked DB row должен отвергаться, а не давать ложную успешную сводку; (2) аккаунт только с активными paid-стенами — ожидается label «Платный». Это рекомендации следующего тестового инкремента; в этом измерении тесты не добавлялись и пороги не снижались.', '',
  '## Воспроизведение и ограничения', '',
  `Working directory: \`${metadata.cwd}\`.`, '',
  '```text', metadata.command.join(' '), '```', '',
  'Конфигурация и runner сохранены рядом с отчётом. Внешние инструменты установлены в /tmp/proofwall-dashboard-coverage-tools; репозиторные package.json/package-lock не менялись. Vitest web ссылается на общий baseline-external artifact той же закреплённой версии; только provider добавлен ссылкой из игнорируемого node_modules. Фактические команды, exit, версии и SHA-256 до/после находятся в run-metadata.json.', '',
  'Сырые данные: raw/coverage-final.json, raw/coverage-summary.json, raw/lcov.info, raw/index.html. Полный output без секретов: vitest-run.log. Machine-readable gaps/gates: coverage-analysis.json.', '',
  'Это измерение исполнения, а не независимое code review и не доказательство силы assertions. Качество негативных сценариев, mutation evidence, browser/visual/E2E и итоговая приёмка проверяются отдельными QE-ролями. История навыка пуста; тренд не вычислен. По явному ограничению координатора run-history/state/receipts не изменялись.', '',
];
writeFileSync(`${dir}/REPORT.md`, text.join('\n'));
copyFileSync('/tmp/proofwall-dashboard-coverage-tools/analyze-dashboard-coverage.mjs', `${dir}/analyze-dashboard-coverage.mjs`);
writeFileSync(`${dir}/artifact-sha256.json`, JSON.stringify(Object.fromEntries(['REPORT.md','coverage-analysis.json','run-metadata.json','vitest-run.log','raw/coverage-final.json','raw/coverage-summary.json','raw/lcov.info','dashboard.vitest.config.mjs','run-dashboard-coverage.mjs','analyze-dashboard-coverage.mjs'].map(file => [file, createHash('sha256').update(readFileSync(`${dir}/${file}`)).digest('hex')])), null, 2) + '\n');
process.stdout.write(JSON.stringify({total: summary.total, coverageGatesPassed: result.coverageGatesPassed, failedChecks: checks.filter(check => !check.passed), gaps: gaps.map(({file, uncoveredLines, uncoveredBranches, uncoveredFunctions}) => ({file, uncoveredLines, uncoveredBranches, uncoveredFunctions}))}, null, 2) + '\n');
