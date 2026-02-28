// ABOUTME: Unit tests for journal writing functionality
// ABOUTME: Tests file system operations, timestamps, and formatting

import './setup';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { JournalManager } from '../src/journal.js';

function getFormattedDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('JournalManager', () => {
  let tempDir: string;
  let journalManager: JournalManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'journal-test-'));
    journalManager = new JournalManager(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('writes journal entry to correct file structure', async () => {
    const content = 'This is a test journal entry.';

    await journalManager.writeEntry(content);

    const today = new Date();
    const dateString = getFormattedDate(today);
    const dayDir = path.join(tempDir, dateString);

    const files = await fs.readdir(dayDir);
    expect(files).toHaveLength(2); // .md and .embedding files

    const mdFile = files.find((f) => f.endsWith('.md'));
    const embeddingFile = files.find((f) => f.endsWith('.embedding'));

    expect(mdFile).toBeDefined();
    expect(embeddingFile).toBeDefined();
    expect(mdFile).toMatch(/^\d{2}-\d{2}-\d{2}-\d{6}\.md$/);
  });

  test('creates directory structure automatically', async () => {
    await journalManager.writeEntry('Test entry');

    const today = new Date();
    const dateString = getFormattedDate(today);
    const dayDir = path.join(tempDir, dateString);

    const stats = await fs.stat(dayDir);
    expect(stats.isDirectory()).toBe(true);
  });

  test('formats entry content correctly', async () => {
    const content = 'This is my journal entry content.';

    await journalManager.writeEntry(content);

    const today = new Date();
    const dateString = getFormattedDate(today);
    const dayDir = path.join(tempDir, dateString);
    const files = await fs.readdir(dayDir);
    const mdFile = files.find((f) => f.endsWith('.md'));
    const filePath = path.join(dayDir, mdFile!);

    const fileContent = await fs.readFile(filePath, 'utf8');

    expect(fileContent).toContain('---');
    expect(fileContent).toContain('title: "');
    expect(fileContent).toContain('date: ');
    expect(fileContent).toContain('timestamp: ');
    expect(fileContent).toContain(' - ');
    expect(fileContent).toContain(content);

    // Check YAML frontmatter structure
    const lines = fileContent.split('\n');
    expect(lines[0]).toBe('---');
    expect(lines[1]).toMatch(/^title: ".*"$/);
    expect(lines[2]).toMatch(/^date: \d{4}-\d{2}-\d{2}T/);
    expect(lines[3]).toMatch(/^timestamp: \d+$/);
    expect(lines[4]).toBe('---');
    expect(lines[5]).toBe('');
    expect(lines[6]).toBe(content);
  });

  test('handles multiple entries on same day', async () => {
    await journalManager.writeEntry('First entry');
    await journalManager.writeEntry('Second entry');

    const today = new Date();
    const dateString = getFormattedDate(today);
    const dayDir = path.join(tempDir, dateString);
    const files = await fs.readdir(dayDir);

    expect(files).toHaveLength(4); // 2 .md files + 2 .embedding files
    const mdFiles = files.filter((f) => f.endsWith('.md'));
    expect(mdFiles).toHaveLength(2);
    expect(mdFiles[0]).not.toEqual(mdFiles[1]);
  });

  test('handles empty content', async () => {
    await journalManager.writeEntry('');

    const today = new Date();
    const dateString = getFormattedDate(today);
    const dayDir = path.join(tempDir, dateString);
    const files = await fs.readdir(dayDir);

    expect(files).toHaveLength(1); // .md only (no embedding for empty content)

    const filePath = path.join(dayDir, files[0]);
    const fileContent = await fs.readFile(filePath, 'utf8');

    expect(fileContent).toContain('---');
    expect(fileContent).toContain('title: "');
    expect(fileContent).toContain(' - ');
    expect(fileContent).toMatch(/date: \d{4}-\d{2}-\d{2}T/);
    expect(fileContent).toMatch(/timestamp: \d+/);
  });

  test('handles large content', async () => {
    const content = 'A'.repeat(10000);

    await journalManager.writeEntry(content);

    const today = new Date();
    const dateString = getFormattedDate(today);
    const dayDir = path.join(tempDir, dateString);
    const files = await fs.readdir(dayDir);
    const filePath = path.join(dayDir, files[0]);

    const fileContent = await fs.readFile(filePath, 'utf8');
    expect(fileContent).toContain(content);
  });

  test('writes thoughts with sections', async () => {
    const thoughts = {
      feelings: 'I feel great about this feature',
      technical_insights: 'TypeScript interfaces are powerful',
    };

    await journalManager.writeThoughts(thoughts);

    const today = new Date();
    const dateString = getFormattedDate(today);
    const dayDir = path.join(tempDir, dateString);

    const files = await fs.readdir(dayDir);
    expect(files).toHaveLength(2); // .md and .embedding files

    const mdFile = files.find((f) => f.endsWith('.md'))!;
    const content = await fs.readFile(path.join(dayDir, mdFile), 'utf8');

    expect(content).toContain('## Feelings');
    expect(content).toContain('I feel great about this feature');
    expect(content).toContain('## Technical Insights');
    expect(content).toContain('TypeScript interfaces are powerful');
  });

  test('writes thoughts with all sections', async () => {
    const thoughts = {
      feelings: 'I feel great',
      project_notes: 'The architecture is solid',
      user_context: 'Jesse prefers simple solutions',
      technical_insights: 'TypeScript is powerful',
      world_knowledge: 'Git workflows matter',
    };

    await journalManager.writeThoughts(thoughts);

    const today = new Date();
    const dateString = getFormattedDate(today);
    const dayDir = path.join(tempDir, dateString);

    const files = await fs.readdir(dayDir);
    expect(files).toHaveLength(2);

    const mdFile = files.find((f) => f.endsWith('.md'))!;
    const content = await fs.readFile(path.join(dayDir, mdFile), 'utf8');

    expect(content).toContain('## Feelings');
    expect(content).toContain('## Project Notes');
    expect(content).toContain('## User Context');
    expect(content).toContain('## Technical Insights');
    expect(content).toContain('## World Knowledge');
  });

  test('writes freeform content via writeThoughts', async () => {
    const thoughts = {
      content: 'Just thinking through this design problem...\n\nThe key issue is coupling.',
    };

    await journalManager.writeThoughts(thoughts);

    const today = new Date();
    const dateString = getFormattedDate(today);
    const dayDir = path.join(tempDir, dateString);

    const files = await fs.readdir(dayDir);
    expect(files).toHaveLength(2);

    const mdFile = files.find((f) => f.endsWith('.md'))!;
    const fileContent = await fs.readFile(path.join(dayDir, mdFile), 'utf8');

    expect(fileContent).toContain('Just thinking through this design problem...');
    expect(fileContent).toContain('The key issue is coupling.');
    // Freeform content should not be wrapped in a section header
    expect(fileContent).not.toContain('## Content');
  });

  test('mixes freeform content with sections', async () => {
    const thoughts = {
      content: 'Some general thoughts.',
      feelings: 'Feeling productive today',
    };

    await journalManager.writeThoughts(thoughts);

    const today = new Date();
    const dateString = getFormattedDate(today);
    const dayDir = path.join(tempDir, dateString);

    const mdFile = (await fs.readdir(dayDir)).find((f) => f.endsWith('.md'))!;
    const fileContent = await fs.readFile(path.join(dayDir, mdFile), 'utf8');

    expect(fileContent).toContain('Some general thoughts.');
    expect(fileContent).toContain('## Feelings');
    expect(fileContent).toContain('Feeling productive today');
  });
});
