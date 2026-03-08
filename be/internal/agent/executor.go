package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"clienteling-poc/internal/models"
	"clienteling-poc/internal/payment"

	"gorm.io/gorm"
)

// ProductVariantPayload wraps a product with the selected variant highlighted.
type ProductVariantPayload struct {
	models.Product
	SelectedColor string `json:"selected_color,omitempty"`
	SelectedSize  string `json:"selected_size,omitempty"`
}

// Action is the frontend-facing command emitted when navigate_to is called.
type Action struct {
	Type   string         `json:"type"`
	Screen string         `json:"screen,omitempty"`
	Params map[string]any `json:"params,omitempty"`
}

// Card carries structured data to be rendered as rich UI in the frontend chat.
type Card struct {
	Type string          `json:"type"` // "client" | "client_list" | "product" | "product_list" | "order" | "order_list"
	Data json.RawMessage `json:"data"`
}

type executor struct {
	db *gorm.DB
}

// execute runs a tool call and returns (result string for LLM, error).
// Side effects: appends to actions and cards slices.
func (e *executor) execute(ctx context.Context, name string, rawInput json.RawMessage, actions *[]Action, cards *[]Card) (string, error) {
	var input map[string]any
	if err := json.Unmarshal(rawInput, &input); err != nil {
		return "", fmt.Errorf("invalid tool input: %w", err)
	}

	switch name {
	case "search_clients":
		return e.searchClients(input, cards)
	case "get_client":
		return e.getClient(input, cards)
	case "get_client_orders":
		return e.getClientOrders(input, cards)
	case "search_products":
		return e.searchProducts(input, cards)
	case "get_product_variant":
		return e.getProductVariant(input, cards)
	case "get_product":
		return e.getProduct(input, cards)
	case "get_order":
		return e.getOrder(input, cards)
	case "create_order":
		return e.createOrder(input, cards)
	case "navigate_to":
		return e.navigateTo(input, actions)
	default:
		return "", fmt.Errorf("unknown tool: %s", name)
	}
}

func (e *executor) searchClients(input map[string]any, cards *[]Card) (string, error) {
	query, _ := input["query"].(string)
	var clients []models.Client
	err := e.db.
		Where("name ILIKE ? OR email ILIKE ? OR company ILIKE ?",
			"%"+query+"%", "%"+query+"%", "%"+query+"%").
		Limit(10).Find(&clients).Error
	if err != nil {
		return "", err
	}
	if len(clients) == 0 {
		return fmt.Sprintf("No clients found matching '%s'.", query), nil
	}
	out, _ := json.Marshal(clients)
	appendCard(cards, "client_list", out)
	return string(out), nil
}

func (e *executor) getClient(input map[string]any, cards *[]Card) (string, error) {
	id, _ := input["id"].(string)
	var client models.Client
	if err := e.db.First(&client, "id = ?", id).Error; err != nil {
		return fmt.Sprintf("Client with id '%s' not found.", id), nil
	}
	out, _ := json.Marshal(client)
	appendCard(cards, "client", out)
	return string(out), nil
}

func (e *executor) getClientOrders(input map[string]any, cards *[]Card) (string, error) {
	clientID, _ := input["client_id"].(string)
	var orders []models.Order
	err := e.db.
		Preload("Items.Product").
		Where("client_id = ?", clientID).
		Order("created_at desc").
		Find(&orders).Error
	if err != nil {
		return "", err
	}
	if len(orders) == 0 {
		return "No orders found for this client.", nil
	}
	out, _ := json.Marshal(orders)
	appendCard(cards, "order_list", out)
	return string(out), nil
}

func (e *executor) searchProducts(input map[string]any, cards *[]Card) (string, error) {
	query, _ := input["query"].(string)
	category, _ := input["category"].(string)

	tx := e.db.Model(&models.Product{})
	if query != "" {
		tx = tx.Where("name ILIKE ? OR description ILIKE ?", "%"+query+"%", "%"+query+"%")
	}
	if category != "" {
		tx = tx.Where("category = ?", category)
	}

	var products []models.Product
	if err := tx.Limit(20).Find(&products).Error; err != nil {
		return "", err
	}
	if len(products) == 0 {
		return fmt.Sprintf("No products found matching '%s'.", query), nil
	}
	out, _ := json.Marshal(products)
	appendCard(cards, "product_list", out)
	return string(out), nil
}

func (e *executor) getProduct(input map[string]any, cards *[]Card) (string, error) {
	id, _ := input["id"].(string)
	var product models.Product
	if err := e.db.First(&product, "id = ?", id).Error; err != nil {
		return fmt.Sprintf("Product with id '%s' not found.", id), nil
	}
	out, _ := json.Marshal(product)
	appendCard(cards, "product", out)
	return string(out), nil
}

