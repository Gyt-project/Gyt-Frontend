import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import css from 'highlight.js/lib/languages/css';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import php from 'highlight.js/lib/languages/php';
import python from 'highlight.js/lib/languages/python';
import ruby from 'highlight.js/lib/languages/ruby';
import rust from 'highlight.js/lib/languages/rust';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('c', c);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('css', css);
hljs.registerLanguage('go', go);
hljs.registerLanguage('java', java);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('php', php);
hljs.registerLanguage('python', python);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('yaml', yaml);

const EXT_MAP: Record<string, string> = {
  js: 'javascript', jsx: 'javascript', cjs: 'javascript', mjs: 'javascript',
  ts: 'typescript', tsx: 'typescript', cts: 'typescript', mts: 'typescript',
  py: 'python', pyw: 'python',
  go: 'go',
  rs: 'rust',
  java: 'java',
  c: 'c', h: 'c',
  cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp',
  rb: 'ruby', rake: 'ruby',
  php: 'php',
  sh: 'bash', bash: 'bash', zsh: 'bash',
  css: 'css', scss: 'css',
  html: 'xml', htm: 'xml', svg: 'xml', xml: 'xml',
  json: 'json', jsonc: 'json',
  yml: 'yaml', yaml: 'yaml',
  md: 'markdown', mdx: 'markdown',
  sql: 'sql',
  toml: 'yaml',
  mod: 'go',
  proto: 'cpp',
  graphql: 'javascript', gql: 'javascript',
};

export function langFromPath(path: string): string | null {
  const filename = path.split('/').pop() ?? path;
  // Special filenames
  if (filename === 'Dockerfile' || filename.startsWith('Dockerfile.')) return 'bash';
  if (filename === 'Makefile') return 'bash';
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return EXT_MAP[ext] ?? null;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Highlights an array of code lines, one line at a time.
 * Returns an array of HTML strings (one per input line).
 * Per-line approach avoids broken HTML from cross-line <span> tags.
 */
export function highlightLines(lines: string[], language: string): string[] {
  return lines.map((line) => {
    if (!line) return '';
    try {
      return hljs.highlight(line, { language, ignoreIllegals: true }).value;
    } catch {
      return escapeHtml(line);
    }
  });
}
