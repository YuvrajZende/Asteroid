/**
 * ImageGalleryStrip — Component 5:
 * Horizontally scrollable row of small rounded thumbnail images under an "Images" header label.
 * Matches Image 1 thumbnail strip.
 */
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, font, radius, spacing } from '@/theme/theme';
import type { ImageResult } from '@/types/api';

interface ImageGalleryStripProps {
  images: ImageResult[];
}

export function ImageGalleryStrip({ images }: ImageGalleryStripProps) {
  if (!images || images.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.headerLabel}>Images</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {images.map((img, idx) => {
          const uri = img.thumbnail || img.src;
          const targetUrl = img.url || img.src;
          return (
            <Pressable
              key={idx}
              style={styles.thumbWrap}
              onPress={() => {
                if (targetUrl) {
                  Linking.openURL(targetUrl).catch(() => {});
                }
              }}
            >
              <Image
                source={{ uri }}
                style={styles.thumb}
                contentFit="cover"
                transition={180}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing(1.5),
    gap: spacing(1.5),
  },
  headerLabel: {
    fontFamily: font.bodySemi,
    fontSize: 16,
    color: colors.text,
    letterSpacing: -0.2,
    paddingHorizontal: 2,
  },
  scrollContent: {
    gap: spacing(1.5),
    paddingRight: spacing(2),
  },
  thumbWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#16181C',
  },
  thumb: {
    width: 120,
    height: 80,
    borderRadius: 14,
    backgroundColor: colors.elevated,
  },
});
