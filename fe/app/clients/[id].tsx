import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { api } from '../../lib/api'
import { queryKeys } from '../../lib/queryKeys'
import { colors, radius, spacing, STATUS_COLORS } from '../../lib/theme'

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()

  const { data: client, isLoading: loadingClient } = useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: () => api.getClient(id),
  })

  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: queryKeys.clients.orders(id),
    queryFn: () => api.getClientOrders(id),
  })

  useEffect(() => {
    if (client) navigation.setOptions({ title: client.name })
  }, [client])

  if (loadingClient) return <View style={s.center}><Text style={s.muted}>Loading…</Text></View>
  if (!client) return <View style={s.center}><Text style={s.error}>Client not found</Text></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Header card */}
      <View style={s.card}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {client.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
          </Text>
        </View>
        <Text style={s.name}>{client.name}</Text>
        <Text style={s.company}>{client.company}</Text>
      </View>

      {/* Details */}
      <View style={s.section}>
        <Row label="Email" value={client.email} />
        <Row label="Phone" value={client.phone} />
        {client.notes ? <Row label="Notes" value={client.notes} /> : null}
      </View>

      {/* Orders */}
      <Text style={s.sectionTitle}>Orders</Text>
      {loadingOrders && <Text style={s.muted}>Loading orders…</Text>}
      {orders?.length === 0 && <Text style={s.muted}>No orders yet.</Text>}
      {orders?.map((order) => (
        <View key={order.id} style={s.orderCard}>
          <View style={s.orderTop}>
            <View style={[s.badge, { backgroundColor: STATUS_COLORS[order.status] + '22', borderColor: STATUS_COLORS[order.status] + '66' }]}>
              <Text style={[s.badgeText, { color: STATUS_COLORS[order.status] }]}>{order.status}</Text>
            </View>
            <Text style={s.amount}>€{order.total_amount.toLocaleString()}</Text>
          </View>
          {order.items?.map((item) => (
            <Text key={item.id} style={s.orderItem}>
              {item.quantity}× {item.product?.name ?? item.product_id} · €{item.unit_price}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentMuted,
    borderWidth: 1.5,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: colors.accent, fontWeight: '700', fontSize: 22 },
  name: { color: colors.text, fontSize: 22, fontWeight: '700' },
  company: { color: colors.textMuted, fontSize: 15 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { color: colors.textMuted, fontSize: 14 },
  value: { color: colors.text, fontSize: 14, fontWeight: '500', flex: 1, textAlign: 'right' },
  sectionTitle: { color: colors.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginTop: spacing.sm },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  amount: { color: colors.accent, fontWeight: '700', fontSize: 16 },
  orderItem: { color: colors.textMuted, fontSize: 13 },
  muted: { color: colors.textMuted },
  error: { color: colors.error },
})
