/**
 * CodeBlock — premium code card: language chip, copy button with
 * confirmation, line-preserving syntax highlighting (zero deps).
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Check, Copy } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { highlight, type TokenKind } from '@/services/highlight';
import { code, colors, font, radius, spacing } from '@/theme/theme';

const TOKEN_COLOR: Record<TokenKind, string> = {
  plain: code.plain,
  keyword: code.keyword,
  string: code.string,
  number: code.number,
  comment: code.comment,
  func: code.func,
  type: code.type,
  punct: code.punct,
};

interface CodeBlockProps {
  codeText: string;
  language?: string;
  syntax?: string;
}

export function CodeBlock({ codeText, language, syntax }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lines = useMemo(() => highlight(codeText, syntax ?? language ?? ''), [codeText, syntax, language]);
  const label = (language ?? syntax ?? 'code').toUpperCase();

  const copy = async () => {
    await Clipboard.setStringAsync(codeText);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{label}</Text>
        </View>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: '#FF5F57' }]} />
          <View style={[styles.dot, { backgroundColor: '#FEBC2E' }]} />
          <View style={[styles.dot, { backgroundColor: '#28C840' }]} />
        </View>
        <Copy onPress={copy} size={16} color={copied ? colors.success : colors.textSecondary} hitSlop={10} />
        {copied && <Text style={styles.copied}>Copied</Text>}
      </View>
      <View style={styles.codeArea}>
        {lines.map((line, i) => (
          <Text key={i} style={styles.line} numberOfLines={0}>
            {line.length === 0 ? (
              ' '
            ) : (
              line.map((token, j) => (
                <Text key={j} style={{ color: TOKEN_COLOR[token.kind] }}>
                  {token.text}
                </Text>
              ))
            )}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: code.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    backgroundColor: code.chip,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing(1.5),
  },
  chip: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontFamily: font.bodySemi, fontSize: 10, letterSpacing: 0.8, color: colors.text },
  dots: { flexDirection: 'row', gap: 5, flex: 1 },
  dot: { width: 9, height: 9, borderRadius: 5, opacity: 0.85 },
  copied: { fontFamily: font.bodyMedium, fontSize: 11, color: colors.success },
  codeArea: { padding: spacing(2) },
  line: { fontFamily: 'monospace', fontSize: 12.5, lineHeight: 20, color: code.plain },
});
