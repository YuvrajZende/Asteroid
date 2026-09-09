/** ImageCarousel — horizontally scrolling image results (spec §7). */
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, radius, spacing, type } from '@/theme/theme';
import type { ImageResult } from '@/types/api';

export function ImageCarousel({ images }: { images: ImageResult[] }) {
  const usable = (images ?? []).filter((img) => img.src || img.thumbnail);
  if (usable.length === 0) return null;

  return (
    <View>
      <Text style={styles.heading}>Images</Text>
      <View style={styles.carousel}>
        {usable.slice(0, 10).map((img, i) => (
          <Pressable
            key={`${img.src}-${i}`}
            onPress={() => img.url && Linking.openURL(img.url).catch(() => {})}
            style={styles.item}
          >
            {/* eslint-disable-next-line jsx-a11y/alt-text -- native Image has no alt prop; a11y via accessibilityLabel */}
            <Image
              source={{ uri: img.thumbnail ?? img.src }}
              style={styles.image}
              contentFit="cover"
              recyclingKey={`${img.src}-${i}`}
              transition={150}
              accessibilityLabel={img.title ?? 'Search result image'}
            />
            {!!img.source && <Text style={styles.source} numberOfLines={1}>{img.source}</Text>}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { ...type.sectionHeading, fontSize: 20, marginBottom: spacing(1.5) },
  carousel: { flexDirection: 'row', flexWrap: 'nowrap', gap: spacing(1.5) },
  item: { width: 140 },
  image: {
    width: 140,
    height: 100,
    borderRadius: radius.image / 2,
    backgroundColor: colors.elevated,
  },
  source: { ...type.caption, marginTop: 4, width: 140 },
});
