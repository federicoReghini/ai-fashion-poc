import { useRouter } from 'expo-router'
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors, radius, spacing } from '../../lib/theme'
import type { ProductVariant } from '../../lib/types'

const CARD_WIDTH = Dimensions.get('window').width * 0.72

function colorHex(name: string): string {
  const map: Record<string, string> = {
    'midnight black': '#1A1A1A', noir: '#1A1A1A', black: '#1A1A1A',
    'midnight blue': '#191970', navy: '#1B3A5C',
    ivory: '#FFFFF0', camel: '#C19A6B', beige: '#F5F0DC',
    burgundy: '#800020', bordeaux: '#800020', rouge: '#CC0000', red: '#CC0000',
    cognac: '#9A4722', tan: '#D2B48C', taupe: '#B09080',
    blush: '#FFB6C1', rose: '#E75480', champagne: '#F7E7CE',
    charcoal: '#36454F', blanc: '#F8F8F8', white: '#F5F5F5',
    nude: '#E8C9A0', caramel: '#C68642',
    'yellow gold': '#FFD700', 'white gold': '#E8E8E8', 'rose gold': '#B76E79',
    'pearl / white gold': '#F0EAD6',
  }
  return map[name.toLowerCase()] ?? colors.surfaceAlt
}

export function ProductVariantCard({ product }: { product: ProductVariant }) {
  const router = useRouter()
  const image = product.images?.[0]

  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => router.push(`/products/${product.id}`)}
      activeOpacity={0.85}
    >
      {/* Full-width image */}
      {image ? (
        <Image source={{ uri: image }} style={s.image} resizeMode="cover" />
      ) : (
        <View style={[s.image, s.imagePlaceholder]}>
          <Text style={s.placeholderIcon}>🛍️</Text>
        </View>
      )}

      {/* Info overlay */}
      <View style={s.info}>
        <View style={s.nameRow}>
          <View style={s.nameBlock}>
            <Text style={s.name} numberOfLines={1}>{product.name}</Text>
            <Text style={s.category}>{product.category}</Text>
          </View>
          <Text style={s.price}>€{product.price.toLocaleString()}</Text>
        </View>

        {/* Color swatches */}
        {product.colors?.length > 0 && (
          <View style={s.swatchRow}>
            {product.colors.map((c) => {
              const selected = c === product.selected_color
              return (
                <View
                  key={c}
                  style={[
                    s.swatch,
                    { backgroundColor: colorHex(c) },
                    selected && s.swatchSelected,
                  ]}
                />
              )
            })}
          </View>
        )}

        {/* Selected variant badge */}
        {(product.selected_color || product.selected_size) && (
          <View style={s.variantBadge}>
            <Text style={s.variantText}>
              {[product.selected_color, product.selected_size].filter(Boolean).join(' · ')}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  image: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.2,
  },
  imagePlaceholder: {
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: { fontSize: 40 },
  info: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  nameBlock: { flex: 1 },
  name: { color: colors.text, fontSize: 14, fontWeight: '700' },
  category: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  price: { color: colors.accent, fontSize: 16, fontWeight: '700', flexShrink: 0 },
  swatchRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: colors.accent,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  variantBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.xl,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accent + '55',
  },
  variantText: { color: colors.accent, fontSize: 11, fontWeight: '600' },
})
