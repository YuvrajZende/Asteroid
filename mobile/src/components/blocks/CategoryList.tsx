/**
 * CategoryList — Component 4:
 * Checklist-style list of rows with status icons (check ✓, x ✕, dot • in muted badges),
 * bold label, and 1-2 lines of gray explanatory text.
 * Rows are collapsible/expandable on tap (matches Image 3 pattern).
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check, ChevronDown, Circle, X } from 'lucide-react-native';
import { colors, font, radius, spacing } from '@/theme/theme';

export interface CategoryItem {
  status?: 'positive' | 'negative' | 'neutral';
  label: string;
  description?: string;
}

interface CategoryListProps {
  title?: string;
  categories: CategoryItem[];
}

export function CategoryList({ title, categories }: CategoryListProps) {
  if (!categories || categories.length === 0) return null;

  // Track expanded state for each item; default to expanded for top 2
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
  });

  const toggleIndex = (idx: number) => {
    Haptics.selectionAsync().catch(() => {});
    setExpandedIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const renderStatusIcon = (status?: 'positive' | 'negative' | 'neutral') => {
    if (status === 'negative') {
      return (
        <View style={[styles.iconBadge, styles.negativeBadge]}>
          <X size={11} color="#9E9E9E" strokeWidth={2.5} />
        </View>
      );
    }
    if (status === 'neutral') {
      return (
        <View style={[styles.iconBadge, styles.neutralBadge]}>
          <Circle size={8} color="#9E9E9E" fill="#9E9E9E" />
        </View>
      );
    }
    // Default: positive
    return (
      <View style={[styles.iconBadge, styles.positiveBadge]}>
        <Check size={11} color="#00D2C4" strokeWidth={3} />
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {!!title && <Text style={styles.cardTitle}>{title}</Text>}

      <View style={styles.list}>
        {categories.map((cat, idx) => {
          const isExpanded = !!expandedIndices[idx];
          return (
            <Pressable
              key={idx}
              style={[styles.row, idx > 0 && styles.rowDivider]}
              onPress={() => toggleIndex(idx)}
            >
              <View style={styles.labelRow}>
                {renderStatusIcon(cat.status)}
                <Text style={styles.labelText}>{cat.label}</Text>
                {!!cat.description && (
                  <ChevronDown
                    size={14}
                    color={colors.textSecondary}
                    style={{
                      marginLeft: 'auto',
                      transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
                    }}
                  />
                )}
              </View>

              {isExpanded && !!cat.description && (
                <Text style={styles.descriptionText}>{cat.description}</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16181C',
    borderRadius: 18,
    padding: spacing(2.5),
    marginVertical: spacing(1.5),
    gap: spacing(1.5),
  },
  cardTitle: {
    fontFamily: font.bodySemi,
    fontSize: 16,
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  list: {
    gap: spacing(1.5),
  },
  row: {
    paddingVertical: spacing(0.75),
    gap: 6,
  },
  rowDivider: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: spacing(1.5),
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
  },
  iconBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positiveBadge: {
    backgroundColor: 'rgba(0, 210, 196, 0.18)',
  },
  negativeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  neutralBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  labelText: {
    fontFamily: font.bodySemi,
    fontSize: 14.5,
    color: colors.text,
  },
  descriptionText: {
    fontFamily: font.body,
    fontSize: 13.5,
    lineHeight: 19,
    color: '#9CA3AF',
    paddingLeft: 32,
  },
});
