import { StyleSheet, Text, View } from 'react-native'
import { colors, spacing } from '../../lib/theme'
import type { Product } from '../../lib/types'
import { ProductCard } from './ProductCard'

export function ProductListCard({ products }: { products: Product[] }) {
  return (
    <View style={s.container}>
      <Text style={s.label}>{products.length} PRODUCT{products.length !== 1 ? 'S' : ''}</Text>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  container: { gap: spacing.sm },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
})
