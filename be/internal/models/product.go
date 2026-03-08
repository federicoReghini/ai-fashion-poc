package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Product struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description"`
	Price       float64   `json:"price" gorm:"type:decimal(10,2)"`
	Stock       int       `json:"stock"`
	Category    string    `json:"category"`
	Images      []string  `json:"images" gorm:"serializer:json"`
	Colors      []string  `json:"colors" gorm:"serializer:json"`
	Sizes       []string  `json:"sizes" gorm:"serializer:json"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (p *Product) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	return nil
}
