import * as Clipboard from 'expo-clipboard'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors, radius, spacing } from '../../lib/theme'
import type { Product } from '../../lib/types'

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter()
  const thumb = product.images?.[0]
  const [copied, setCopied] = useState(false)

  async function copyName() {
    await Clipboard.setStringAsync(product.name)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => router.push(`/products/${product.id}`)}
      activeOpacity={0.8}
    >
      {thumb ? (
        <Image source={{ uri: thumb }} style={s.image} />
      ) : (
        <View style={[s.image, s.imagePlaceholder]}>
          <Text style={s.imagePlaceholderText}>🛍️</Text>
        </View>
      )}
      <View style={s.info}>
        <Text style={s.name}>{product.name}</Text>
        <Text style={s.category}>{product.category}</Text>
        <View style={s.footer}>
          <Text style={s.price}>€{product.price.toLocaleString()}</Text>
          <Text style={s.stock}>{product.stock} in stock</Text>
        </View>
      </View>
      <TouchableOpacity style={s.copyBtn} onPress={copyName} activeOpacity={0.7} hitSlop={8}>
        <Text style={s.copyBtnText}>{copied ? '✓' : 'copy'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  image: {
    width: 64,
    height: 64,
  },
  imagePlaceholder: {
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: { fontSize: 24 },
  info: { flex: 1, paddingVertical: spacing.sm },
  name: { color: colors.text, fontSize: 14, fontWeight: '600' },
  category: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  price: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  stock: { color: colors.textMuted, fontSize: 11 },
  arrow: { color: colors.textMuted, fontSize: 20, paddingRight: spacing.sm },
})
