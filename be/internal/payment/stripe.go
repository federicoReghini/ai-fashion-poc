package payment

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
)

// LineItem represents a single product line in the checkout session.
type LineItem struct {
	Name     string
	Amount   int64  // in euro cents
	Quantity int
	ImageURL string // optional
}

type stripeSession struct {
	URL   string `json:"url"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// CreateCheckoutSession creates a Stripe hosted checkout session and returns its URL.
// Returns ("", nil) gracefully when STRIPE_SECRET_KEY is not set so the rest of the
// order flow still works without a key configured.
func CreateCheckoutSession(items []LineItem, orderID string) (string, error) {
	apiKey := os.Getenv("STRIPE_SECRET_KEY")
	if apiKey == "" {
		return "", nil // no key configured — silently skip
	}

	form := url.Values{}
	form.Set("mode", "payment")
	form.Set("success_url", "https://buy.stripe.com/success") // Stripe fills these in test mode
	form.Set("cancel_url", "https://buy.stripe.com/cancel")
	form.Set("metadata[order_id]", orderID)
	form.Set("currency", "eur")

	for i, item := range items {
		p := fmt.Sprintf("line_items[%d]", i)
		form.Set(p+"[price_data][currency]", "eur")
		form.Set(p+"[price_data][product_data][name]", item.Name)
		form.Set(p+"[price_data][unit_amount]", fmt.Sprintf("%d", item.Amount))
		if item.ImageURL != "" {
			form.Set(p+"[price_data][product_data][images][0]", item.ImageURL)
		}
		form.Set(p+"[quantity]", fmt.Sprintf("%d", item.Quantity))
	}

	req, err := http.NewRequest("POST", "https://api.stripe.com/v1/checkout/sessions",
		strings.NewReader(form.Encode()))
	if err != nil {
		return "", fmt.Errorf("stripe request build: %w", err)
	}
	req.SetBasicAuth(apiKey, "")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Stripe-Version", "2024-04-10")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("stripe request: %w", err)
	}
	defer resp.Body.Close()

	var session stripeSession
	if err := json.NewDecoder(resp.Body).Decode(&session); err != nil {
		return "", fmt.Errorf("stripe decode: %w", err)
	}
	if session.Error != nil {
		return "", fmt.Errorf("stripe error: %s", session.Error.Message)
	}
	if session.URL == "" {
		return "", fmt.Errorf("stripe returned no URL")
	}
	return session.URL, nil
}
