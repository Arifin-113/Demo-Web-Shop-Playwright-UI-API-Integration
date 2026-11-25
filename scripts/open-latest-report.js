import { readdirSync, existsSync } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// Opens the newest playwright-report/Report-<date>_T_<time> folder with `playwright show-report`.
const reportRoot = path.join(process.cwd(), 'playwright-report');

if (!existsSync(reportRoot)) {
  console.error('No playwright-report folder yet. Run the tests first: npm test');
  process.exit(1);
}

const reports = readdirSync(reportRoot).filter((name) => name.startsWith('Report-')).sort();
if (reports.length === 0) {
  console.error('No Report-* folders found in playwright-report/.');
  process.exit(1);
}

const latest = path.join(reportRoot, reports[reports.length - 1]);
console.log(`Opening ${latest}`);
spawn('npx', ['playwright', 'show-report', latest], { stdio: 'inherit', shell: true });
