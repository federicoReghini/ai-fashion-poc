import type { AgentResponse, AppContext, ChatMessage, Client, Order, Product } from './types'

// On iOS simulator localhost works. On a physical device replace with your machine's LAN IP.
const BASE_URL = 'http://localhost:8080/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json()
}

export const api = {
  // Clients
  getClients: (q?: string) =>
    get<Client[]>(`/clients${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getClient: (id: string) => get<Client>(`/clients/${id}`),
  getClientOrders: (id: string) => get<Order[]>(`/clients/${id}/orders`),

  // Products
  getProducts: (q?: string) =>
    get<Product[]>(`/products${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getProduct: (id: string) => get<Product>(`/products/${id}`),

  // Orders
  getOrders: () => get<Order[]>('/orders'),
  getOrder: (id: string) => get<Order>(`/orders/${id}`),

  // Agent
  chat: async (messages: ChatMessage[], appContext: AppContext): Promise<AgentResponse> => {
    const res = await fetch(`${BASE_URL}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, app_context: appContext }),
    })
    if (!res.ok) throw new Error(`Agent chat failed: ${res.status}`)
    return res.json()
  },
}
