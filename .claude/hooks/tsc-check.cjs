// PostToolUse hook (Write|Edit): runs `tsc --noEmit` when a .ts/.tsx file was touched.
const { spawnSync } = require('child_process');

let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  let payload;
  try {
    payload = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  const filePath =
    payload?.tool_input?.file_path || payload?.tool_response?.filePath || '';
  if (!/\.tsx?$/.test(filePath)) {
    process.exit(0);
  }

  const result = spawnSync('npx', ['tsc', '--noEmit'], {
    stdio: 'inherit',
    shell: true,
  });
  process.exit(result.status ?? 0);
});
