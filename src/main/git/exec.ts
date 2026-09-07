import { spawn } from 'node:child_process';
import { createGitEnvironment, resolveGitExecutable } from '../platform/gitExecutable';

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

export class GitError extends Error {
  constructor(
    public command: string,
    public result: RunResult
  ) {
    super(`git ${command}: ${result.stderr.trim() || result.stdout.trim()}`);
  }
}

export async function runGit(
  repo: string,
  args: string[],
  extraEnv?: Record<string, string>
): Promise<string> {
  const res = await runGitRaw(repo, args, extraEnv);
  if (res.code !== 0) throw new GitError(args.join(' '), res);
  return res.stdout;
}

export async function tryGit(
  repo: string,
  args: string[],
  extraEnv?: Record<string, string>
): Promise<RunResult> {
  return runGitRaw(repo, args, extraEnv);
}

function runGitRaw(
  repo: string,
  args: string[],
  extraEnv?: Record<string, string>
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const executable = resolveGitExecutable();
    const child = spawn(executable, ['-c', 'core.quotepath=false', ...args], {
      cwd: repo,
      env: createGitEnvironment(executable, process.env, extraEnv),
    });
    let stdout = '';
    let stderr = '';
    let stdoutBuf: Buffer | null = null;
    child.stdout.on('data', (d) => {
      if (Buffer.isBuffer(d)) {
        // NUL-separated output: keep as latin1 to survive bytes
        stdoutBuf = stdoutBuf ? Buffer.concat([stdoutBuf, d]) : d;
      }
    });
    child.stderr.on('data', (d: Buffer) => (stderr += d.toString('utf8')));
    child.on('error', reject);
    child.on('close', (code) => {
      if (stdoutBuf) stdout = stdoutBuf.toString('utf8');
      resolve({ code: code ?? -1, stdout, stderr });
    });
  });
}
