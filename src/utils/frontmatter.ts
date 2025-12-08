import type { PromptFrontmatter } from '../types';

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

export function parseFrontmatter(content: string): {
  frontmatter: PromptFrontmatter;
  content: string;
} {
  const match = content.match(FRONTMATTER_REGEX);

  if (!match) {
    return {
      frontmatter: { name: '' },
      content: content.trim(),
    };
  }

  const [, yamlContent, markdownContent] = match;
  const frontmatter = parseYaml(yamlContent);

  return {
    frontmatter,
    content: markdownContent.trim(),
  };
}

export function stringifyFrontmatter(frontmatter: PromptFrontmatter, content: string): string {
  const yaml = stringifyYaml(frontmatter);
  return `---\n${yaml}---\n\n${content}`;
}

function parseYaml(yaml: string): PromptFrontmatter {
  const result: PromptFrontmatter = { name: '' };
  const lines = yaml.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    switch (key) {
      case 'name':
        result.name = unquoteString(value);
        break;
      case 'description':
        result.description = unquoteString(value);
        break;
      case 'created':
        result.created = unquoteString(value);
        break;
      case 'tags':
        // Handle array syntax: [tag1, tag2, tag3]
        if (value.startsWith('[') && value.endsWith(']')) {
          value = value.slice(1, -1);
          result.tags = value
            .split(',')
            .map((t) => unquoteString(t.trim()))
            .filter(Boolean);
        }
        break;
    }
  }

  return result;
}

function stringifyYaml(obj: PromptFrontmatter): string {
  const lines: string[] = [];

  if (obj.name) {
    lines.push(`name: ${quoteIfNeeded(obj.name)}`);
  }

  if (obj.description) {
    lines.push(`description: ${quoteIfNeeded(obj.description)}`);
  }

  if (obj.tags && obj.tags.length > 0) {
    const tagsStr = obj.tags.map((t) => quoteIfNeeded(t)).join(', ');
    lines.push(`tags: [${tagsStr}]`);
  }

  if (obj.created) {
    lines.push(`created: ${obj.created}`);
  }

  return lines.join('\n') + '\n';
}

function unquoteString(str: string): string {
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }
  return str;
}

function quoteIfNeeded(str: string): string {
  if (str.includes(':') || str.includes('#') || str.includes("'") || str.includes('"')) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return str;
}
