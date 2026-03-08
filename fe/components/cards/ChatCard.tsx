import type { Card } from '../../lib/types'
import { ClientCard } from './ClientCard'
import { ClientListCard } from './ClientListCard'
import { OrderCard } from './OrderCard'
import { OrderListCard } from './OrderListCard'
import { ProductCard } from './ProductCard'
import { ProductListCard } from './ProductListCard'
import { ProductVariantCard } from './ProductVariantCard'

export function ChatCard({ card }: { card: Card }) {
  switch (card.type) {
    case 'client':
      return <ClientCard client={card.data} />
    case 'client_list':
      return <ClientListCard clients={card.data} />
    case 'product':
      return <ProductCard product={card.data} />
    case 'product_variant':
      return <ProductVariantCard product={card.data} />
    case 'product_list':
      return <ProductListCard products={card.data} />
    case 'order':
      return <OrderCard order={card.data} />
    case 'order_list':
      return <OrderListCard orders={card.data} />
  }
}
