package handlers

import (
	"net/http"

	"clienteling-poc/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ClientHandler struct{ db *gorm.DB }

func NewClientHandler(db *gorm.DB) *ClientHandler { return &ClientHandler{db: db} }

func (h *ClientHandler) List(c *gin.Context) {
	query := c.Query("q")
	var clients []models.Client
	tx := h.db.Order("name")
	if query != "" {
		tx = tx.Where("name ILIKE ? OR email ILIKE ? OR company ILIKE ?",
			"%"+query+"%", "%"+query+"%", "%"+query+"%")
	}
	if err := tx.Find(&clients).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, clients)
}

func (h *ClientHandler) Get(c *gin.Context) {
	var client models.Client
	if err := h.db.Preload("Orders").First(&client, "id = ?", c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "client not found"})
		return
	}
	c.JSON(http.StatusOK, client)
}

func (h *ClientHandler) Create(c *gin.Context) {
	var client models.Client
	if err := c.ShouldBindJSON(&client); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.db.Create(&client).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, client)
}
