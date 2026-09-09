/**
 * PasswordField — TextField + show/hide + strength meter. Pill-shaped, X/Grok style.
 */
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, TextInputProps } from 'react-native';
import { TextField } from '@/components/ui/TextField';
import { colors, font, spacing } from '@/theme/theme';

interface PasswordFieldProps extends TextInputProps {
  label: string;
  error?: string | null;
}

type Strength = 'weak' | 'fair' | 'strong';

function scorePassword(value: string): Strength {
  if (value.length < 8) return 'weak';
  const variety = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((r) => r.test(value)).length;
  if (value.length >= 12 && variety >= 3) return 'strong';
  if (value.length >= 8 && variety >= 2) return 'fair';
  return 'weak';
}

const STRENGTH_META: Record<Strength, { label: string; color: string; segments: number }> = {
  weak: { label: 'Weak', color: colors.critical, segments: 1 },
  fair: { label: 'Fair', color: colors.warning, segments: 2 },
  strong: { label: 'Strong', color: colors.success, segments: 3 },
};

export function PasswordField({ label, error, value, onChangeText, ...inputProps }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const strength = useMemo(() => scorePassword(String(value ?? '')), [value]);
  const meta = STRENGTH_META[strength];
  const showMeter = String(value ?? '').length > 0;

  return (
    <View>
      <TextField
        {...inputProps}
        label={label}
        error={error}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        autoCapitalize="none"
        style={styles.input}
      />
      <View style={styles.row}>
        {showMeter ? (
          <>
            <View style={styles.meter}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[styles.segment, { backgroundColor: i < meta.segments ? meta.color : colors.elevated }]}
                />
              ))}
            </View>
            <Text style={[styles.strengthLabel, { color: meta.color }]}>{meta.label}</Text>
          </>
        ) : (
          <View />
        )}
        <Pressable hitSlop={12} onPress={() => setVisible((v) => !v)} accessibilityLabel={visible ? 'Hide password' : 'Show password'}>
          <Text style={styles.toggle}>{visible ? 'Hide' : 'Show'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { paddingRight: 64 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing(1),
    paddingHorizontal: 4,
  },
  meter: { flexDirection: 'row', gap: 4, flex: 1 },
  segment: { height: 4, width: 28, borderRadius: 2 },
  strengthLabel: { fontFamily: font.bodyMedium, fontSize: 12, marginLeft: 8 },
  toggle: { fontFamily: font.bodyMedium, fontSize: 13, color: colors.accent },
});
