import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { api } from '../../lib/api'
import { queryKeys } from '../../lib/queryKeys'
import { colors, radius, spacing } from '../../lib/theme'
import type { Client } from '../../lib/types'

export default function ClientsScreen() {
  const router = useRouter()
  const { data: clients, isLoading, error } = useQuery({
    queryKey: queryKeys.clients.list(),
    queryFn: () => api.getClients(),
  })

  if (isLoading) return <View style={s.center}><Text style={s.muted}>Loading clients…</Text></View>
  if (error) return <View style={s.center}><Text style={s.error}>Failed to load clients</Text></View>

  return (
    <FlatList
      data={clients}
      keyExtractor={(c) => c.id}
      contentContainerStyle={s.list}
      renderItem={({ item }) => <ClientRow client={item} onPress={() => router.push(`/clients/${item.id}`)} />}
      ItemSeparatorComponent={() => <View style={s.separator} />}
    />
  )
}

function ClientRow({ client, onPress }: { client: Client; onPress: () => void }) {
  const initials = client.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>{initials}</Text>
      </View>
      <View style={s.info}>
        <Text style={s.name}>{client.name}</Text>
        <Text style={s.sub}>{client.company}</Text>
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
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: colors.accent, fontWeight: '700', fontSize: 14 },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: '600' },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  chevron: { color: colors.textDim, fontSize: 22 },
  muted: { color: colors.textMuted },
  error: { color: colors.error },
})
