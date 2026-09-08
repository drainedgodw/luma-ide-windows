import fs from 'node:fs';

const version = '0.3.0';
const read = (path) => fs.readFileSync(path, 'utf8');
const write = (path, content) => fs.writeFileSync(path, content);
const replaceOnce = (text, oldText, newText, label) => {
  const first = text.indexOf(oldText);
  if (first < 0 || text.indexOf(oldText, first + oldText.length) >= 0) {
    throw new Error(`Expected one ${label}`);
  }
  return text.slice(0, first) + newText + text.slice(first + oldText.length);
};

for (const filename of ['package.json', 'package-lock.json', 'update.json']) {
  const data = JSON.parse(read(filename));
  data.version = version;
  if (filename === 'package-lock.json') data.packages[''].version = version;
  write(filename, `${JSON.stringify(data, null, 2)}\n`);
}

const settingsPath = 'src/renderer/src/views/SettingsView.tsx';
write(
  settingsPath,
  replaceOnce(
    read(settingsPath),
    'Version 0.2.0 · MIT license',
    'Version 0.3.0 · MIT license',
    'Settings version label'
  )
);

const changelogPath = 'CHANGELOG.md';
let changelog = read(changelogPath);
const heading = '## [0.3.0] - 2026-09-08';
if (!changelog.includes(heading)) {
  const marker = '## [0.2.0] - 2026-09-06';
  const entry = `## [0.3.0] - 2026-09-08

### Fixed

- Rebuilt Languages & Ecosystem (Stack) so supported dependencies have one-click install and remove actions.
- Added installed-state refresh, removal confirmation and visible command output on Linux and Windows.
- Made package-manager execution platform-aware for npm, pnpm, Yarn, Bun, Python, Cargo, Go and .NET.

### Security

- Require Workspace Trust for Stack mutations and accept only shared-catalog package identifiers.
- Prevent renderer input from becoming a shell command and avoid executing repository-local Python during status detection.

### Known limitations

- Java and C/C++ entries remain manual until a deterministic manifest mutation path is available.

`;
  changelog = replaceOnce(changelog, marker, entry + marker, '0.2.0 changelog marker');
  write(changelogPath, changelog);
}

const readmePath = 'README.md';
let readme = read(readmePath);
readme = replaceOnce(
  readme,
  '> **Preview status:** automated Windows packaging passes, but manual Windows 10/11 smoke testing is still pending. The download below is an unsigned preview, not a stable release.',
  '> **Preview status:** automated Windows packaging passes and the application has launched successfully on Windows. Manual Stack install/remove smoke testing is still pending. The download below is unsigned and not yet a stable release.',
  'Windows preview status'
);
const intro = 'Luma is a visual, Git-first desktop IDE. This repository is the Windows edition, split from the original Linux codebase so platform behavior, packaging, and releases can evolve independently.\n';
if (!readme.includes('**Current update: Luma 0.3.0 — Fix Stack bug.**')) {
  readme = replaceOnce(
    readme,
    intro,
    `${intro}\n**Current update: Luma 0.3.0 — Fix Stack bug.**\n`,
    'Windows README intro'
  );
}
const milestone = '- Windows CI for type checks, tests, renderer builds, runtime verification, and packaging.';
const stackBullet = '- Reversible in-app Stack package actions with installed-state detection and Workspace Trust protection.';
if (!readme.includes(stackBullet)) {
  readme = replaceOnce(readme, milestone, `${milestone}\n${stackBullet}`, 'Windows milestone');
}
write(readmePath, readme);

const workflowPath = '.github/workflows/preview-release.yml';
let workflow = read(workflowPath);
if (!workflow.includes('# Luma for Windows — Preview')) {
  throw new Error('Missing Windows preview heading');
}
workflow = workflow.replaceAll(
  '# Luma for Windows — Preview',
  '# Luma 0.3.0 — Fix Stack bug (Windows Preview)'
);
if (!workflow.includes("--title 'Luma for Windows — Preview'")) {
  throw new Error('Missing Windows preview release title');
}
workflow = workflow.replaceAll(
  "--title 'Luma for Windows — Preview'",
  "--title 'Luma 0.3.0 — Fix Stack bug (Windows Preview)'"
);
workflow = replaceOnce(
  workflow,
  'This preview is unsigned and may trigger a Microsoft Defender SmartScreen warning. Manual Windows 10/11 smoke testing is still pending; this is not a stable release.',
  'This preview is unsigned and may trigger a Microsoft Defender SmartScreen warning. The application has launched successfully on Windows; manual Stack install/remove smoke testing remains pending.',
  'Windows preview limitation'
);
const commitMarker = 'Self-contained Windows 10/11 x64 preview built from commit $env:GITHUB_SHA.\n';
const stackNote = '\nVersion 0.3.0 fixes the in-app Stack installer with one-click install/remove actions, safe installed-state detection and cross-platform package-manager commands.\n';
if (!workflow.includes(stackNote.trim())) {
  workflow = replaceOnce(workflow, commitMarker, commitMarker + stackNote, 'release commit marker');
}
write(workflowPath, workflow);
