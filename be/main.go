package main

import (
	"log"
	"os"

	"clienteling-poc/internal/agent"
	"clienteling-poc/internal/db"
	"clienteling-poc/internal/models"
	"clienteling-poc/router"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	database, err := db.Connect()
	if err != nil {
		log.Fatal("db connect:", err)
	}

	if err := database.AutoMigrate(
		&models.Client{},
		&models.Product{},
		&models.Order{},
		&models.OrderItem{},
	); err != nil {
		log.Fatal("migrate:", err)
	}

	ag := agent.New(database)

	r := router.New(database, ag)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("server listening on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
