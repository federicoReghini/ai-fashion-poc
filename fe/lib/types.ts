export interface Client {
  id: string
  name: string
  email: string
  phone: string
  company: string
  notes: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category: string
  images: string[]
  colors: string[]
  sizes: string[]
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product?: Product
  quantity: number
  unit_price: number
  color?: string
  size?: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface Order {
  id: string
  client_id: string
  client?: Client
  status: OrderStatus
  total_amount: number
  notes: string
  payment_url?: string
  items: OrderItem[]
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AppContext {
  user_id: string
  current_screen: string
  current_client_id?: string
}

export interface AgentAction {
  type: 'navigate'
  screen: string
  params?: Record<string, string>
}

export interface ProductVariant extends Product {
  selected_color?: string
  selected_size?: string
}

export type Card =
  | { type: 'client'; data: Client }
  | { type: 'client_list'; data: Client[] }
  | { type: 'product'; data: Product }
  | { type: 'product_variant'; data: ProductVariant }
  | { type: 'product_list'; data: Product[] }
  | { type: 'order'; data: Order }
  | { type: 'order_list'; data: Order[] }

export interface AgentResponse {
  message: string
  actions: AgentAction[] | null
  cards: Card[] | null
}
