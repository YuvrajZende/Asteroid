/**
 * TextField — label, focus ring, error message slot (v1 spec §5).
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TextInputProps } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, font, radius, spacing } from '@/theme/theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string | null;
}

export function TextField({ label, error, style, ...inputProps }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        placeholderTextColor={colors.textSecondary}
        onFocus={(e) => {
          setFocused(true);
          inputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          inputProps.onBlur?.(e);
        }}
        style={[
          styles.input,
          { borderColor: error ? colors.critical : focused ? colors.accent : colors.border },
          style,
        ]}
      />
      {!!error && (
        <Animated.Text entering={FadeIn.duration(150)} style={styles.error}>
          {error}
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing(2) },
  label: {
    fontFamily: font.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    height: 52,
    borderRadius: radius.input,
    borderWidth: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(2),
    fontFamily: font.body,
    fontSize: 16,
    color: colors.text,
  },
  error: {
    fontFamily: font.body,
    fontSize: 13,
    color: colors.critical,
    marginTop: 6,
  },
});
