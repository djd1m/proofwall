#!/usr/bin/env python3
"""Apply project SQL migrations transactionally to this stand's Postgres only."""
from pathlib import Path
import subprocess

repo = Path(__file__).resolve().parent.parent
compose = [str(repo / 'scripts/stand.sh'), 'exec', '-T', 'postgres', 'sh', '-c']
psql = 'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1'
def run(sql, query=False):
    command = psql + (' -Atq' if query else ' -q')
    result = subprocess.run(compose + [command], input=sql, text=True,
                            capture_output=True, cwd=repo)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or f"psql exited {result.returncode}")
    return result.stdout

run('CREATE TABLE IF NOT EXISTS schema_migrations '
    '(filename text primary key, applied_at timestamptz not null default now());')
applied = set(run('SELECT filename FROM schema_migrations;', query=True).splitlines())
for migration in sorted((repo / 'packages/db/migrations').glob('*.sql')):
    name = migration.name
    if name in applied:
        print('skip', name)
        continue
    quoted = name.replace("'", "''")
    run('BEGIN;\n' + migration.read_text() +
        f"\nINSERT INTO schema_migrations(filename) VALUES ('{quoted}');\nCOMMIT;\n")
    print('apply', name)
print('Migrations complete.')
