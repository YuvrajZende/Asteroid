/**
 * OtpInput — 6 cells with auto-advance, backspace and paste support.
 * Implementation: one invisible TextInput captures the raw code (so
 * paste works natively); the 6 visible cells mirror its value.
 */
import React, { useRef } from 'react';
import { StyleSheet, Text, TextInput, View, TextInputProps } from 'react-native';
import { colors, font, radius } from '@/theme/theme';

const LENGTH = 6;

interface OtpInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (code: string) => void;
}

export function OtpInput({ value, onChangeText, ...inputProps }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={styles.wrap}>
      <View style={styles.cells}>
        {Array.from({ length: LENGTH }).map((_, i) => {
          const char = value[i] ?? '';
          const active = i === Math.min(value.length, LENGTH - 1);
          return (
            <View
              key={i}
              style={[styles.cell, { borderColor: active ? colors.accent : colors.border }]}
            >
              <TextInput style={styles.hiddenInput} editable={false} value={char} />
              <Text style={styles.char}>{char}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        {...inputProps}
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChangeText(text.replace(/\D/g, '').slice(0, LENGTH))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        maxLength={LENGTH}
        style={styles.capture}
        autoFocus
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  cells: { flexDirection: 'row', justifyContent: 'space-between' },
  cell: {
    width: 48,
    height: 56,
    borderRadius: radius.input,
    borderWidth: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenInput: { display: 'none' },
  char: { fontFamily: font.display, fontSize: 22, color: colors.text },
  capture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    opacity: 0,
    fontSize: 1,
  },
});

export const OTP_LENGTH = LENGTH;
