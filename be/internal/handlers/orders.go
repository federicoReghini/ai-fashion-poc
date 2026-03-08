package handlers

import (
	"net/http"

	"clienteling-poc/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type OrderHandler struct{ db *gorm.DB }

func NewOrderHandler(db *gorm.DB) *OrderHandler { return &OrderHandler{db: db} }

func (h *OrderHandler) List(c *gin.Context) {
	var orders []models.Order
	if err := h.db.Preload("Client").Preload("Items.Product").
		Order("created_at desc").Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, orders)
}

func (h *OrderHandler) Get(c *gin.Context) {
	var order models.Order
	if err := h.db.Preload("Client").Preload("Items.Product").
		First(&order, "id = ?", c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}
	c.JSON(http.StatusOK, order)
}

func (h *OrderHandler) ListByClient(c *gin.Context) {
	var orders []models.Order
	if err := h.db.Preload("Items.Product").
		Where("client_id = ?", c.Param("id")).
		Order("created_at desc").Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, orders)
}

type createOrderRequest struct {
	ClientID string `json:"client_id" binding:"required"`
	Notes    string `json:"notes"`
	Items    []struct {
		ProductID string `json:"product_id" binding:"required"`
		Quantity  int    `json:"quantity" binding:"required,min=1"`
	} `json:"items" binding:"required,min=1"`
}

func (h *OrderHandler) Create(c *gin.Context) {
	var req createOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var client models.Client
	if err := h.db.First(&client, "id = ?", req.ClientID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "client not found"})
		return
	}

	order := models.Order{
		ClientID: req.ClientID,
		Status:   models.OrderStatusPending,
		Notes:    req.Notes,
	}

	var total float64
	for _, item := range req.Items {
		var product models.Product
		if err := h.db.First(&product, "id = ?", item.ProductID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "product not found: " + item.ProductID})
			return
		}
		total += product.Price * float64(item.Quantity)
		order.Items = append(order.Items, models.OrderItem{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			UnitPrice: product.Price,
		})
	}
	order.TotalAmount = total

	if err := h.db.Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	h.db.Preload("Client").Preload("Items.Product").First(&order, "id = ?", order.ID)
	c.JSON(http.StatusCreated, order)
}
