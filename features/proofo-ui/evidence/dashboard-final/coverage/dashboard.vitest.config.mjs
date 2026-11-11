import { defineConfig } from '/tmp/proofwall-dashboard-baseline-external/node_modules/vitest/dist/config.js';

const repo = '/tmp/proofwall-ui-dashboard';
const web = `${repo}/apps/web`;
export default defineConfig({
  root: web,
  esbuild: { jsx: 'automatic' },
  resolve: { alias: {
    '@course/agent-payments/provider-yookassa': `${repo}/packages/agent-payments/src/provider-yookassa.ts`,
    '@course/agent-payments': `${repo}/packages/agent-payments/src/index.ts`,
    '@proofwall/db': `${repo}/packages/db/src/index.ts`,
    '@': `${web}/src`,
  } },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/dashboard-overview.test.ts', 'tests/dashboard-overview-db.test.ts', 'tests/dashboard-visual-fixture.test.ts'],
    maxWorkers: 1,
    minWorkers: 1,
    fileParallelism: false,
    coverage: {
      enabled: true,
      provider: 'v8',
      all: true,
      include: ['src/lib/dashboard-summary.ts', 'src/app/dashboard/page.tsx', 'src/app/dashboard/dashboard-overview.tsx', 'src/app/dashboard/error.tsx'],
      reportsDirectory: `${repo}/features/proofo-ui/evidence/dashboard-final/coverage/raw`,
      reporter: ['text', 'json', 'json-summary', 'lcov', 'html'],
      reportOnFailure: true,
      thresholds: {
        statements: 80, branches: 80, functions: 80, lines: 80,
        'src/lib/dashboard-summary.ts': { statements: 90, branches: 90, functions: 90, lines: 90 },
        'src/app/dashboard/page.tsx': { statements: 90, branches: 90, functions: 90, lines: 90 },
        'src/app/dashboard/error.tsx': { statements: 90, branches: 90, functions: 90, lines: 90 },
      },
    },
  },
});
