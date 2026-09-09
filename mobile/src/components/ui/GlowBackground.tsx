/**
 * Ambient radial glow layers — X-blue atmospheric light on OLED black.
 * Used on hero screens (splash, welcome, search) for depth.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GlowBackgroundProps {
  intensity?: number;
}

export function GlowBackground({ intensity = 1 }: GlowBackgroundProps) {
  return (
    <>
      <LinearGradient
        colors={['rgba(29,155,240,0.10)', 'rgba(29,155,240,0)']}
        style={[styles.glowA, { opacity: intensity }]}
      />
      <LinearGradient
        colors={['rgba(29,155,240,0.06)', 'rgba(0,0,0,0)']}
        style={[styles.glowB, { opacity: intensity }]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  glowA: {
    position: 'absolute',
    top: -200,
    right: -160,
    width: 440,
    height: 440,
    borderRadius: 220,
  },
  glowB: {
    position: 'absolute',
    bottom: -240,
    left: -180,
    width: 500,
    height: 500,
    borderRadius: 250,
  },
});
