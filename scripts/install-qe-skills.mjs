import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateQeInstallation } from './verify-qe-installation.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vendor = path.join(repo, '.agents/agentic-qe');
const manifest = JSON.parse(fs.readFileSync(path.join(vendor, 'UPSTREAM-MANIFEST.json'), 'utf8'));
for (const entry of manifest.packages) {
  for (const [relative, expected] of Object.entries(entry.files)) {
    const target = path.resolve(repo, entry.root, relative);
    if (!target.startsWith(`${vendor}/`) || fs.lstatSync(target).isSymbolicLink()) throw new Error('Unsafe QE source path');
    const actual = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
    if (actual !== expected) throw new Error(`QE source hash mismatch: ${relative}`);
  }
}
const runtime = JSON.parse(fs.readFileSync(path.join(repo, 'node_modules/agentic-qe/package.json'), 'utf8'));
if (runtime.version !== manifest.runtime.version) throw new Error('QE runtime version mismatch');

const skillsRoot = path.join(repo, '.agents/skills');
for (const name of fs.readdirSync(path.join(vendor, 'skills'))) {
  fs.cpSync(path.join(vendor, 'skills', name), path.join(skillsRoot, name), { recursive: true });
}
const feature = path.join(skillsRoot, 'feature-adr');
const override = `\n## Proofwall: обязательный Direct Mode\n\nДля реализации Proofwall запускать /feature-adr --full-qe. Полные core-протоколы и\nCodex-адаптация закреплены в .agents/agentic-qe/UPSTREAM-MANIFEST.json. Сначала читать\n.agents/agentic-qe/PROOFWALL-INTEGRATION.md; его маршрутизация Direct имеет приоритет\nнад историческими pinned references в этом навыке. Отсутствующий runtime, протокол\nили недоступный обязательный gate означает BLOCKED, а не тихий fallback в reference.\nМатрица моделей и независимость: docs/model-matrix.md, docs/review-policy.md.\n`;
const mainPath = path.join(feature, 'SKILL.md');
let main = fs.readFileSync(mainPath, 'utf8');
main = main.replace(/agentic_qe_version: "[^"]+"/, `agentic_qe_version: "${runtime.version}"`);
if (!main.includes('## Proofwall: обязательный Direct Mode')) main += override;
fs.writeFileSync(mainPath, main);

const routes = {
  '03-adr.md': ['shift-left-testing'],
  '03.5-ideation-swarm.md': ['qcsd-ideation-swarm'],
  '06-implementation-plan.md': [],
  '08-qe.md': ['brutal-honesty-review'],
  '09-fleet-qe.md': ['qe-requirements-validation', 'risk-based-testing', 'enterprise-integration-testing', 'regression-testing', 'qe-coverage-analysis'],
};
for (const [moduleName, names] of Object.entries(routes)) {
  const target = path.join(feature, 'modules', moduleName);
  let body = fs.readFileSync(target, 'utf8');
  if (!body.includes('PROOFWALL DIRECT SOURCE')) {
    const sources = names.length ? names.map(name => `.agents/agentic-qe/skills/${name}/SKILL.md`).join(', ') : '.agents/agentic-qe/agents/code-goal-planner.md';
    body = `<!-- PROOFWALL DIRECT SOURCE -->\n> При --full-qe загружать полные актуальные протоколы: ${sources}.\n> Их вспомогательные пути разрешать от корня соответствующего upstream-навыка.\n> Ниже references сохранены для исторического reference-mode; при Direct использовать\n> закреплённые выше источники и .agents/agentic-qe/PROOFWALL-INTEGRATION.md.\n\n${body}`;
    fs.writeFileSync(target, body);
  }
}
const featureFiles = {};
function record(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, item.name);
    if (item.isSymbolicLink()) throw new Error('Unexpected generated feature symlink');
    if (item.isDirectory()) record(target);
    else featureFiles[path.relative(feature, target)] = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
  }
}
record(feature);
fs.writeFileSync(path.join(skillsRoot, '.proofwall-installed.json'), `${JSON.stringify({ schemaVersion: 1, upstreamCommit: manifest.commit, featureFiles }, null, 2)}\n`);
validateQeInstallation(repo);
console.log(`Full QE installed: runtime ${runtime.version}, sources ${manifest.commit}, ${Object.keys(manifest.packages[0].files).length} verified files`);
