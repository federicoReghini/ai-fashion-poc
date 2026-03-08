import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect } from 'react'
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { api } from '../../lib/api'
import { queryKeys } from '../../lib/queryKeys'
import { colors, radius, spacing, STATUS_COLORS } from '../../lib/theme'

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()

  const { data: order, isLoading } = useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => api.getOrder(id),
  })

  useEffect(() => {
    if (order) navigation.setOptions({ title: `Order · ${order.status}` })
  }, [order])

  if (isLoading) return <View style={s.center}><Text style={s.muted}>Loading…</Text></View>
  if (!order) return <View style={s.center}><Text style={s.error}>Order not found</Text></View>

  const date = new Date(order.created_at).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Status card */}
      <View style={s.card}>
        <View style={[s.statusBadge, {
          backgroundColor: STATUS_COLORS[order.status] + '22',
          borderColor: STATUS_COLORS[order.status] + '66',
        }]}>
          <Text style={[s.statusText, { color: STATUS_COLORS[order.status] }]}>
            {order.status.toUpperCase()}
          </Text>
        </View>
        <Text style={s.total}>€{order.total_amount.toLocaleString()}</Text>
        <Text style={s.date}>{date}</Text>
        {order.payment_url ? (
          <TouchableOpacity
            style={s.payBtn}
            onPress={() => Linking.openURL(order.payment_url!)}
            activeOpacity={0.8}
          >
            <Text style={s.payBtnText}>Pay now →</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Client */}
      {order.client && (
        <View style={s.section}>
          <View style={s.row}>
            <Text style={s.label}>Client</Text>
            <Text style={s.value}>{order.client.name}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Company</Text>
            <Text style={s.value}>{order.client.company}</Text>
          </View>
        </View>
      )}

      {/* Items */}
      <Text style={s.sectionTitle}>Items</Text>
      <View style={s.section}>
        {order.items?.map((item, i) => (
          <View key={item.id} style={[s.row, i === order.items.length - 1 && s.rowLast]}>
            <View style={s.itemInfo}>
              <Text style={s.itemName}>{item.product?.name ?? item.product_id}</Text>
              <Text style={s.itemSub}>
                  Qty: {item.quantity} · €{item.unit_price}{item.color ? ` · ${item.color}` : ''}{item.size ? ` · ${item.size}` : ''}
                </Text>
            </View>
            <Text style={s.itemTotal}>€{(item.quantity * item.unit_price).toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {order.notes ? (
        <>
          <Text style={s.sectionTitle}>Notes</Text>
          <View style={s.notesCard}>
            <Text style={s.notesText}>{order.notes}</Text>
          </View>
        </>
      ) : null}
    </ScrollView>
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
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  statusText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  total: { color: colors.accent, fontSize: 32, fontWeight: '700' },
  date: { color: colors.textMuted, fontSize: 14 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  label: { color: colors.textMuted, fontSize: 13 },
  value: { color: colors.text, fontSize: 14, fontWeight: '500' },
  itemInfo: { flex: 1 },
  itemName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  itemSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  itemTotal: { color: colors.accent, fontWeight: '700', fontSize: 15 },
  notesCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  notesText: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  payBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.accent,
    marginTop: spacing.xs,
  },
  payBtnText: { color: colors.bg, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  muted: { color: colors.textMuted },
  error: { color: colors.error },
})