func (e *executor) getProductVariant(input map[string]any, cards *[]Card) (string, error) {
	query, _ := input["query"].(string)
	color, _ := input["color"].(string)
	size, _ := input["size"].(string)

	var products []models.Product
	err := e.db.
		Where("name ILIKE ? OR description ILIKE ?", "%"+query+"%", "%"+query+"%").
		Limit(1).Find(&products).Error
	if err != nil || len(products) == 0 {
		return fmt.Sprintf("No product found matching '%s'.", query), nil
	}
	p := products[0]

	// Resolve best matching color/size from available options
	resolvedColor := resolveVariantOption(p.Colors, color)
	resolvedSize := resolveVariantOption(p.Sizes, size)

	payload := ProductVariantPayload{
		Product:       p,
		SelectedColor: resolvedColor,
		SelectedSize:  resolvedSize,
	}
	out, _ := json.Marshal(payload)
	appendCard(cards, "product_variant", out)
	return string(out), nil
}

// resolveVariantOption case-insensitively finds the best matching option.
func resolveVariantOption(options []string, requested string) string {
	if requested == "" || len(options) == 0 {
		if len(options) > 0 {
			return options[0]
		}
		return ""
	}
	req := strings.ToLower(requested)
	for _, opt := range options {
		if strings.Contains(strings.ToLower(opt), req) {
			return opt
		}
	}
	return options[0] // fallback to first option
}

func (e *executor) getOrder(input map[string]any, cards *[]Card) (string, error) {
	id, _ := input["id"].(string)
	var order models.Order
	if err := e.db.Preload("Client").Preload("Items.Product").First(&order, "id = ?", id).Error; err != nil {
		return fmt.Sprintf("Order with id '%s' not found.", id), nil
	}
	out, _ := json.Marshal(order)
	appendCard(cards, "order", out)
	return string(out), nil
}

func (e *executor) createOrder(input map[string]any, cards *[]Card) (string, error) {
	clientID, _ := input["client_id"].(string)
	notes, _ := input["notes"].(string)

	var client models.Client
	if err := e.db.First(&client, "id = ?", clientID).Error; err != nil {
		return fmt.Sprintf("Client '%s' not found.", clientID), nil
	}

	rawItems, _ := input["items"].([]any)
	if len(rawItems) == 0 {
		return "No items provided for the order.", nil
	}

	order := models.Order{
		ClientID: clientID,
		Status:   models.OrderStatusPending,
		Notes:    notes,
	}

	var total float64
	for _, rawItem := range rawItems {
		item, ok := rawItem.(map[string]any)
		if !ok {
			continue
		}
		productID, _ := item["product_id"].(string)
		color, _ := item["color"].(string)
		size, _ := item["size"].(string)
		quantity := 1
		if q, ok := item["quantity"].(float64); ok {
			quantity = int(q)
		}

		var product models.Product
		if err := e.db.First(&product, "id = ?", productID).Error; err != nil {
			return fmt.Sprintf("Product '%s' not found.", productID), nil
		}
		if product.Stock < quantity {
			return fmt.Sprintf("Insufficient stock for '%s' (requested %d, available %d).", product.Name, quantity, product.Stock), nil
		}

		total += product.Price * float64(quantity)
		order.Items = append(order.Items, models.OrderItem{
			ProductID: productID,
			Quantity:  quantity,
			UnitPrice: product.Price,
			Color:     color,
			Size:      size,
		})
	}
	order.TotalAmount = total

	if err := e.db.Create(&order).Error; err != nil {
		return "", fmt.Errorf("failed to create order: %w", err)
	}

	// Build Stripe line items and create checkout session
	var lineItems []payment.LineItem
	for _, oi := range order.Items {
		var p models.Product
		if e.db.First(&p, "id = ?", oi.ProductID).Error == nil {
			name := p.Name
			if oi.Color != "" {
				name += " — " + oi.Color
			}
			if oi.Size != "" {
				name += " / " + oi.Size
			}
			img := ""
			if len(p.Images) > 0 {
				img = p.Images[0]
			}
			lineItems = append(lineItems, payment.LineItem{
				Name:     name,
				Amount:   int64(p.Price * 100),
				Quantity: oi.Quantity,
				ImageURL: img,
			})
		}
	}
	if payURL, payErr := payment.CreateCheckoutSession(lineItems, order.ID); payErr != nil {
		fmt.Printf("stripe error: %v\n", payErr)
	} else if payURL != "" {
		e.db.Model(&order).Update("payment_url", payURL)
		order.PaymentURL = payURL
	}

	// Reload with full associations
	e.db.Preload("Client").Preload("Items.Product").First(&order, "id = ?", order.ID)

	out, _ := json.Marshal(order)
	appendCard(cards, "order", out)
	return string(out), nil
}

func appendCard(cards *[]Card, cardType string, data json.RawMessage) {
	if cards == nil {
		return
	}
	*cards = append(*cards, Card{Type: cardType, Data: data})
}

func (e *executor) navigateTo(input map[string]any, actions *[]Action) (string, error) {
	screen, _ := input["screen"].(string)
	params, _ := input["params"].(map[string]any)

	*actions = append(*actions, Action{
		Type:   "navigate",
		Screen: screen,
		Params: params,
	})

	return fmt.Sprintf("Navigating to %s.", screen), nil
}
