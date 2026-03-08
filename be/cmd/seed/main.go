package main

import (
	"log"

	"clienteling-poc/internal/db"
	"clienteling-poc/internal/models"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load("../../.env")

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

	// Wipe existing data so re-seeding is idempotent
	database.Exec("DELETE FROM order_items")
	database.Exec("DELETE FROM orders")
	database.Exec("DELETE FROM products")
	database.Exec("DELETE FROM clients")

	// ── Clients — VIP luxury fashion profiles ────────────────────────────────
	clients := []models.Client{
		{
			Name:    "Isabella Fontaine",
			Email:   "i.fontaine@fontainecapital.com",
			Phone:   "+33 6 11 22 33 44",
			Company: "Fontaine Capital",
			Notes:   "CEO & founding partner. Dresses primarily for charity galas and institutional events. Prefers eveningwear, fine jewellery and statement outerwear. VIP since 2019. Annual spend ~€180k. Always ships to Paris 8th.",
		},
		{
			Name:    "Alessandro Conti",
			Email:   "a.conti@contipartners.it",
			Phone:   "+39 02 8765 4321",
			Company: "Conti & Partners Asset Management",
			Notes:   "Managing partner. Purchases extensively as gifts for his spouse and key clients. Focused on handbags, jewellery and ready-to-wear. Highest-spend account. Discretion essential. Annual spend ~€240k.",
		},
		{
			Name:    "Victoria Ashford-Wells",
			Email:   "victoria@ashfordwells.co.uk",
			Phone:   "+44 7700 900123",
			Company: "Ashford-Wells Foundation",
			Notes:   "Philanthropist and art patron. Full wardrobe seasonal renewal twice yearly (SS and AW collections). Strong loyalty to our silk and cashmere lines. Very punctual with payments. Ships London W1.",
		},
		{
			Name:    "Maximilian von Stern",
			Email:   "m.vonstern@vsb-industries.ch",
			Phone:   "+41 44 987 6543",
			Company: "VSB Industries",
			Notes:   "Chairman. Classic palette only — navy, black, ivory, camel. No prints or patterns. Always requires a private in-store appointment with champagne service. White-glove delivery to Zurich. Very private.",
		},
		{
			Name:    "Camille Beaumont",
			Email:   "c.beaumont@vogue.fr",
			Phone:   "+33 1 53 43 60 00",
			Company: "Vogue France",
			Notes:   "Fashion editor. Expects first access to new arrivals before public release. Expert eye — consult her before any display decisions. Complimentary styling sessions required. Strong social media influence.",
		},
	}

	for i := range clients {
		database.Create(&clients[i])
	}
	log.Printf("seeded %d clients", len(clients))

	// ── Products — luxury clothing only, real Unsplash images ───────────────
	clothSizes := []string{"XS", "S", "M", "L", "XL"}

	u := func(id string) string {
		return "https://images.unsplash.com/photo-" + id + "?w=600&h=800&fit=crop&q=80"
	}

	products := []models.Product{
		{
			Name:        "Silk Duchess Evening Gown",
			Description: "Floor-length duchess satin gown with structured bodice, deep V-back and chapel-length train. Hand-finished bespoke lining. Dry clean only.",
			Price:       4800.00, Stock: 4, Category: "Eveningwear",
			Images: []string{u("1539109136881-3be0616acf4b"), u("1515886657613-9f3515b0c78f"), u("1558618666-fcd25c85cd64")},
			Colors: []string{"Midnight Black", "Midnight Blue", "Ivory"},
			Sizes:  clothSizes,
		},
		{
			Name:        "Velvet Evening Suit",
			Description: "Tailored evening suit in crushed velvet with satin peak lapels and side stripe trousers. Includes matching waistcoat. Dry clean only.",
			Price:       3600.00, Stock: 5, Category: "Eveningwear",
			Images: []string{u("1483985988355-763728e1935b"), u("1509631179647-0177331693ae"), u("1469334031218-e382a71b716b")},
			Colors: []string{"Midnight Black", "Bordeaux", "Midnight Blue"},
			Sizes:  clothSizes,
		},
		{
			Name:        "Double-Breasted Wool Blazer",
			Description: "Structured double-breasted blazer in Italian double-faced wool. Peak lapel, horn buttons, single vent. Full canvas construction.",
			Price:       2100.00, Stock: 8, Category: "Ready-to-Wear",
			Images: []string{u("1507003211169-0a1dd7228f2d"), u("1591369822096-fef1ebb827db"), u("1571513722275-4ad0aaae8e81")},
			Colors: []string{"Noir", "Ivory", "Camel"},
			Sizes:  clothSizes,
		},
		{
			Name:        "Boucle Tweed Jacket",
			Description: "Classic boucle tweed jacket with contrast braid trim, gilt buttons and satin lining. Collarless. A wardrobe essential.",
			Price:       2800.00, Stock: 7, Category: "Ready-to-Wear",
			Images: []string{u("1585386959984-a4155224a1ad"), u("1612396175965-4f3b7b5ada57"), u("1434389677669-ebd3b2ead16f")},
			Colors: []string{"Ecru / Black", "Ivory / Gold", "Black / White"},
			Sizes:  clothSizes,
		},
		{
			Name:        "Silk Charmeuse Wrap Blouse",
			Description: "Fluid wrap blouse in 22-momme silk charmeuse. Self-tie at waist, V-neckline, bishop sleeves. Dry clean only.",
			Price:       780.00, Stock: 18, Category: "Ready-to-Wear",
			Images: []string{u("1620799140408-edc6dcb6d633"), u("1562887245-b6a2b63cef49"), u("1490481651871-ab68de25d43d")},
			Colors: []string{"Ivory", "Blush", "Noir"},
			Sizes:  clothSizes,
		},
		{
			Name:        "Wide-Leg Crepe Trousers",
			Description: "High-waisted wide-leg trousers in silk-wool crépe. Invisible zip closure, pressed front crease. Fully lined. Dry clean only.",
			Price:       620.00, Stock: 22, Category: "Ready-to-Wear",
			Images: []string{u("1541099649105-f69ad21f3246"), u("1509631179647-0177331693ae"), u("1566479179817-f46e3e4e6571")},
			Colors: []string{"Noir", "Ivory", "Navy"},
			Sizes:  clothSizes,
		},
		{
			Name:        "Pleated Silk Midi Dress",
			Description: "Bias-cut pleated midi dress in 18-momme silk. Cowl neckline, adjustable straps, invisible side zip. Fully lined.",
			Price:       1650.00, Stock: 9, Category: "Dresses",
			Images: []string{u("1515886657613-9f3515b0c78f"), u("1558618666-fcd25c85cd64"), u("1566479179817-f46e3e4e6571")},
			Colors: []string{"Champagne", "Ivory", "Nude Rose"},
			Sizes:  clothSizes,
		},
		{
			Name:        "Satin Column Dress",
			Description: "Sleek column dress in duchess satin. High neck, long sleeves, floor-length. Concealed back zip. Dry clean only.",
			Price:       2400.00, Stock: 6, Category: "Dresses",
			Images: []string{u("1539109136881-3be0616acf4b"), u("1469334031218-e382a71b716b"), u("1515886657613-9f3515b0c78f")},
			Colors: []string{"Noir", "Ivory", "Cobalt"},
			Sizes:  clothSizes,
		},
		{
			Name:        "Double-Faced Cashmere Overcoat",
			Description: "Oversized overcoat in double-faced Mongolian cashmere. Single-button closure, deep side pockets. Unlined to preserve drape. Dry clean only.",
			Price:       5500.00, Stock: 5, Category: "Outerwear",
			Images: []string{u("1548036328-c9fa89d128fa"), u("1594938298668-9c8ec16b5d8e"), u("1539109136881-3be0616acf4b")},
			Colors: []string{"Camel", "Ivory", "Charcoal"},
			Sizes:  clothSizes,
		},
		{
			Name:        "Belted Trench Coat",
			Description: "Classic double-breasted trench in Egyptian cotton gabardine. Detachable wool lining, storm flap, gun flap. Fully waterproof.",
			Price:       2900.00, Stock: 10, Category: "Outerwear",
			Images: []string{u("1594938298668-9c8ec16b5d8e"), u("1548036328-c9fa89d128fa"), u("1434389677669-ebd3b2ead16f")},
			Colors: []string{"Camel", "Noir", "Stone"},
			Sizes:  clothSizes,
		},
		{
			Name:        "Fine-Gauge Cashmere Turtleneck",
			Description: "Superfine 2-ply Scottish cashmere turtleneck. Ribbed collar, cuffs and hem. Fitted silhouette. Hand wash cold.",
			Price:       1200.00, Stock: 20, Category: "Knitwear",
			Images: []string{u("1520367445093-50dc08a59d9d"), u("1556909172-54557c7e4fb7"), u("1491945751560-86db1bb5b36e")},
			Colors: []string{"Ivory", "Navy", "Caramel", "Midnight Black"},
			Sizes:  clothSizes,
		},
		{
			Name:        "Cable-Knit Cashmere Cardigan",
			Description: "Oversized cable-knit cardigan in 4-ply cashmere. Deep ribbed hem and cuffs, patch pockets, tortoiseshell buttons.",
			Price:       1450.00, Stock: 14, Category: "Knitwear",
			Images: []string{u("1491945751560-86db1bb5b36e"), u("1520367445093-50dc08a59d9d"), u("1556909172-54557c7e4fb7")},
			Colors: []string{"Oatmeal", "Caramel", "Midnight Black"},
			Sizes:  clothSizes,
		},
	}

	for i := range products {
		database.Create(&products[i])
	}
	log.Printf("seeded %d products", len(products))

	// Re-fetch to get DB-assigned IDs
	var dbClients []models.Client
	var dbProducts []models.Product
	database.Find(&dbClients)
	database.Find(&dbProducts)

	byClient := map[string]models.Client{}
	for _, c := range dbClients {
		byClient[c.Name] = c
	}
	byProduct := map[string]models.Product{}
	for _, p := range dbProducts {
		byProduct[p.Name] = p
	}

	// ── Orders ───────────────────────────────────────────────────────────────
	type itemSeed struct {
		product  string
		qty      int
		color    string
		size     string
	}
	type orderSeed struct {
		client string
		notes  string
		status models.OrderStatus
		items  []itemSeed
	}

	orders := []orderSeed{
		{
			client: "Isabella Fontaine",
			status: models.OrderStatusDelivered,
			notes:  "AW24 gala wardrobe — white-glove delivery Paris 8th, signature required.",
			items: []itemSeed{
				{"Silk Duchess Evening Gown", 1, "Midnight Blue", "S"},
				{"Double-Faced Cashmere Overcoat", 1, "Ivory", "S"},
			},
		},
		{
			client: "Alessandro Conti",
			status: models.OrderStatusShipped,
			notes:  "Gift for spouse — anniversary. Discreet packaging, no price tags. Ship to Milan office.",
			items: []itemSeed{
				{"Pleated Silk Midi Dress", 1, "Champagne", "M"},
				{"Fine-Gauge Cashmere Turtleneck", 1, "Ivory", "M"},
				{"Cable-Knit Cashmere Cardigan", 1, "Caramel", "M"},
			},
		},
		{
			client: "Victoria Ashford-Wells",
			status: models.OrderStatusConfirmed,
			notes:  "SS25 wardrobe renewal — full season capsule.",
			items: []itemSeed{
				{"Silk Charmeuse Wrap Blouse", 2, "Ivory", "M"},
				{"Wide-Leg Crepe Trousers", 2, "Ivory", "M"},
				{"Fine-Gauge Cashmere Turtleneck", 1, "Caramel", "M"},
			},
		},
		{
			client: "Maximilian von Stern",
			status: models.OrderStatusPending,
			notes:  "Private appointment confirmed 14 March. Classic palette as always.",
			items: []itemSeed{
				{"Double-Breasted Wool Blazer", 2, "Noir", "L"},
				{"Fine-Gauge Cashmere Turtleneck", 2, "Navy", "L"},
				{"Belted Trench Coat", 1, "Noir", "L"},
			},
		},
		{
			client: "Camille Beaumont",
			status: models.OrderStatusDelivered,
			notes:  "Press preview order — editorial credit required.",
			items: []itemSeed{
				{"Boucle Tweed Jacket", 1, "Ecru / Black", "XS"},
				{"Satin Column Dress", 1, "Ivory", "XS"},
				{"Double-Breasted Wool Blazer", 1, "Ivory", "XS"},
			},
		},
	}

	orderCount := 0
	for _, seed := range orders {
		client, ok := byClient[seed.client]
		if !ok {
			continue
		}

		order := models.Order{
			ClientID: client.ID,
			Status:   seed.status,
			Notes:    seed.notes,
		}

		var total float64
		for _, item := range seed.items {
			p, ok := byProduct[item.product]
			if !ok {
				log.Printf("  product not found: %s", item.product)
				continue
			}
			total += p.Price * float64(item.qty)
			order.Items = append(order.Items, models.OrderItem{
				ProductID: p.ID,
				Quantity:  item.qty,
				UnitPrice: p.Price,
				Color:     item.color,
				Size:      item.size,
			})
		}
		order.TotalAmount = total

		if err := database.Create(&order).Error; err != nil {
			log.Printf("skip order for %s: %v", seed.client, err)
			continue
		}
		orderCount++
	}
	log.Printf("seeded %d orders", orderCount)
	log.Println("done.")
}
