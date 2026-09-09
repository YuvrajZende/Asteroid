/**
 * ModelPicker — bottom sheet listing AI models. X/Grok-style dark surface,
 * blue accent for active selection.
 */
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AIModelsOptions } from '@/services/models';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { ModelId } from '@/types/api';
import { colors, font, radius, spacing, type as typeScale } from '@/theme/theme';

interface ModelPickerProps {
  visible: boolean;
  onClose: () => void;
}

function Check() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M20 6L9 17l-5-5" fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ModelPicker({ visible, onClose }: ModelPickerProps) {
  const model = useSettingsStore((s) => s.model);
  const setModel = useSettingsStore((s) => s.setModel);

  const choose = (id: ModelId) => {
    setModel(id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Choose model</Text>
          {AIModelsOptions.map((option) => {
            const active = option.id === model;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                onPress={() => choose(option.id)}
                style={({ pressed }) => [styles.option, active && styles.optionActive, { opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <View style={styles.optionText}>
                  <Text style={styles.optionName}>{option.name}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                {active && <Check />}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing(3),
    paddingTop: spacing(2),
    paddingBottom: spacing(5),
    gap: spacing(1),
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.elevated,
    marginBottom: spacing(2),
  },
  title: { ...typeScale.sectionHeading, marginBottom: spacing(1) },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing(2),
    borderRadius: radius.card,
    backgroundColor: colors.bg,
  },
  optionActive: { backgroundColor: colors.accentGlow, borderWidth: 1, borderColor: colors.accent },
  optionIcon: { fontSize: 22, marginRight: spacing(2) },
  optionText: { flex: 1 },
  optionName: { fontFamily: font.bodySemi, fontSize: 15, color: colors.text },
  optionDescription: { fontFamily: font.body, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
