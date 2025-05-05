package main

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

// upgrader is the websocket upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins for development
		return true
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// Client is the structure of the client's connection
type Client struct {
	conn        *websocket.Conn
	username    string
	description string
}

// UserInfo is the structure of the client's information
type UserInfo struct {
	Username    string `json:"username"`
	Description string `json:"description"`
}

var clients = make(map[*Client]bool)
var broadcast = make(chan Message)
var mu sync.Mutex

// Message is the structure of the message sent to the server
type Message struct {
	Type        string     `json:"type,omitempty"`
	Username    string     `json:"username"`
	Text        string     `json:"text,omitempty"`
	Description string     `json:"description,omitempty"`
	Users       []UserInfo `json:"users,omitempty"`
}

// broadcastUserList is a function that broadcasts the connected users to all clients
func broadcastUserList() {
	mu.Lock()
	userList := make([]UserInfo, 0, len(clients))
	for client := range clients {
		if client.username != "" { // Only include users who have set their info
			userList = append(userList, UserInfo{
				Username:    client.username,
				Description: client.description,
			})
		}
	}
	mu.Unlock()

	// Broadcast user list update
	broadcast <- Message{
		Type:  "user_list",
		Users: userList,
	}
}

// handleWebSocket is a function that handles the websocket connection
func handleWebSocket(c echo.Context) error {
	ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return err
	}
	client := &Client{conn: ws}

	mu.Lock()
	clients[client] = true
	mu.Unlock()

	defer func() {
		mu.Lock()
		if client.username != "" {
			// Broadcast user leave message before removing the client
			broadcast <- Message{
				Username: "System",
				Text:     client.username + " has left the chat.",
			}
		}
		delete(clients, client)
		mu.Unlock()
		ws.Close()
		broadcastUserList() // Update user list when someone disconnects
	}()

	for {
		var msg Message
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("WebSocket read error: %v", err)
			break
		}

		if msg.Type == "user_info" {
			client.username = msg.Username
			client.description = msg.Description
			// Broadcast user join message
			broadcast <- Message{
				Username: "System",
				Text:     msg.Username + " has joined the chat!",
			}
			broadcastUserList() // Update user list when someone joins
		} else if msg.Type == "update_info" {
			client.username = msg.Username
			client.description = msg.Description
			broadcastUserList() // Update user list when someone updates their info
		} else {
			broadcast <- msg
		}
	}
	return nil
}

func handleMessages() {
	for {
		msg := <-broadcast
		mu.Lock()
		for client := range clients {
			err := client.conn.WriteJSON(msg)
			if err != nil {
				log.Printf("WebSocket write error: %v", err)
			}
		}
		mu.Unlock()
	}
}

func getClients(c echo.Context) error {
	mu.Lock()
	defer mu.Unlock()
	userList := make([]UserInfo, 0, len(clients))
	for client := range clients {
		if client.username != "" {
			userList = append(userList, UserInfo{
				Username:    client.username,
				Description: client.description,
			})
		}
	}
	return c.JSON(http.StatusOK, userList)
}

func main() {
	e := echo.New()

	// Configure CORS
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept},
		AllowCredentials: true,
	}))

	// Add logging middleware
	e.Use(middleware.Logger())

	// Serve static files
	e.Static("/", "frontend/build")

	// WebSocket endpoint
	e.GET("/ws", handleWebSocket)

	// API endpoint for getting connected clients
	e.GET("/api/v1/chat", getClients)

	// Start message handler
	go handleMessages()

	// Start server
	log.Println("Starting server on :8080")
	e.Logger.Fatal(e.Start(":8080"))
}
