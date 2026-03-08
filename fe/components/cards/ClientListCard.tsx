import { StyleSheet, Text, View } from 'react-native'
import { colors, spacing } from '../../lib/theme'
import type { Client } from '../../lib/types'
import { ClientCard } from './ClientCard'

export function ClientListCard({ clients }: { clients: Client[] }) {
  return (
    <View style={s.container}>
      <Text style={s.label}>{clients.length} CLIENT{clients.length !== 1 ? 'S' : ''}</Text>
      {clients.map((c) => (
        <ClientCard key={c.id} client={c} />
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
