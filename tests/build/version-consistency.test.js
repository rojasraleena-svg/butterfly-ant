import { describe, it, expect } from 'vitest';
import pkg from '../../package.json';
import { getVersion } from '../../lib/config';

describe('版本号一致性', () => {
  it('getVersion 应返回与 package.json 一致的版本号', () => {
    expect(getVersion()).toBe(pkg.version);
  });

  it('版本号应为语义化格式 (x.y.z)', () => {
    const v = getVersion();
    expect(v).toMatch(/^\d+\.\d+\.\d+(-[\w.]+)?$/);
  });
});
