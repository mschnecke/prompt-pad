import { describe, it, expect } from 'vitest';
import { parseFrontmatter, stringifyFrontmatter } from './frontmatter';

describe('frontmatter', () => {
  describe('parseFrontmatter', () => {
    it('parses basic frontmatter with all fields', () => {
      const content = `---
name: Test Prompt
description: A test description
tags: [tag1, tag2, tag3]
created: 2025-01-15T10:30:00Z
---

This is the prompt content.`;

      const result = parseFrontmatter(content);

      expect(result.frontmatter.name).toBe('Test Prompt');
      expect(result.frontmatter.description).toBe('A test description');
      expect(result.frontmatter.tags).toEqual(['tag1', 'tag2', 'tag3']);
      expect(result.frontmatter.created).toBe('2025-01-15T10:30:00Z');
      expect(result.content).toBe('This is the prompt content.');
    });

    it('parses frontmatter with missing optional fields', () => {
      const content = `---
name: Simple Prompt
---

Just content.`;

      const result = parseFrontmatter(content);

      expect(result.frontmatter.name).toBe('Simple Prompt');
      expect(result.frontmatter.description).toBeUndefined();
      expect(result.frontmatter.tags).toBeUndefined();
      expect(result.frontmatter.created).toBeUndefined();
      expect(result.content).toBe('Just content.');
    });

    it('handles quoted strings in frontmatter', () => {
      const content = `---
name: "Quoted: Name"
description: 'Single quoted'
---

Content here.`;

      const result = parseFrontmatter(content);

      expect(result.frontmatter.name).toBe('Quoted: Name');
      expect(result.frontmatter.description).toBe('Single quoted');
    });

    it('handles empty tags array', () => {
      const content = `---
name: No Tags
tags: []
---

Content.`;

      const result = parseFrontmatter(content);

      expect(result.frontmatter.tags).toEqual([]);
    });

    it('returns content without frontmatter when no frontmatter present', () => {
      const content = 'Just plain content without frontmatter.';

      const result = parseFrontmatter(content);

      expect(result.frontmatter.name).toBe('');
      expect(result.content).toBe('Just plain content without frontmatter.');
    });

    it('handles multiline content after frontmatter', () => {
      const content = `---
name: Multiline
---

Line 1
Line 2
Line 3`;

      const result = parseFrontmatter(content);

      expect(result.content).toBe('Line 1\nLine 2\nLine 3');
    });

    it('handles tags with quoted values', () => {
      const content = `---
name: Tagged
tags: ["tag:special", 'another']
---

Content.`;

      const result = parseFrontmatter(content);

      expect(result.frontmatter.tags).toEqual(['tag:special', 'another']);
    });

    it('filters empty tags', () => {
      const content = `---
name: Test
tags: [tag1, , tag2, ]
---

Content.`;

      const result = parseFrontmatter(content);

      expect(result.frontmatter.tags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('stringifyFrontmatter', () => {
    it('creates frontmatter with all fields', () => {
      const frontmatter = {
        name: 'Test Prompt',
        description: 'A description',
        tags: ['tag1', 'tag2'],
        created: '2025-01-15T10:30:00Z',
      };

      const result = stringifyFrontmatter(frontmatter, 'Content here');

      expect(result).toContain('---\n');
      expect(result).toContain('name: Test Prompt');
      expect(result).toContain('description: A description');
      expect(result).toContain('tags: [tag1, tag2]');
      expect(result).toContain('created: 2025-01-15T10:30:00Z');
      expect(result).toContain('---\n\nContent here');
    });

    it('omits empty optional fields', () => {
      const frontmatter = {
        name: 'Simple',
      };

      const result = stringifyFrontmatter(frontmatter, 'Content');

      expect(result).toContain('name: Simple');
      expect(result).not.toContain('description:');
      expect(result).not.toContain('tags:');
      expect(result).not.toContain('created:');
    });

    it('quotes strings with special characters', () => {
      const frontmatter = {
        name: 'Name: With Colon',
        description: 'Has # hash',
      };

      const result = stringifyFrontmatter(frontmatter, 'Content');

      expect(result).toContain('name: "Name: With Colon"');
      expect(result).toContain('description: "Has # hash"');
    });

    it('escapes double quotes in values', () => {
      const frontmatter = {
        name: 'Has "quotes" inside',
      };

      const result = stringifyFrontmatter(frontmatter, 'Content');

      expect(result).toContain('name: "Has \\"quotes\\" inside"');
    });

    it('handles empty tags array', () => {
      const frontmatter = {
        name: 'Test',
        tags: [],
      };

      const result = stringifyFrontmatter(frontmatter, 'Content');

      expect(result).not.toContain('tags:');
    });
  });

  describe('roundtrip', () => {
    it('preserves data through parse and stringify cycle', () => {
      const original = {
        name: 'Roundtrip Test',
        description: 'Testing roundtrip',
        tags: ['tag1', 'tag2'],
        created: '2025-01-15T10:30:00Z',
      };
      const content = 'Original content';

      const stringified = stringifyFrontmatter(original, content);
      const parsed = parseFrontmatter(stringified);

      expect(parsed.frontmatter.name).toBe(original.name);
      expect(parsed.frontmatter.description).toBe(original.description);
      expect(parsed.frontmatter.tags).toEqual(original.tags);
      expect(parsed.frontmatter.created).toBe(original.created);
      expect(parsed.content).toBe(content);
    });
  });
});
