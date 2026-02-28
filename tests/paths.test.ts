// ABOUTME: Unit tests for path resolution utilities
// ABOUTME: Tests cross-platform fallback logic and environment handling

import './setup';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as path from 'node:path';
import { resolveJournalPath } from '../src/paths.js';

describe('Path resolution', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('resolveJournalPath uses HOME', () => {
    process.env.HOME = '/Users/test';
    const result = resolveJournalPath();
    expect(result).toBe('/Users/test/.private-journal');
  });

  test('resolveJournalPath uses USERPROFILE when HOME is absent', () => {
    process.env.HOME = undefined;
    process.env.USERPROFILE = 'C:\\Users\\test';

    const result = resolveJournalPath();
    expect(result).toBe(path.join('C:\\Users\\test', '.private-journal'));
  });

  test('resolveJournalPath falls back to /tmp', () => {
    process.env.HOME = undefined;
    process.env.USERPROFILE = undefined;

    const result = resolveJournalPath();
    expect(result).toBe('/tmp/.private-journal');
  });
});
