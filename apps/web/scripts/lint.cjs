/**
 * Runs ESLint with legacy eslintrc (ESLint 9 requires ESLINT_USE_FLAT_CONFIG=false).
 * Exits non-zero on errors or warnings so lint cannot be bypassed at build/CI time.
 */
const { spawnSync } = require('child_process');
const path = require('path');

process.env.ESLINT_USE_FLAT_CONFIG = 'false';

const appRoot = path.join(__dirname, '..');
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

const lintEnv = {
  ...process.env,
  NODE_OPTIONS: [process.env.NODE_OPTIONS, '--disable-warning=ESLintRCWarning']
    .filter(Boolean)
    .join(' '),
};

const result = spawnSync(
  pnpm,
  ['exec', 'eslint', '.'],
  { cwd: appRoot, stdio: 'inherit', env: lintEnv, shell: true },
);

process.exit(result.status === null ? 1 : result.status);
