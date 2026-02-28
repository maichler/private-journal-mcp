// ABOUTME: Path resolution for journal storage location
// ABOUTME: Resolves ~/.private-journal/ with cross-platform fallbacks

import * as path from 'node:path';

/**
 * Resolves the journal storage directory.
 * Falls back through: HOME -> USERPROFILE -> /tmp
 */
export function resolveJournalPath(): string {
  const subdirectory = '.private-journal';

  if (process.env.HOME) {
    return path.join(process.env.HOME, subdirectory);
  }
  if (process.env.USERPROFILE) {
    return path.join(process.env.USERPROFILE, subdirectory);
  }

  return path.join('/tmp', subdirectory);
}
