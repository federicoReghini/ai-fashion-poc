import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect, useState } from 'react'
import { Dimensions, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { api } from '../../lib/api'
import { queryKeys } from '../../lib/queryKeys'
import { colors, radius, spacing } from '../../lib/theme'

const SCREEN_WIDTH = Dimensions.get('window').width

// Simple color name → hex mapping
function colorHex(name: string): string {
  const map: Record<string, string> = {
    navy: '#1B3A5C', camel: '#C19A6B', cream: '#FFFDD0', charcoal: '#36454F',
    burgundy: '#800020', ivory: '#FFFFF0', blush: '#FFB6C1', cobalt: '#0047AB',
    black: '#1A1A1A', tan: '#D2B48C', white: '#F5F5F5', sand: '#C2B280',
    oatmeal: '#E8DCC8', floral: '#E75480', check: '#8B7355', taupe: '#B09080',
    cognac: '#9A4722', 'midnight blue': '#191970', 'pale blue': '#ADD8E6',
    stripe: '#888888', red: '#CC0000', emerald: '#50C878',
  }
  return map[name.toLowerCase()] ?? colors.surfaceAlt
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)

  const { data: product, isLoading } = useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => api.getProduct(id),
  })

  useEffect(() => {
    if (product) {
      navigation.setOptions({ title: product.name })
      if (product.colors?.length) setSelectedColor(product.colors[0])
      if (product.sizes?.length) setSelectedSize(product.sizes[0])
    }
  }, [product])

  if (isLoading) return <View style={s.center}><Text style={s.muted}>Loading…</Text></View>
  if (!product) return <View style={s.center}><Text style={s.error}>Product not found</Text></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Image gallery */}
      {product.images?.length > 0 && (
        <FlatList
          data={product.images}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={s.gallery}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={s.galleryImage} resizeMode="cover" />
          )}
        />
      )}

      {/* Price + name */}
      <View style={s.priceCard}>
        <Text style={s.productName}>{product.name}</Text>
        <Text style={s.price}>€{product.price.toLocaleString()}</Text>
        <View style={s.categoryBadge}>
          <Text style={s.categoryText}>{product.category}</Text>
        </View>
      </View>

      {/* Color selector */}
      {product.colors?.length > 0 && (
        <View style={s.selectorBlock}>
          <Text style={s.selectorLabel}>
            COLOR <Text style={s.selectorValue}>{selectedColor}</Text>
          </Text>
          <View style={s.swatchRow}>
            {product.colors.map((c) => {
              const isSelected = selectedColor === c
              const hex = colorHex(c)
              return (
                <TouchableOpacity
                  key={c}
                  style={[s.swatch, { backgroundColor: hex }, isSelected && s.swatchSelected]}
                  onPress={() => setSelectedColor(c)}
                  activeOpacity={0.8}
                >
                  {isSelected && <View style={s.swatchCheck} />}
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      )}

      {/* Size selector */}
      {product.sizes?.length > 0 && (
        <View style={s.selectorBlock}>
          <Text style={s.selectorLabel}>SIZE</Text>
          <View style={s.sizeRow}>
            {product.sizes.map((sz) => {
              const isSelected = selectedSize === sz
              return (
                <TouchableOpacity
                  key={sz}
                  style={[s.sizePill, isSelected && s.sizePillSelected]}
                  onPress={() => setSelectedSize(sz)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.sizePillText, isSelected && s.sizePillTextSelected]}>{sz}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      )}

      {/* Details */}
      <View style={s.section}>
        <Row label="Description" value={product.description} />
        <Row label="Stock" value={`${product.stock} units available`} last />
      </View>
    </ScrollView>
  )
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.row, last && s.rowLast]}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },

  gallery: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.1 },
  galleryImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.1 },

  priceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  productName: { color: colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  price: { color: colors.accent, fontSize: 28, fontWeight: '700' },
  categoryBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.xl,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accent + '44',
  },
  categoryText: { color: colors.accent, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },

  selectorBlock: {
    marginHorizontal: spacing.md,
    gap: spacing.sm,
  },
  selectorLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  selectorValue: { color: colors.text, fontWeight: '500', letterSpacing: 0 },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchSelected: { borderColor: colors.accent },
  swatchCheck: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },

  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sizePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    minWidth: 48,
    alignItems: 'center',
  },
  sizePillSelected: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  sizePillText: { color: colors.textMuted, fontSize: 14, fontWeight: '500' },
  sizePillTextSelected: { color: colors.accent, fontWeight: '700' },

  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginHorizontal: spacing.md,
  },
  row: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  rowLast: { borderBottomWidth: 0 },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { color: colors.text, fontSize: 15 },
  muted: { color: colors.textMuted },
  error: { color: colors.error },
})
