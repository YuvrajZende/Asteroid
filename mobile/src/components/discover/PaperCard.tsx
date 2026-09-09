/**
 * PaperCard — borderless scholarly paper card with X-style surface elevation.
 */
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { FileText, GraduationCap } from 'lucide-react-native';
import { colors, font, radius, spacing } from '@/theme/theme';
import type { Paper } from '@/types/api';

interface PaperCardProps {
  paper: Paper;
  onAskAi: (paper: Paper) => void;
}

export function PaperCard({ paper, onAskAi }: PaperCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <GraduationCap size={16} color={colors.accent} />
        <Text style={styles.citations} numberOfLines={1}>
          {paper.citedBy ?? 0} citations{paper.year ? ` · ${paper.year}` : ''}
        </Text>
      </View>

      <Pressable
        disabled={!paper.link}
        onPress={() => paper.link && Linking.openURL(paper.link).catch(() => {})}
      >
        <Text style={styles.title} numberOfLines={3}>
          {paper.title}
        </Text>
      </Pressable>

      {!!paper.authors && (
        <Text style={styles.authors} numberOfLines={2}>
          {paper.authors}
        </Text>
      )}
      {!!paper.snippet && (
        <Text style={styles.snippet} numberOfLines={2}>
          {paper.snippet}
        </Text>
      )}

      <View style={styles.actions}>
        {!!paper.pdfLink && (
          <Pressable style={styles.chip} onPress={() => Linking.openURL(paper.pdfLink!).catch(() => {})}>
            <FileText size={13} color={colors.accent} />
            <Text style={styles.chipText}>PDF</Text>
          </Pressable>
        )}
        <Pressable style={[styles.chip, styles.askChip]} onPress={() => onAskAi(paper)}>
          <Text style={[styles.chipText, { color: '#000000' }]}>Ask AI about this paper</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing(2.5),
    gap: 6,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  citations: { fontFamily: font.bodySemi, fontSize: 12, color: colors.accent, flex: 1 },
  title: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 21, color: colors.text },
  authors: { fontFamily: font.body, fontSize: 12.5, color: colors.textSecondary },
  snippet: { fontFamily: font.body, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing(1), marginTop: 4, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.elevated,
    borderRadius: radius.button,
    paddingHorizontal: spacing(1.5),
    paddingVertical: 6,
  },
  askChip: { backgroundColor: '#FFFFFF' },
  chipText: { fontFamily: font.bodySemi, fontSize: 12, color: colors.text },
});
