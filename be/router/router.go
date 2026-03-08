package router

import (
	"clienteling-poc/internal/agent"
	"clienteling-poc/internal/handlers"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func New(db *gorm.DB, ag *agent.Agent) *gin.Engine {
	r := gin.Default()

	r.Use(corsMiddleware())

	api := r.Group("/api")
	{
		clients := handlers.NewClientHandler(db)
		api.GET("/clients", clients.List)
		api.GET("/clients/:id", clients.Get)
		api.POST("/clients", clients.Create)

		products := handlers.NewProductHandler(db)
		api.GET("/products", products.List)
		api.GET("/products/:id", products.Get)

		orders := handlers.NewOrderHandler(db)
		api.GET("/orders", orders.List)
		api.GET("/orders/:id", orders.Get)
		api.POST("/orders", orders.Create)
		api.GET("/clients/:id/orders", orders.ListByClient)

		agentHandler := handlers.NewAgentHandler(ag)
		api.POST("/agent/chat", agentHandler.Chat)
	}

	return r
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
