import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export const directModules = ['03-adr.md', '03.5-ideation-swarm.md', '06-implementation-plan.md', '08-qe.md', '09-fleet-qe.md'];
export function validateQeInstallation(root) {
  const read = relative => {
    if (path.isAbsolute(relative) || relative.split(/[\\/]/).includes('..')) throw new Error('Unsafe QE installation reference');
    const target = path.resolve(root, relative);
    if (!target.startsWith(`${root}/`)) throw new Error('QE installation path outside project');
    let cursor = target;
    while (cursor !== root) {
      if (fs.lstatSync(cursor).isSymbolicLink()) throw new Error('QE installation symlink');
      cursor = path.dirname(cursor);
    }
    return fs.readFileSync(target);
  };
  const manifest = JSON.parse(read('.agents/agentic-qe/UPSTREAM-MANIFEST.json'));
  const installed = JSON.parse(read('.agents/skills/.proofwall-installed.json'));
  if (installed.schemaVersion !== 1 || installed.upstreamCommit !== manifest.commit || !installed.featureFiles) throw new Error('Full-QE installation marker missing or stale; run npm run process:install');
  for (const relative of ['SKILL.md', ...directModules.map(name => `modules/${name}`)]) {
    if (!installed.featureFiles[relative]) throw new Error('Incomplete generated feature-adr installation');
  }
  for (const [relative, digest] of Object.entries(installed.featureFiles)) {
    if (!/^[a-f0-9]{64}$/.test(digest) || sha(read(`.agents/skills/feature-adr/${relative}`)) !== digest) throw new Error('Generated feature-adr was modified; reinstall before using hooks');
  }
  const main = read('.agents/skills/feature-adr/SKILL.md').toString();
  if (!main.includes('## Proofwall: обязательный Direct Mode')) throw new Error('Full-QE mode override missing');
  for (const name of directModules) {
    const body = read(`.agents/skills/feature-adr/modules/${name}`).toString();
    if (!body.startsWith('<!-- PROOFWALL DIRECT SOURCE -->') || !body.includes('.agents/agentic-qe/')) throw new Error('Direct QE source routing missing');
  }
  for (const pkg of manifest.packages) for (const [relative, digest] of Object.entries(pkg.files)) {
    if (relative.startsWith('skills/') && sha(read(`.agents/${relative}`)) !== digest) throw new Error('Installed upstream QE skill missing or modified');
  }
  return { generatedFiles: Object.keys(installed.featureFiles).length };
}
