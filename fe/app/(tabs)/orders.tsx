import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { api } from '../../lib/api'
import { queryKeys } from '../../lib/queryKeys'
import { colors, radius, spacing, STATUS_COLORS } from '../../lib/theme'
import type { Order } from '../../lib/types'

export default function OrdersScreen() {
  const router = useRouter()
  const { data: orders, isLoading, error } = useQuery({
    queryKey: queryKeys.orders.list(),
    queryFn: () => api.getOrders(),
  })

  if (isLoading) return <View style={s.center}><Text style={s.muted}>Loading orders…</Text></View>
  if (error) return <View style={s.center}><Text style={s.error}>Failed to load orders</Text></View>

  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={s.list}
      renderItem={({ item }) => <OrderRow order={item} onPress={() => router.push(`/orders/${item.id}`)} />}
      ItemSeparatorComponent={() => <View style={s.separator} />}
    />
  )
}

function OrderRow({ order, onPress }: { order: Order; onPress: () => void }) {
  const date = new Date(order.created_at).toLocaleDateString('it-IT')
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <View style={s.info}>
        <View style={s.topRow}>
          <Text style={s.client}>{order.client?.name ?? 'Unknown'}</Text>
          <Text style={s.amount}>€{order.total_amount.toLocaleString()}</Text>
        </View>
        <View style={s.bottomRow}>
          <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[order.status] + '22', borderColor: STATUS_COLORS[order.status] + '66' }]}>
            <Text style={[s.statusText, { color: STATUS_COLORS[order.status] }]}>{order.status}</Text>
          </View>
          <Text style={s.date}>{date}</Text>
        </View>
      </View>
      <Text style={s.chevron}>›</Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  list: { padding: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  separator: { height: 1, backgroundColor: colors.border },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  info: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
  client: { color: colors.text, fontSize: 16, fontWeight: '600' },
  amount: { color: colors.accent, fontWeight: '700', fontSize: 15 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  date: { color: colors.textMuted, fontSize: 12 },
  chevron: { color: colors.textDim, fontSize: 22 },
  muted: { color: colors.textMuted },
  error: { color: colors.error },
})
