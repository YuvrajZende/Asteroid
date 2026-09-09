/**
 * ProductCard — Component 6:
 * E-commerce product card with photo, store badge ("Best Buy"), bold product name,
 * feature chips, star rating + review count, price in large text, and rounded CTA button.
 * Matches Image 3 layout.
 */
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Check, Star } from 'lucide-react-native';
import { colors, font, radius, spacing } from '@/theme/theme';

export interface ProductCardProps {
  store?: string;
  name: string;
  image?: string;
  rating?: number;
  reviewCount?: number | string;
  price: string;
  buyUrl?: string;
  tags?: string[];
}

export function ProductCard({
  store = 'Best Buy',
  name,
  image,
  rating = 4.6,
  reviewCount = '3,757',
  price,
  buyUrl,
  tags = ['Noise Cancellation', 'Comfort', 'Battery Life'],
}: ProductCardProps) {
  const handleBuy = () => {
    if (buyUrl) {
      Linking.openURL(buyUrl).catch(() => {});
    }
  };

  return (
    <View style={styles.card}>
      {/* Product Image */}
      {!!image && (
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: image }}
            style={styles.image}
            contentFit="cover"
            transition={150}
          />
        </View>
      )}

      {/* Store Badge */}
      <View style={styles.storeBadgeRow}>
        <View style={styles.storeDot} />
        <Text style={styles.storeName}>{store}</Text>
      </View>

      {/* Product Title */}
      <Text style={styles.productName}>{name}</Text>

      {/* Feature Tags with checkmarks */}
      {tags && tags.length > 0 && (
        <View style={styles.tagsRow}>
          {tags.map((tag, idx) => (
            <View key={idx} style={styles.tagPill}>
              <Check size={11} color="#00D2C4" strokeWidth={3} />
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Rating & Reviews */}
      <View style={styles.ratingRow}>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={12}
              color="#00D2C4"
              fill={s <= Math.floor(rating) ? '#00D2C4' : 'transparent'}
            />
          ))}
        </View>
        <Text style={styles.ratingText}>
          {rating} ({reviewCount})
        </Text>
      </View>

      {/* Price */}
      <Text style={styles.priceText}>{price}</Text>

      {/* CTA Button */}
      <Pressable onPress={handleBuy} style={styles.ctaButton}>
        <Text style={styles.ctaButtonText}>Buy with {store}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16181C',
    borderRadius: 20,
    padding: spacing(2.5),
    marginVertical: spacing(1.5),
    gap: spacing(1.5),
  },
  imageWrap: {
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.elevated,
    marginBottom: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  storeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F59E0B',
  },
  storeName: {
    fontFamily: font.bodyMedium,
    fontSize: 12,
    color: '#8E959E',
  },
  productName: {
    fontFamily: font.bodySemi,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: '#D1D5DB',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontFamily: font.body,
    fontSize: 12,
    color: '#8E959E',
  },
  priceText: {
    fontFamily: font.bodySemi,
    fontSize: 20,
    color: '#FFFFFF',
    marginTop: 2,
  },
  ctaButton: {
    backgroundColor: '#00D2C4',
    borderRadius: radius.button,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  ctaButtonText: {
    fontFamily: font.bodySemi,
    fontSize: 14.5,
    color: '#000000',
  },
});
