package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OrderStatus string

const (
	OrderStatusPending   OrderStatus = "pending"
	OrderStatusConfirmed OrderStatus = "confirmed"
	OrderStatusShipped   OrderStatus = "shipped"
	OrderStatusDelivered OrderStatus = "delivered"
	OrderStatusCancelled OrderStatus = "cancelled"
)

type Order struct {
	ID          string      `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID    string      `json:"client_id" gorm:"type:uuid;not null"`
	Client      *Client     `json:"client,omitempty" gorm:"foreignKey:ClientID"`
	Status      OrderStatus `json:"status" gorm:"default:'pending'"`
	TotalAmount float64     `json:"total_amount" gorm:"type:decimal(10,2)"`
	Notes       string      `json:"notes"`
	PaymentURL  string      `json:"payment_url,omitempty"`
	Items       []OrderItem `json:"items" gorm:"foreignKey:OrderID"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

type OrderItem struct {
	ID        string   `json:"id" gorm:"type:uuid;primaryKey"`
	OrderID   string   `json:"order_id" gorm:"type:uuid;not null"`
	ProductID string   `json:"product_id" gorm:"type:uuid;not null"`
	Product   *Product `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	Quantity  int      `json:"quantity" gorm:"not null"`
	UnitPrice float64  `json:"unit_price" gorm:"type:decimal(10,2)"`
	Color     string   `json:"color"`
	Size      string   `json:"size"`
}

func (o *Order) BeforeCreate(tx *gorm.DB) error {
	if o.ID == "" {
		o.ID = uuid.New().String()
	}
	return nil
}

func (oi *OrderItem) BeforeCreate(tx *gorm.DB) error {
	if oi.ID == "" {
		oi.ID = uuid.New().String()
	}
	return nil
}
