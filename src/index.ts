#!/usr/bin/env bun

// ABOUTME: Main entry point for the private journal MCP server
// ABOUTME: Handles command line arguments and starts the server

import * as path from 'node:path';
import { resolveJournalPath } from './paths.js';
import { PrivateJournalServer } from './server.js';

function parseArguments(): string {
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--journal-path' && i + 1 < args.length) {
      return path.resolve(args[i + 1]);
    }
  }

  return resolveJournalPath();
}

async function main(): Promise<void> {
  try {
    const journalPath = parseArguments();
    console.error(`Journal path: ${journalPath}`);

    const server = new PrivateJournalServer(journalPath);
    await server.run();
  } catch (error) {
    console.error('Failed to start private journal MCP server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
