# Private Journal MCP Server

A lightweight MCP (Model Context Protocol) server that provides Claude with private journaling and semantic search capabilities for processing thoughts, feelings, and insights.

## Features

### Journaling
- **Multi-section journaling**: Separate categories for feelings, project notes, user context, technical insights, and world knowledge
- **Freeform content**: Write unstructured thoughts when they don't fit categories
- **Timestamped entries**: Each entry automatically dated with microsecond precision
- **YAML frontmatter**: Structured metadata for each entry

### Search & Discovery
- **Semantic search**: Natural language queries using local AI embeddings
- **Vector similarity**: Find conceptually related entries, not just keyword matches
- **Local AI processing**: Uses @xenova/transformers - no external API calls required
- **Automatic indexing**: Embeddings generated for all entries on startup and ongoing

### Privacy
- **Completely private**: All processing happens locally, no data leaves your machine
- **Single storage location**: Everything in `~/.private-journal/`

## Installation

This server is run directly from GitHub using `npx` - no installation required.

## MCP Configuration

#### Claude Code (One-liner)
```bash
claude mcp add-json private-journal '{"type":"stdio","command":"npx","args":["github:obra/private-journal-mcp"]}' -s user
```

#### Manual Configuration
Add to your MCP settings (e.g., Claude Desktop configuration):

```json
{
  "mcpServers": {
    "private-journal": {
      "command": "npx",
      "args": ["github:obra/private-journal-mcp"]
    }
  }
}
```

## MCP Tools

### `process_thoughts`
Multi-section private journaling with these optional fields:
- **content**: Freeform journal content for unstructured thoughts
- **feelings**: Private emotional processing space
- **project_notes**: Technical insights specific to current project
- **user_context**: Notes about collaborating with humans
- **technical_insights**: General software engineering learnings
- **world_knowledge**: Domain knowledge and interesting discoveries

### `search_journal`
Semantic search across all journal entries:
- **query** (required): Natural language search query
- **limit**: Maximum results (default: 10)
- **sections**: Filter by specific categories

### `read_journal_entry`
Read full content of specific entries:
- **path** (required): File path from search results

### `list_recent_entries`
Browse recent entries chronologically:
- **limit**: Maximum entries (default: 10)
- **days**: Days back to search (default: 30)

## File Structure

```
~/.private-journal/
├── 2025-05-31/
│   ├── 14-30-45-123456.md          # Journal entry
│   ├── 14-30-45-123456.embedding   # Search index
│   └── ...
```

### Entry Format
Each markdown file contains YAML frontmatter and structured sections:

```markdown
---
title: "2:30:45 PM - May 31, 2025"
date: 2025-05-31T14:30:45.123Z
timestamp: 1717160645123
---

## Feelings

I'm excited about this new search feature...

## Technical Insights

Vector embeddings provide semantic understanding...
```

## Development

```bash
bun run build    # Build with tsc
bun test         # Run tests
bun run dev      # Development mode
```

## Author

Jesse Vincent <jesse@fsck.com>

Read more about the motivation and design in the [blog post](https://blog.fsck.com/2025/05/28/dear-diary-the-user-asked-me-if-im-alive/).

## License

MIT
