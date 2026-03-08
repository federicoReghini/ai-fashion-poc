package agent

import (
	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/packages/param"
)

// allowedCallers lists who may invoke each custom tool.
// "direct" means Claude calls it in a normal tool_use turn.
// "code_execution_20260120" means Claude's Python sandbox may call it
// programmatically, enabling multi-tool scripts without extra model round-trips.
var allowedCallers = []string{"direct", "code_execution_20260120"}

// toolDefinitions returns all tools the agent can call.
// navigate_to is a "virtual" tool — it doesn't hit the DB,
// it just emits a navigation action to the frontend.
func toolDefinitions() []anthropic.ToolUnionParam {
	// The code_execution tool enables programmatic tool calling: Claude can write
	// Python that calls our tools in batch, filtering results before they hit the
	// model context window. This reduces model round-trips for multi-step lookups.
	codeExecTool := anthropic.ToolUnionParam{
		OfCodeExecutionTool20260120: &anthropic.CodeExecutionTool20260120Param{},
	}

	tools := []anthropic.ToolParam{
		{
			Name:           "search_clients",
			Description:    param.NewOpt("Search clients by name, email or company. Use this before get_client when you only have a name."),
			AllowedCallers: allowedCallers,
			InputSchema: anthropic.ToolInputSchemaParam{
				Properties: map[string]any{
					"query": map[string]any{
						"type":        "string",
						"description": "Search term (name, email or company)",
					},
				},
				Required: []string{"query"},
			},
		},
		{
			Name:           "get_client",
			Description:    param.NewOpt("Get full details of a client by their UUID."),
			AllowedCallers: allowedCallers,
			InputSchema: anthropic.ToolInputSchemaParam{
				Properties: map[string]any{
					"id": map[string]any{
						"type":        "string",
						"description": "Client UUID",
					},
				},
				Required: []string{"id"},
			},
		},
		{
			Name:           "get_client_orders",
			Description:    param.NewOpt("Get all orders for a specific client."),
			AllowedCallers: allowedCallers,
			InputSchema: anthropic.ToolInputSchemaParam{
				Properties: map[string]any{
					"client_id": map[string]any{
						"type":        "string",
						"description": "Client UUID",
					},
				},
				Required: []string{"client_id"},
			},
		},
		{
			Name:           "search_products",
			Description:    param.NewOpt("Search products by name, description or category."),
			AllowedCallers: allowedCallers,
			InputSchema: anthropic.ToolInputSchemaParam{
				Properties: map[string]any{
					"query": map[string]any{
						"type":        "string",
						"description": "Search term",
					},
					"category": map[string]any{
						"type":        "string",
						"description": "Optional category filter",
					},
				},
				Required: []string{"query"},
			},
		},
		{
			Name:           "get_product_variant",
			Description:    param.NewOpt("Get a specific product variant (by name + optional color and/or size). Use this when the user asks for a specific variant like 'navy cashmere turtleneck size M'. Returns the product with the requested variant highlighted."),
			AllowedCallers: allowedCallers,
			InputSchema: anthropic.ToolInputSchemaParam{
				Properties: map[string]any{
					"query": map[string]any{
						"type":        "string",
						"description": "Product name search term",
					},
					"color": map[string]any{
						"type":        "string",
						"description": "Requested color (partial match is fine)",
					},
					"size": map[string]any{
						"type":        "string",
						"description": "Requested size",
					},
				},
				Required: []string{"query"},
			},
		},
		{
			Name:           "get_product",
			Description:    param.NewOpt("Get full details of a product by its UUID."),
			AllowedCallers: allowedCallers,
			InputSchema: anthropic.ToolInputSchemaParam{
				Properties: map[string]any{
					"id": map[string]any{
						"type":        "string",
						"description": "Product UUID",
					},
				},
				Required: []string{"id"},
			},
		},
		{
			Name:           "get_order",
			Description:    param.NewOpt("Get full details of an order by its UUID."),
			AllowedCallers: allowedCallers,
			InputSchema: anthropic.ToolInputSchemaParam{
				Properties: map[string]any{
					"id": map[string]any{
						"type":        "string",
						"description": "Order UUID",
					},
				},
				Required: []string{"id"},
			},
		},
		{
			Name: "create_order",
			Description: param.NewOpt(
				"Create a new order for a client. " +
					"IMPORTANT: You MUST collect product_id, quantity, color AND size for every item before calling this. " +
					"Always confirm the full order summary with the user before calling this tool.",
			),
			AllowedCallers: allowedCallers,
			InputSchema: anthropic.ToolInputSchemaParam{
				Properties: map[string]any{
					"client_id": map[string]any{
						"type":        "string",
						"description": "Client UUID",
					},
					"items": map[string]any{
						"type": "array",
						"items": map[string]any{
							"type": "object",
							"properties": map[string]any{
								"product_id": map[string]any{"type": "string", "description": "Product UUID"},
								"quantity":   map[string]any{"type": "integer", "minimum": 1},
								"color":      map[string]any{"type": "string", "description": "Selected color (must be one of the product's available colors)"},
								"size":       map[string]any{"type": "string", "description": "Selected size (must be one of the product's available sizes)"},
							},
							"required": []string{"product_id", "quantity", "color", "size"},
						},
					},
					"notes": map[string]any{
						"type":        "string",
						"description": "Optional notes for the order",
					},
				},
				Required: []string{"client_id", "items"},
			},
		},
		{
			Name: "navigate_to",
			Description: param.NewOpt(
				"Navigate the user to a specific screen in the app. " +
					"Call this after finding a client, product or order to show the user the relevant detail screen. " +
					"Also call it after creating an order to show the new order.",
			),
			AllowedCallers: allowedCallers,
			InputSchema: anthropic.ToolInputSchemaParam{
				Properties: map[string]any{
					"screen": map[string]any{
						"type":        "string",
						"enum":        []string{"ClientList", "ClientDetail", "ProductList", "ProductDetail", "OrderList", "OrderDetail", "NewOrder"},
						"description": "Target screen name",
					},
					"params": map[string]any{
						"type":        "object",
						"description": "Screen params. ClientDetail needs clientId, ProductDetail needs productId, OrderDetail needs orderId.",
					},
				},
				Required: []string{"screen"},
			},
		},
	}

	result := make([]anthropic.ToolUnionParam, 1+len(tools))
	result[0] = codeExecTool
	for i := range tools {
		result[i+1] = anthropic.ToolUnionParam{OfTool: &tools[i]}
	}
	return result
}
