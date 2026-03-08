export const queryKeys = {
  clients: {
    all: ['clients'] as const,
    list: (q?: string) => ['clients', 'list', q] as const,
    detail: (id: string) => ['clients', 'detail', id] as const,
    orders: (id: string) => ['clients', id, 'orders'] as const,
  },
  products: {
    all: ['products'] as const,
    list: (q?: string) => ['products', 'list', q] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: () => ['orders', 'list'] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },
}
