/**
 * FactGrid — Component 3:
 * Vertical list of label/value rows (e.g. "Origin" / "Thought to have originated in the early Edo period").
 * Label in muted gray, value in white.
 * Optionally paired with a header thumbnail + title + subtitle at top (Image 4 Kabuki pattern).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, font, radius, spacing } from '@/theme/theme';

export interface FactItem {
  label: string;
  value: string;
}

interface FactGridProps {
  title?: string;
  subtitle?: string;
  image?: string;
  facts: FactItem[];
}

export function FactGrid({ title, subtitle, image, facts }: FactGridProps) {
  if (!facts || facts.length === 0) return null;

  return (
    <View style={styles.card}>
      {/* Optional Top Header Row with Icon/Image + Title */}
      {(!!title || !!image) && (
        <View style={styles.headerRow}>
          {!!image && (
            <Image
              source={{ uri: image }}
              style={styles.headerImage}
              contentFit="cover"
              transition={150}
            />
          )}
          <View style={styles.headerTextCol}>
            {!!title && <Text style={styles.headerTitle}>{title}</Text>}
            {!!subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
          </View>
        </View>
      )}

      {/* Facts Rows */}
      <View style={styles.factsList}>
        {facts.map((fact, idx) => (
          <View key={idx} style={styles.factRow}>
            <Text style={styles.factLabel}>{fact.label}</Text>
            <Text style={styles.factValue}>{fact.value}</Text>
          </View>
        ))}
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
    gap: spacing(2),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    paddingBottom: spacing(1.5),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.elevated,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: font.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  headerSubtitle: {
    fontFamily: font.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  factsList: {
    gap: spacing(1.5),
  },
  factRow: {
    gap: 3,
  },
  factLabel: {
    fontFamily: font.bodyMedium,
    fontSize: 12.5,
    color: '#8E959E',
    letterSpacing: 0.2,
  },
  factValue: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
});
