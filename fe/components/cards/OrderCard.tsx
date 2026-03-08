import { useRouter } from 'expo-router'
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors, radius, spacing, STATUS_COLORS } from '../../lib/theme'
import type { Order } from '../../lib/types'

export function OrderCard({ order }: { order: Order }) {
  const router = useRouter()
  const color = STATUS_COLORS[order.status] ?? colors.textMuted
  const date = new Date(order.created_at).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => router.push(`/orders/${order.id}`)}
      activeOpacity={0.8}
    >
      <View style={s.left}>
        <View style={[s.badge, { backgroundColor: color + '22', borderColor: color + '66' }]}>
          <Text style={[s.badgeText, { color }]}>{order.status.toUpperCase()}</Text>
        </View>
        {order.client && (
          <Text style={s.client}>{order.client.name}</Text>
        )}
        <Text style={s.date}>{date}</Text>
      </View>
      <View style={s.right}>
        <Text style={s.amount}>€{order.total_amount.toLocaleString()}</Text>
        <Text style={s.items}>{order.items?.length ?? 0} items</Text>
      </View>
      <Text style={s.arrow}>›</Text>
      {order.payment_url ? (
        <TouchableOpacity
          style={s.payBtn}
          onPress={() => Linking.openURL(order.payment_url!)}
          activeOpacity={0.8}
        >
          <Text style={s.payBtnText}>Pay →</Text>
        </TouchableOpacity>
      ) : null}
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
    padding: spacing.sm + 4,
  },
  left: { flex: 1, gap: 3 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  client: { color: colors.text, fontSize: 14, fontWeight: '600' },
  date: { color: colors.textMuted, fontSize: 12 },
  right: { alignItems: 'flex-end', gap: 3 },
  amount: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  items: { color: colors.textMuted, fontSize: 12 },
  arrow: { color: colors.textMuted, fontSize: 20 },
  payBtn: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.xl,
    backgroundColor: colors.accent,
  },
  payBtnText: { color: colors.bg, fontSize: 12, fontWeight: '700' },
})
