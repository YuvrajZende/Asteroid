/**
 * Lightweight regex-based syntax highlighter — zero dependencies.
 * Emits colored token spans per line; supports the language families the
 * backend's code route emits (JS/TS, Python, Java, C/C++, Go, Rust, etc.).
 */

export type TokenKind =
  | 'plain'
  | 'keyword'
  | 'string'
  | 'comment'
  | 'number'
  | 'func'
  | 'type'
  | 'punct';

export interface Token {
  text: string;
  kind: TokenKind;
}

const KEYWORDS: Record<string, string[]> = {
  js: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'class', 'extends', 'new', 'import', 'export', 'from', 'default', 'async',
    'await', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'switch',
    'case', 'break', 'continue', 'do', 'in', 'of', 'this', 'super', 'yield', 'delete',
  ],
  py: [
    'def', 'return', 'if', 'elif', 'else', 'for', 'while', 'class', 'import',
    'from', 'as', 'with', 'try', 'except', 'finally', 'raise', 'lambda', 'yield',
    'global', 'nonlocal', 'pass', 'break', 'continue', 'in', 'is', 'not', 'and',
    'or', 'assert', 'async', 'await', 'del', 'match', 'case',
  ],
  java: [
    'public', 'private', 'protected', 'static', 'final', 'void', 'class', 'interface',
    'extends', 'implements', 'return', 'if', 'else', 'for', 'while', 'do', 'switch',
    'case', 'break', 'continue', 'new', 'import', 'package', 'try', 'catch', 'finally',
    'throw', 'throws', 'this', 'super', 'abstract', 'synchronized', 'enum', 'record',
  ],
  c: [
    'int', 'char', 'float', 'double', 'void', 'long', 'short', 'unsigned', 'signed',
    'struct', 'union', 'enum', 'typedef', 'const', 'static', 'return', 'if', 'else',
    'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'sizeof', 'include',
    'define', 'class', 'public', 'private', 'protected', 'namespace', 'using', 'template',
    'new', 'delete', 'try', 'catch', 'throw', 'bool', 'auto',
  ],
  go: [
    'func', 'package', 'import', 'var', 'const', 'type', 'struct', 'interface', 'map',
    'chan', 'go', 'defer', 'return', 'if', 'else', 'for', 'range', 'switch', 'case',
    'break', 'continue', 'select', 'fallthrough', 'goto',
  ],
  rust: [
    'fn', 'let', 'mut', 'const', 'struct', 'enum', 'trait', 'impl', 'pub', 'use', 'mod',
    'match', 'if', 'else', 'for', 'while', 'loop', 'return', 'break', 'continue', 'where',
    'async', 'await', 'move', 'ref', 'dyn', 'crate', 'self', 'Self', 'super',
  ],
};

const TYPE_WORDS = [
  'string', 'number', 'boolean', 'int', 'float', 'double', 'str', 'bool', 'char',
  'long', 'short', 'byte', 'void', 'any', 'unknown', 'never', 'Object', 'List',
  'Map', 'Vec', 'Option', 'Result', 'String', 'Integer', 'Double', 'Promise', 'Array',
];

function keywordSet(lang: string): Set<string> {
  const l = lang.toLowerCase();
  if (l.startsWith('py')) return new Set(KEYWORDS.py);
  if (l.startsWith('java') || l === 'kotlin' || l.startsWith('swift')) return new Set(KEYWORDS.java);
  if (l.startsWith('c') || l === 'cpp' || l === 'c++' || l === 'cs' || l.startsWith('php')) return new Set(KEYWORDS.c);
  if (l === 'go' || l === 'golang') return new Set(KEYWORDS.go);
  if (l === 'rust' || l === 'rs') return new Set(KEYWORDS.rust);
  if (l === 'sql') return new Set(['select', 'from', 'where', 'join', 'left', 'right', 'inner', 'group', 'order', 'by', 'insert', 'into', 'values', 'update', 'set', 'delete', 'create', 'table', 'and', 'or', 'not', 'null', 'limit']);
  return new Set([...KEYWORDS.js, ...KEYWORDS.c.slice(0, 8)]);
}

const TOKENIZER =
  /(\/\/[^\n]*|#[^\n]*|--[^\n]*|\/\*[\s\S]*?\*\/|"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b[A-Za-z_$][\w$]*\b|\s+|[^\w\s])/g;

/**
 * Tokenize one code string into colored spans.
 * Blocks (multiline strings/comments) are split across the returned lines.
 */
export function highlight(codeText: string, lang = ''): Token[][] {
  const keywords = keywordSet(lang);
  const tokens: Token[] = [];

  const matches = codeText.match(TOKENIZER) ?? [codeText];
  for (const raw of matches) {
    if (/^(\/\/|#|--|\/\*)/.test(raw)) {
      tokens.push({ text: raw, kind: 'comment' });
    } else if (/^["'`]/.test(raw)) {
      tokens.push({ text: raw, kind: 'string' });
    } else if (/^\d/.test(raw)) {
      tokens.push({ text: raw, kind: 'number' });
    } else if (/^[A-Za-z_$][\w$]*$/.test(raw)) {
      if (keywords.has(raw) || keywords.has(raw.toLowerCase())) {
        tokens.push({ text: raw, kind: 'keyword' });
      } else if (TYPE_WORDS.includes(raw)) {
        tokens.push({ text: raw, kind: 'type' });
      } else if (new RegExp(`\\b${raw}\\s*\\(`).test(codeText) && !/^(if|for|while|switch|catch|return)$/.test(raw)) {
        tokens.push({ text: raw, kind: 'func' });
      } else if (/^[A-Z]/.test(raw)) {
        tokens.push({ text: raw, kind: 'type' });
      } else {
        tokens.push({ text: raw, kind: 'plain' });
      }
    } else if (/^[^\w\s]+$/.test(raw)) {
      tokens.push({ text: raw, kind: 'punct' });
    } else {
      tokens.push({ text: raw, kind: 'plain' });
    }
  }

  // Split tokens containing newlines into per-line arrays
  const lines: Token[][] = [[]];
  for (const token of tokens) {
    const parts = token.text.split('\n');
    parts.forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ text: part, kind: token.kind });
    });
  }
  return lines;
}
