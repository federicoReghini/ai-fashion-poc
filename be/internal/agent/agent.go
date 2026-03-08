package agent

import (
	"context"
	"fmt"
	"os"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
	"gorm.io/gorm"
)

// AppContext carries the current state of the frontend app into every agent call.
// This lets the agent be aware of what screen the user is on and which client
// is currently being viewed, so it can resolve ambiguous requests.
type AppContext struct {
	UserID          string `json:"user_id"`
	CurrentScreen   string `json:"current_screen"`
	CurrentClientID string `json:"current_client_id,omitempty"`
}

// ChatMessage is the simplified message format exchanged with the frontend.
// The frontend stores the full conversation history and sends it on every turn.
type ChatMessage struct {
	Role    string `json:"role"`    // "user" | "assistant"
	Content string `json:"content"`
}

// ChatResponse is the response returned to the frontend after each agent turn.
type ChatResponse struct {
	Message string   `json:"message"`
	Actions []Action `json:"actions"`
	Cards   []Card   `json:"cards"`
}

// Agent is the main orchestrator. It owns the Anthropic client and executor.
type Agent struct {
	client anthropic.Client
	exec   *executor
	tools  []anthropic.ToolUnionParam
	model  string
}

func New(db *gorm.DB) *Agent {
	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	model := os.Getenv("ANTHROPIC_MODEL")
	if model == "" {
		model = "claude-opus-4-6"
	}

	return &Agent{
		client: anthropic.NewClient(option.WithAPIKey(apiKey)),
		exec:   &executor{db: db},
		tools:  toolDefinitions(),
		model:  model,
	}
}

// Chat runs the full agent loop for a single user turn.
// It receives the full conversation history from the frontend (messages),
// plus the current app context. It loops internally handling tool calls
// until the LLM produces a final text response.
func (a *Agent) Chat(ctx context.Context, messages []ChatMessage, appContext AppContext) (*ChatResponse, error) {
	anthropicMessages := toAnthropicMessages(messages)
	var collectedActions []Action
	var collectedCards []Card

	for {
		resp, err := a.client.Messages.New(ctx, anthropic.MessageNewParams{
			Model:     anthropic.Model(a.model),
			MaxTokens: 4096,
			System: []anthropic.TextBlockParam{
				{Text: buildSystemPrompt(appContext)},
			},
			Tools:    a.tools,
			Messages: anthropicMessages,
		})
		if err != nil {
			return nil, fmt.Errorf("anthropic error: %w", err)
		}

		switch resp.StopReason {

		case anthropic.StopReasonEndTurn:
			return &ChatResponse{
				Message: extractText(resp.Content),
				Actions: collectedActions,
				Cards:   collectedCards,
			}, nil

		case anthropic.StopReasonToolUse, anthropic.StopReasonPauseTurn:
			// resp.ToParam() elegantly converts the full response (including tool_use and
			// server_tool_use blocks) back into a MessageParam so we can append it to the
			// ongoing conversation.
			anthropicMessages = append(anthropicMessages, resp.ToParam())

			// Execute all custom tool calls in this response and collect results.
			// server_tool_use blocks (e.g. code_execution) are handled by Anthropic's
			// infrastructure and don't produce tool_result blocks from our side.
			var toolResults []anthropic.ContentBlockParamUnion
			for _, block := range resp.Content {
				if block.Type != "tool_use" {
					continue
				}

				result, execErr := a.exec.execute(ctx, block.Name, block.Input, &collectedActions, &collectedCards)
				if execErr != nil {
					result = fmt.Sprintf("Tool error: %v", execErr)
				}

				toolResults = append(toolResults, anthropic.NewToolResultBlock(block.ID, result, execErr != nil))
			}

			// Only add a user turn with tool results when we have custom tool results.
			// If the response only contained server_tool_use blocks (e.g. code_execution
			// kicking off), we loop back without a user message so Anthropic can continue
			// the execution and send us the next pause_turn with tool calls.
			if len(toolResults) > 0 {
				anthropicMessages = append(anthropicMessages, anthropic.NewUserMessage(toolResults...))
			}

		default:
			// max_tokens or unexpected stop — return whatever text we have.
			return &ChatResponse{
				Message: extractText(resp.Content),
				Actions: collectedActions,
				Cards:   collectedCards,
			}, nil
		}
	}
}

// buildSystemPrompt constructs the system prompt injecting the current app context.
func buildSystemPrompt(appCtx AppContext) string {
	base := `You are an intelligent assistant embedded in a clienteling application used by sales associates.
Your job is to help them quickly find information and take actions without navigating the app manually.

## What you can do
- Search and retrieve clients, products and orders
- Create new orders on behalf of a client
- Navigate the user to any screen in the app

## Navigation screens available
- ClientList: all clients
- ClientDetail: single client profile (requires clientId param)
- ProductList: all products
- ProductDetail: single product (requires productId param)
- OrderList: all orders
- OrderDetail: single order (requires orderId param)
- NewOrder: the order creation form

## Rules
- NEVER use markdown. No asterisks, no bullet points, no headers. Only plain sentences.
- When the user asks to see, show, list, or browse clients/products/orders, ALWAYS call the search tool first (empty query returns all). Then call navigate_to the matching list screen so the user gets a navigation button.
- When the user mentions a client or product by name, search first to get the UUID, then call get_* to show the detail card, then call navigate_to the detail screen.
- After creating an order, call navigate_to OrderDetail with the new order id.
- Be concise. One or two plain sentences max. Cards show all data — never repeat fields in text.

## Order creation flow (strict)
When the user wants to create an order, you MUST collect ALL of the following before calling create_order. Ask for missing fields conversationally, one message at a time:
1. Client — search by name to get the UUID.
2. Products — search by name to get UUIDs and retrieve each product to see its available colors and sizes.
3. Quantity — for each product.
4. Color — for each product. Show the available options from the product data and wait for the user to pick one.
5. Size — for each product. Show the available options and wait for the user to pick one.
6. Confirmation — summarise the full order (client, each product with color, size, qty, unit price, and grand total) and ask the user to confirm before calling create_order.

If at any point the user sends a message that is clearly unrelated to the current order (e.g. "show me clients", "never mind", "cancel"), abandon the order flow and handle the new request instead.`

	ctx := fmt.Sprintf("\n\n## Current app context\n- User ID: %s\n- Current screen: %s", appCtx.UserID, appCtx.CurrentScreen)
	if appCtx.CurrentClientID != "" {
		ctx += fmt.Sprintf("\n- Currently viewing client ID: %s (use this as default client when the user does not specify one)", appCtx.CurrentClientID)
	}

	return base + ctx
}

// toAnthropicMessages converts the frontend's simplified message format to Anthropic's format.
func toAnthropicMessages(messages []ChatMessage) []anthropic.MessageParam {
	result := make([]anthropic.MessageParam, 0, len(messages))
	for _, m := range messages {
		block := anthropic.NewTextBlock(m.Content)
		if m.Role == "assistant" {
			result = append(result, anthropic.NewAssistantMessage(block))
		} else {
			result = append(result, anthropic.NewUserMessage(block))
		}
	}
	return result
}

// extractText pulls the first text block from a response's content.
func extractText(content []anthropic.ContentBlockUnion) string {
	for _, block := range content {
		if block.Type == "text" {
			return block.Text
		}
	}
	return ""
}
