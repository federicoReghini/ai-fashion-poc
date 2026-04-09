# Clienteling AI POC — Claude Memory

## Project Overview
Luxury fashion clienteling app with AI chat assistant.
- **BE**: Go (Gin, GORM, pgx v5, PostgreSQL) at `/be`
- **FE**: Expo React Native at `/fe`
- **AI**: Anthropic claude-sonnet-4-6 with native tool calling

## Running the Project
```bash
# Start BE (from /be)
go build -o /tmp/clienteling-be . && /tmp/clienteling-be

# Seed DB (from /be/cmd/seed)
go run .

# Kill old server
lsof -ti :8080 | xargs kill -9

# FE
cd fe && npx expo start
```

## Key Config
- `.env` at `/be/.env` — DATABASE_URL, STRIPE_SECRET_KEY, ANTHROPIC_API_KEY, ANTHROPIC_MODEL, PORT=8080
- DB: `postgres://postgres:postgres@localhost:5432/clienteling_poc`
- GORM uses `PreferSimpleProtocol: true` to avoid pgx cached-plan errors after migrations

## API Routes
- `GET/POST /api/clients`, `GET /api/clients/:id`, `GET /api/clients/:id/orders`
- `GET /api/products`, `GET /api/products/:id`
- `GET/POST /api/orders`, `GET /api/orders/:id`
- `POST /api/agent/chat` — body: `{ messages: [{role, content}], app_context: {user_id, current_screen, current_client_id?} }`

## Architecture

### BE Key Files
- `main.go` — startup, AutoMigrate, router init
- `router/router.go` — Gin routes + CORS middleware
- `internal/db/db.go` — GORM+pgx connect, `PreferSimpleProtocol: true`
- `internal/models/` — Client, Product (Images/Colors/Sizes []string with `gorm:"serializer:json"`), Order (PaymentURL), OrderItem (Color, Size)
- `internal/agent/agent.go` — Anthropic loop, system prompt, ChatResponse{Message, Actions, Cards}
- `internal/agent/executor.go` — tool dispatch: searchClients, getClient, getClientOrders, searchProducts, getProductVariant, getProduct, getOrder, createOrder (calls Stripe), navigateTo
- `internal/agent/tools.go` — tool definitions for Anthropic API
- `internal/payment/stripe.go` — stdlib HTTP to Stripe Checkout Sessions API, returns URL
- `cmd/seed/main.go` — wipes + seeds 5 VIP clients, 12 clothing products, 5 orders

### FE Key Files
- `lib/types.ts` — Client, Product, Order, OrderItem, Card (discriminated union), AgentResponse
- `app/(tabs)/chat.tsx` — chat UI, MessageRow renders text + cards + nav confirm buttons
- `app/(tabs)/products.tsx` — category filter chips + product list with thumbnail
- `app/products/[id].tsx` — image gallery, color swatches, size pills
- `app/orders/[id].tsx` — order detail, "Pay now →" button for payment_url
- `components/cards/ChatCard.tsx` — card type dispatcher
- `components/cards/ProductCard.tsx` — copy name button (expo-clipboard)
- `components/cards/ProductVariantCard.tsx` — variant image + swatches
- `components/cards/OrderCard.tsx` — "Pay →" button with Linking.openURL

## Data Model
### Products (12 clothing-only)
Categories: Eveningwear (2), Ready-to-Wear (4), Dresses (2), Outerwear (2), Knitwear (2)
- 3 Unsplash images each: `https://images.unsplash.com/photo-{id}?w=600&h=800&fit=crop&q=80`
- Colors and Sizes (XS-XL) stored as JSON arrays

### Clients (5 VIP)
Isabella Fontaine, Alessandro Conti, Victoria Ashford-Wells, Maximilian von Stern, Camille Beaumont

## Card Types (agent → FE)
`client`, `client_list`, `product`, `product_variant`, `product_list`, `order`, `order_list`

## Stripe Integration
- Called in `executor.go` `createOrder` (NOT in REST orders handler)
- Only generates payment_url when order is created through AI agent chat
- Stores payment_url on the order in DB after creation

## Known Issues / Design Decisions
- `payment_url` only set when order created via agent (not direct REST POST /api/orders) — intentional
- Navigation buttons in chat are confirm-only (user taps to navigate, not auto-navigate)
- Agent always confirms order before calling create_order (strict flow in system prompt)
- System prompt enforces: no markdown, search-before-navigate, full order collection loop

## Theme
Dark luxury: `#0F0F0F` bg, `#C9A84C` gold accent. TanStack Query for data fetching.
