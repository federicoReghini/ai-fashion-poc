package handlers

import (
	"net/http"

	"clienteling-poc/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ProductHandler struct{ db *gorm.DB }

func NewProductHandler(db *gorm.DB) *ProductHandler { return &ProductHandler{db: db} }

func (h *ProductHandler) List(c *gin.Context) {
	query := c.Query("q")
	category := c.Query("category")
	var products []models.Product
	tx := h.db.Order("name")
	if query != "" {
		tx = tx.Where("name ILIKE ? OR description ILIKE ?", "%"+query+"%", "%"+query+"%")
	}
	if category != "" {
		tx = tx.Where("category = ?", category)
	}
	if err := tx.Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, products)
}

func (h *ProductHandler) Get(c *gin.Context) {
	var product models.Product
	if err := h.db.First(&product, "id = ?", c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}
	c.JSON(http.StatusOK, product)
}
