/**
 * Intent Detection — port of web `services/intentDetector.js`.
 * Rule-based, <1ms: keyword vocab + regex patterns, no network, no cost.
 * Keep in sync with the web version.
 */

const CODE_KEYWORDS = [
  // Direct code requests
  'write a code', 'write code', 'write a program', 'write program',
  'write a script', 'write script', 'write a function', 'write function',
  'create a code', 'create code', 'create a program', 'create program',
  'create a function', 'create function', 'create a class', 'create class',
  'make a code', 'make code', 'make a program', 'make program',
  'generate code', 'generate a code', 'code to', 'program to',
  'script to', 'function to', 'algorithm for', 'implement',

  // Code fixing/debugging
  'fix this code', 'fix the code', 'fix code', 'fix my code',
  'debug this', 'debug the code', 'debug code',
  'correct this code', 'correct the code',
  'solve this code', 'solve the error',
  'fix the bug', 'fix this bug', 'fix bug',

  // Code explanation with examples
  'how to code', 'how do i code', 'how to write',
  'show me code', 'give me code', 'example code',
  'code example', 'coding example',

  // Specific programming tasks
  'in python', 'in java', 'in javascript', 'in c++', 'in cpp',
  'python code', 'java code', 'javascript code', 'c++ code',
  'python program', 'java program', 'javascript program',

  // Algorithm requests
  'implement algorithm', 'sorting algorithm', 'search algorithm',
  'binary search', 'bubble sort', 'quick sort', 'merge sort',
  'linked list', 'binary tree', 'recursion for', 'recursive function',
];

// Patterns that indicate code is being shared (for fixing)
const CODE_PATTERNS = [
  /```[\s\S]*```/, // code blocks
  /def\s+\w+\s*\(/, // Python function
  /function\s+\w+\s*\(/, // JavaScript function
  /public\s+(static\s+)?void/, // Java method
  /int\s+main\s*\(/, // C/C++ main
  /class\s+\w+\s*[:{]/, // class definition
  /import\s+\w+/, // import statements
  /from\s+\w+\s+import/, // Python imports
  /#include\s*</, // C/C++ includes
  /console\.log\(/, // JavaScript
  /print\s*\(/, // Python print
  /System\.out\.print/, // Java print
];

/** Detects if a query is a coding request. */
export function isCodeRequest(query: string): boolean {
  if (!query) return false;

  const lowerQuery = query.toLowerCase();
  const hasCodeKeyword = CODE_KEYWORDS.some((keyword) =>
    lowerQuery.includes(keyword.toLowerCase()),
  );
  if (hasCodeKeyword) return true;

  // Code patterns indicate the user is sharing code
  return CODE_PATTERNS.some((pattern) => pattern.test(query));
}

/** Extracts the programming task from the query (strips request prefixes). */
export function extractCodingTask(query: string): string {
  const task = query
    .replace(/^(write|create|make|generate|give me|show me)\s+(a\s+)?(code|program|script|function)\s+(to|for|that)/i, '')
    .replace(/^(how to|how do i)\s+(code|write|create|implement)\s+(a\s+)?/i, '')
    .trim();
  return task || query;
}

/** Detects if the user is asking to fix/debug code. */
export function isFixRequest(query: string): boolean {
  if (!query) return false;
  const lower = query.toLowerCase();
  return (
    lower.includes('fix') ||
    lower.includes('debug') ||
    lower.includes('correct') ||
    lower.includes('error') ||
    lower.includes('bug') ||
    lower.includes('not working') ||
    lower.includes("doesn't work") ||
    lower.includes("won't work")
  );
}

/** Extracts preferred programming languages from the query. */
export function extractPreferredLanguages(query: string): string[] {
  const lower = query.toLowerCase();
  const languages: string[] = [];

  const languageMap: Record<string, string[]> = {
    python: ['python', 'py'],
    javascript: ['javascript', 'js', 'node'],
    java: ['java'],
    cpp: ['c++', 'cpp'],
    c: ['\\bc\\b'], // exact match for 'c'
    typescript: ['typescript', 'ts'],
    go: ['golang', '\\bgo\\b'],
    rust: ['rust'],
    ruby: ['ruby'],
    php: ['php'],
    swift: ['swift'],
    kotlin: ['kotlin'],
  };

  for (const [lang, patterns] of Object.entries(languageMap)) {
    for (const pattern of patterns) {
      if (new RegExp(pattern, 'i').test(lower)) {
        languages.push(lang);
        break;
      }
    }
  }

  return languages;
}
