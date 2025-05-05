package broadcast

import (
	"log"
	"sync"

	"github.com/joshuam/chat-app/backend/internal/models"
)

type Broadcaster struct {
	clients  map[*models.Client]bool
	messages chan models.Message
	mu       sync.Mutex
}

func New() *Broadcaster {
	return &Broadcaster{
		clients:  make(map[*models.Client]bool),
		messages: make(chan models.Message),
	}
}

func (b *Broadcaster) AddClient(client *models.Client) {
	b.mu.Lock()
	b.clients[client] = true
	b.mu.Unlock()
}

func (b *Broadcaster) RemoveClient(client *models.Client) {
	b.mu.Lock()
	if client.Username != "" {
		// Broadcast user leave message before removing the client
		b.messages <- models.Message{
			Username: "System",
			Text:     client.Username + " has left the chat.",
		}
	}
	delete(b.clients, client)
	b.mu.Unlock()
	b.BroadcastUserList()
}

func (b *Broadcaster) BroadcastUserList() {
	b.mu.Lock()
	userList := make([]models.UserInfo, 0, len(b.clients))
	for client := range b.clients {
		if client.Username != "" {
			userList = append(userList, models.UserInfo{
				Username:    client.Username,
				Description: client.Description,
			})
		}
	}
	b.mu.Unlock()

	b.messages <- models.Message{
		Type:  "user_list",
		Users: userList,
	}
}

func (b *Broadcaster) HandleMessages() {
	for msg := range b.messages {
		b.mu.Lock()
		for client := range b.clients {
			err := client.Conn.WriteJSON(msg)
			if err != nil {
				log.Printf("WebSocket write error: %v", err)
			}
		}
		b.mu.Unlock()
	}
}

func (b *Broadcaster) SendMessage(msg models.Message) {
	b.messages <- msg
}

func (b *Broadcaster) GetUserList() []models.UserInfo {
	b.mu.Lock()
	defer b.mu.Unlock()

	userList := make([]models.UserInfo, 0, len(b.clients))
	for client := range b.clients {
		if client.Username != "" {
			userList = append(userList, models.UserInfo{
				Username:    client.Username,
				Description: client.Description,
			})
		}
	}
	return userList
}
