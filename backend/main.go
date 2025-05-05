package main

import (
	"log"

	"github.com/joshuam/chat-app/backend/internal/broadcast"
	"github.com/joshuam/chat-app/backend/internal/server"
)

func main() {
	// Create broadcaster
	broadcaster := broadcast.New()
	go broadcaster.HandleMessages()

	// Create and setup server
	srv := server.New()
	srv.SetupRoutes(broadcaster)

	// Start server
	log.Println("Starting server on :8080")
	if err := srv.Start(":8080"); err != nil {
		log.Fatal(err)
	}
}
