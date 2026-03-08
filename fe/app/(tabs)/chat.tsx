import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChatCard } from '../../components/cards/ChatCard'
import { api } from '../../lib/api'
import { colors, radius, spacing } from '../../lib/theme'
import type { AgentAction, Card, ChatMessage } from '../../lib/types'

// Maps agent screen names → Expo Router paths
function resolveAction(action: AgentAction, router: ReturnType<typeof useRouter>) {
  const p = action.params ?? {}
  switch (action.screen) {
    case 'ClientList':    return router.push('/')
    case 'ClientDetail':  return router.push(`/clients/${p.clientId}`)
    case 'ProductList':   return router.push('/products')
    case 'ProductDetail': return router.push(`/products/${p.productId}`)
    case 'OrderList':     return router.push('/orders')
    case 'OrderDetail':   return router.push(`/orders/${p.orderId}`)
    case 'NewOrder':      return router.push('/orders')
  }
}

function screenLabel(action: AgentAction) {
  const p = action.params ?? {}
  switch (action.screen) {
    case 'ClientList':    return 'View all clients'
    case 'ClientDetail':  return `Open client profile`
    case 'ProductList':   return 'View all products'
    case 'ProductDetail': return 'Open product'
    case 'OrderList':     return 'View all orders'
    case 'OrderDetail':   return 'Open order'
    case 'NewOrder':      return 'Create new order'
    default:              return `Go to ${action.screen}`
  }
}

interface UIMessage extends ChatMessage {
  id: string
  actions?: AgentAction[]
  cards?: Card[]
}

let msgId = 0
function nextId() { return String(++msgId) }

const SUGGESTIONS = [
  'Show me all clients',
  'Find Marco Rossi',
  'What products do we have?',
  'Show me pending orders',
]

export default function ChatScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Hi! I can help you find clients, products and orders, or create new orders. What would you like to do?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<FlatList>(null)

  async function send(text: string) {
    const userText = text.trim()
    if (!userText || loading) return

    const userMsg: UIMessage = { id: nextId(), role: 'user', content: userText }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const resp = await api.chat(
        nextMessages.map(({ role, content }) => ({ role, content })),
        { user_id: 'user_1', current_screen: 'Chat' },
      )

      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'assistant',
          content: resp.message,
          actions: resp.actions ?? [],
          cards: resp.cards ?? [],
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', content: 'Something went wrong. Please try again.' },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={[s.list, { paddingBottom: spacing.lg }]}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item, index }) => (
          <MessageRow
            message={item}
            isLast={index === messages.length - 1}
            onNavigate={(action) => resolveAction(action, router)}
          />
        )}
        ListFooterComponent={loading ? <TypingIndicator /> : null}
        ListHeaderComponent={
          messages.length === 1 ? (
            <View style={s.suggestions}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity key={s} style={st.chip} onPress={() => send(s)} activeOpacity={0.7}>
                  <Text style={st.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null
        }
      />

      <View style={[s.inputRow, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask anything…"
          placeholderTextColor={colors.textDim}
          multiline
          maxLength={500}
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
          onPress={() => send(input)}
          disabled={!input.trim() || loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator size="small" color={colors.bg} />
            : <Text style={s.sendIcon}>↑</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

function MessageRow({
  message,
  isLast,
  onNavigate,
}: {
  message: UIMessage
  isLast: boolean
  onNavigate: (action: AgentAction) => void
}) {
  const isUser = message.role === 'user'
  return (
    <View style={[s.messageRow, isUser ? s.messageRowRight : s.messageRowLeft]}>
      {!isUser && (
        <View style={s.agentDot}>
          <Text style={s.agentDotText}>✦</Text>
        </View>
      )}

      <View style={s.messageContent}>
        {/* Text bubble */}
        <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAssistant]}>
          <Text style={[s.bubbleText, isUser ? s.bubbleTextUser : s.bubbleTextAssistant]}>
            {message.content}
          </Text>
        </View>

        {/* Rich cards */}
        {!isUser && message.cards && message.cards.length > 0 && (
          <View style={s.cardsWrap}>
            {message.cards.map((card, i) => (
              <ChatCard key={i} card={card} />
            ))}
          </View>
        )}

        {/* Navigation confirm buttons */}
        {!isUser && message.actions && message.actions.length > 0 && (
          <View style={s.actionsWrap}>
            {message.actions.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={s.navBtn}
                onPress={() => onNavigate(action)}
                activeOpacity={0.8}
              >
                <Text style={s.navBtnText}>{screenLabel(action)} →</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

function TypingIndicator() {
  return (
    <View style={[s.messageRowLeft, s.messageRow]}>
      <View style={s.agentDot}>
        <Text style={s.agentDotText}>✦</Text>
      </View>
      <View style={s.messageContent}>
        <View style={[s.bubble, s.bubbleAssistant, s.typingBubble]}>
          <Text style={s.typingDots}>• • •</Text>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md, gap: spacing.sm },
  suggestions: { gap: spacing.sm, marginBottom: spacing.lg },

  messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginVertical: 2 },
  messageRowLeft: { justifyContent: 'flex-start' },
  messageRowRight: { justifyContent: 'flex-end' },

  messageContent: { flex: 1, gap: spacing.sm, maxWidth: '85%' },

  agentDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    flexShrink: 0,
  },
  agentDotText: { color: colors.accent, fontSize: 11 },

  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    alignSelf: 'flex-start',
  },
  bubbleUser: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  bubbleAssistant: {
    backgroundColor: colors.surfaceAlt,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: colors.bg, fontWeight: '500' },
  bubbleTextAssistant: { color: colors.text },

  typingBubble: { paddingVertical: spacing.sm },
  typingDots: { color: colors.textMuted, fontSize: 18, letterSpacing: 4 },

  cardsWrap: { gap: spacing.sm },

  actionsWrap: { gap: spacing.xs },
  navBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
    alignSelf: 'flex-start',
  },
  navBtnText: { color: colors.accent, fontSize: 13, fontWeight: '600' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { color: colors.bg, fontSize: 20, fontWeight: '700' },
})

const st = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignSelf: 'flex-start',
  },
  chipText: { color: colors.textMuted, fontSize: 13 },
})
