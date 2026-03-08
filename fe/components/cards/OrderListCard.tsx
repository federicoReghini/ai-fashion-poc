import { StyleSheet, Text, View } from 'react-native'
import { colors, spacing } from '../../lib/theme'
import type { Order } from '../../lib/types'
import { OrderCard } from './OrderCard'

export function OrderListCard({ orders }: { orders: Order[] }) {
  return (
    <View style={s.container}>
      <Text style={s.label}>{orders.length} ORDER{orders.length !== 1 ? 'S' : ''}</Text>
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} />
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
