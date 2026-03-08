import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { api } from '../../lib/api'
import { queryKeys } from '../../lib/queryKeys'
import { colors, radius, spacing } from '../../lib/theme'
import type { Product } from '../../lib/types'

export default function ProductsScreen() {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const { data: products, isLoading, error } = useQuery({
    queryKey: queryKeys.products.list(),
    queryFn: () => api.getProducts(),
  })

  if (isLoading) return <View style={s.center}><Text style={s.muted}>Loading products…</Text></View>
  if (error) return <View style={s.center}><Text style={s.error}>Failed to load products</Text></View>

  const categories = Array.from(new Set(products?.map((p) => p.category) ?? []))
  const filtered = activeCategory
    ? (products ?? []).filter((p) => p.category === activeCategory)
    : (products ?? [])

  return (
    <View style={s.container}>
      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chips}
        style={s.chipsBar}
      >
        <TouchableOpacity
          style={[s.chip, !activeCategory && s.chipActive]}
          onPress={() => setActiveCategory(null)}
          activeOpacity={0.7}
        >
          <Text style={[s.chipText, !activeCategory && s.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.chip, activeCategory === cat && s.chipActive]}
            onPress={() => setActiveCategory(cat)}
            activeOpacity={0.7}
          >
            <Text style={[s.chipText, activeCategory === cat && s.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <ProductRow product={item} onPress={() => router.push(`/products/${item.id}`)} />
        )}
        ItemSeparatorComponent={() => <View style={s.separator} />}
      />
    </View>
  )
}

function ProductRow({ product, onPress }: { product: Product; onPress: () => void }) {
  const thumb = product.images?.[0]
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      {thumb ? (
        <Image source={{ uri: thumb }} style={s.thumb} />
      ) : (
        <View style={[s.thumb, s.thumbPlaceholder]}>
          <Text style={s.thumbPlaceholderText}>{product.category[0]}</Text>
        </View>
      )}
      <View style={s.info}>
        <Text style={s.name}>{product.name}</Text>
        <Text style={s.sub}>{product.category} · {product.stock} in stock</Text>
        {product.colors?.length > 0 && (
          <View style={s.colorDots}>
            {product.colors.slice(0, 5).map((c) => (
              <View key={c} style={[s.colorDot, { backgroundColor: colorHex(c) }]} />
            ))}
          </View>
        )}
      </View>
      <View style={s.priceWrap}>
        <Text style={s.price}>€{product.price.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  )
}

// Very simple color name → hex mapping for the dot indicators
function colorHex(name: string): string {
  const map: Record<string, string> = {
    navy: '#1B3A5C', camel: '#C19A6B', cream: '#FFFDD0', charcoal: '#36454F',
    burgundy: '#800020', ivory: '#FFFFF0', blush: '#FFB6C1', cobalt: '#0047AB',
    black: '#1A1A1A', tan: '#D2B48C', white: '#F5F5F5', sand: '#C2B280',
    oatmeal: '#E8DCC8', floral: '#E75480', check: '#8B7355', taupe: '#B09080',
    cognac: '#9A4722', 'midnight blue': '#191970', 'pale blue': '#ADD8E6',
    stripe: '#888888', red: '#CC0000', emerald: '#50C878',
  }
  return map[name.toLowerCase()] ?? colors.textMuted
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  chipsBar: { borderBottomWidth: 1, borderBottomColor: colors.border, flexGrow: 0 },
  chips: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  chipText: { color: colors.textMuted, fontSize: 13 },
  chipTextActive: { color: colors.accent, fontWeight: '600' },
  list: { padding: spacing.md },
  separator: { height: 1, backgroundColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  thumb: { width: 52, height: 52, borderRadius: radius.sm },
  thumbPlaceholder: { backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  thumbPlaceholderText: { color: colors.textMuted, fontSize: 18 },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: '600' },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  colorDots: { flexDirection: 'row', gap: 4, marginTop: 5 },
  colorDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  priceWrap: { alignItems: 'flex-end' },
  price: { color: colors.accent, fontWeight: '700', fontSize: 15 },
  muted: { color: colors.textMuted },
  error: { color: colors.error },
})
