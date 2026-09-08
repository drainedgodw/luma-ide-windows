import { describe, expect, it } from 'vitest';
import { bundledNodePaths } from '../src/main/platform/nodeRuntime';

describe('bundled Node runtime paths', () => {
  it('resolves Node and npm inside Windows resources', () => {
    expect(bundledNodePaths('C:\\Program Files\\Luma\\resources', 'win32')).toEqual({
      nodeExecutable: 'C:\\Program Files\\Luma\\resources\\node\\node.exe',
      npmCli: 'C:\\Program Files\\Luma\\resources\\node\\node_modules\\npm\\bin\\npm-cli.js',
    });
  });

  it('does not claim a bundled Windows runtime on another platform', () => {
    expect(bundledNodePaths('/opt/luma/resources', 'linux')).toBeNull();
  });
});
