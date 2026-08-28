/**
 * RateLimitCard — 429 response with a live Retry-After countdown and a
 * retry affordance (spec §8).
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing, type } from '@/theme/theme';

interface RateLimitCardProps {
  retryAfterSec: number;
  onRetry: () => void;
}

export function RateLimitCard({ retryAfterSec, onRetry }: RateLimitCardProps) {
  const [remaining, setRemaining] = useState(retryAfterSec);

  useEffect(() => {
    setRemaining(retryAfterSec);
  }, [retryAfterSec]);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Slow down a little</Text>
      <Text style={styles.body}>
        You have hit Asteroid's free-tier rate limit. Try again in{' '}
        <Text style={styles.countdown}>{Math.max(remaining, 0)}s</Text> — cached
        searches still work instantly.
      </Text>
      <Button title="Try again" variant="secondary" onPress={onRetry} disabled={remaining > 0} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    padding: spacing(3),
    gap: spacing(2),
  },
  title: { ...type.cardTitle, color: colors.warning },
  body: { ...type.caption, lineHeight: 20 },
  countdown: { fontFamily: type.cardTitle.fontFamily, color: colors.warning },
});
