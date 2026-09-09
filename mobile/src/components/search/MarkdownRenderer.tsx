/**
 * MarkdownRenderer — themed markdown. Citation markers `[1]` are rewritten
 * into `[1](url)` links (out-of-range citations stay plain text — the
 * fake-citation guard); the library's `onLinkPress` opens them.
 */
import React from 'react';
import Markdown from 'react-native-markdown-display';
import { Linking } from 'react-native';
import { CodeBlock } from '@/components/search/CodeBlock';
import { colors, font, radius, spacing } from '@/theme/theme';
import type { SourceRef } from '@/types/api';

interface MarkdownRendererProps {
  content: string;
  sources?: SourceRef[];
}

/** Rewrites `[n]` citation markers into `[n](url)` links, bounds-checked. */
function linkifyCitations(text: string, sources: SourceRef[]): string {
  return text.replace(/\[(\d{1,2})\]/g, (match, num: string) => {
    const index = parseInt(num, 10);
    const source = sources.find((s) => s.number === index);
    return source?.url ? `[${num}](${source.url})` : match;
  });
}

export function MarkdownRenderer({ content, sources = [] }: MarkdownRendererProps) {
  const rules = {
    // Premium fenced code: syntax-highlighted card with copy button
    fence: (node: { key?: string; sourceInfo?: string; content?: string }) => (
      <CodeBlock
        key={node.key}
        codeText={(node.content ?? '').replace(/\n$/, '')}
        language={node.sourceInfo}
      />
    ),
  };

  return (
    <Markdown
      style={mdStyles}
      rules={rules}
      onLinkPress={(url) => {
        Linking.openURL(url).catch(() => {});
        return false;
      }}
    >
      {linkifyCitations(content, sources)}
    </Markdown>
  );
}

const mdStyles = {
  body: { color: colors.text, fontFamily: font.body, fontSize: 15, lineHeight: 24 },
  heading1: { ...headingStyle(24) },
  heading2: { ...headingStyle(20) },
  heading3: { ...headingStyle(17) },
  heading4: { ...headingStyle(16) },
  strong: { fontFamily: font.bodySemi, color: colors.text },
  em: { fontStyle: 'italic' as const, color: colors.text },
  bullet_list: { marginTop: spacing(1), marginBottom: spacing(1) },
  ordered_list: { marginTop: spacing(1), marginBottom: spacing(1) },
  list_item: { marginBottom: spacing(0.5) },
  paragraph: { marginTop: 0, marginBottom: spacing(1.5) },
  link: { color: colors.accentBright, textDecorationLine: 'underline' as const },
  code_inline: {
    fontFamily: 'monospace',
    backgroundColor: colors.elevated,
    color: colors.accentBright,
    borderRadius: radius.input / 2,
    fontSize: 13,
  },
  fence: {
    backgroundColor: colors.elevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing(2),
    fontFamily: 'monospace',
    fontSize: 13,
    color: colors.text,
  },
  blockquote: {
    backgroundColor: colors.surface,
    borderLeftColor: colors.accent,
    borderLeftWidth: 3,
    paddingHorizontal: spacing(2),
    borderRadius: radius.input / 2,
  },
  hr: { backgroundColor: colors.border, height: 1, marginVertical: spacing(2) },
};

function headingStyle(size: number) {
  return {
    fontFamily: font.display,
    fontSize: size,
    lineHeight: Math.round(size * 1.25),
    color: colors.text,
    marginTop: spacing(1),
    marginBottom: spacing(1),
  };
}
