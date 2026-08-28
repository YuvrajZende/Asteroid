/**
 * Ambient radial glow layers for hero screens (splash, welcome).
 * Linear gradients masked into large circles — teal + void, per v1 spec §2.
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
        colors={['rgba(43,176,199,0.16)', 'rgba(43,176,199,0)']}
        style={[styles.glowA, { opacity: intensity }]}
      />
      <LinearGradient
        colors={['rgba(32,128,141,0.10)', 'rgba(25,26,26,0)']}
        style={[styles.glowB, { opacity: intensity }]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  glowA: {
    position: 'absolute',
    top: -180,
    right: -140,
    width: 420,
    height: 420,
    borderRadius: 210,
  },
  glowB: {
    position: 'absolute',
    bottom: -220,
    left: -160,
    width: 480,
    height: 480,
    borderRadius: 240,
  },
});
