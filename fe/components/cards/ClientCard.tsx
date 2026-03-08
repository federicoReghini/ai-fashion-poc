import { useRouter } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors, radius, spacing } from '../../lib/theme'
import type { Client } from '../../lib/types'

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function ClientCard({ client }: { client: Client }) {
  const router = useRouter()
  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => router.push(`/clients/${client.id}`)}
      activeOpacity={0.8}
    >
      <View style={s.avatar}>
        <Text style={s.avatarText}>{initials(client.name)}</Text>
      </View>
      <View style={s.info}>
        <Text style={s.name}>{client.name}</Text>
        <Text style={s.sub}>{client.company}</Text>
        <Text style={s.sub}>{client.email}</Text>
      </View>
      <Text style={s.arrow}>›</Text>
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: 14, fontWeight: '600' },
  sub: { color: colors.textMuted, fontSize: 12 },
  arrow: { color: colors.textMuted, fontSize: 20 },
})
