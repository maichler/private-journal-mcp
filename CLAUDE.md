# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Build the project
bun run build

# Run tests
bun test

# Run tests in watch mode
bun test --watch

# Development mode
bun --watch src/index.ts

# Lint the code
biome check src/

# Format the code
biome check --write src/

# Start the server
bun start

# Run a single test file
bun test tests/journal.test.ts
```

## Issue Tracking

This project uses **beads (bd)** for issue tracking. The `.beads/` directory is initialized and ready to use.

**For complex, multi-session work:** Use bd to track issues that span multiple sessions or need to survive context compaction.

**For simple, single-session tasks:** Use TodoWrite for immediate task tracking that will complete within the current session.

## Architecture Overview

This is an MCP (Model Context Protocol) server that provides Claude with private journaling capabilities. All entries are stored in `~/.private-journal/`.

**Core Components:**
- `src/index.ts` - CLI entry point, resolves journal path, starts server
- `src/server.ts` - MCP server using stdio transport
- `src/journal.ts` - File system operations for timestamped markdown entries
- `src/paths.ts` - Resolves `~/.private-journal/` with cross-platform fallbacks
- `src/embeddings.ts` - Local AI embedding generation using @xenova/transformers
- `src/search.ts` - Semantic search across journal entries
- `src/types.ts` - TypeScript interfaces

**Storage:**
- All entries in `~/.private-journal/`
- Daily structure: `YYYY-MM-DD/HH-MM-SS-μμμμμμ.md` with microsecond precision
- YAML frontmatter with title, ISO date, Unix timestamp
- `.embedding` files alongside each entry for semantic search

## MCP Tools

- `process_thoughts` - Multi-section journaling (feelings, project_notes, user_context, technical_insights, world_knowledge) plus freeform `content` field
- `search_journal` - Semantic search using local AI embeddings
- `read_journal_entry` - Read full entry by file path
- `list_recent_entries` - Browse recent entries chronologically

## Tooling

- **Runtime**: Bun
- **Build**: tsc (TypeScript compiler)
- **Test**: bun:test with mocked transformers
- **Lint/Format**: Biome

## Testing Approach

- Uses bun:test with mocked @xenova/transformers for embedding tests
- Tests cover file system operations, timestamp formatting, directory creation, and search
- Temporary directories created/cleaned for each test
