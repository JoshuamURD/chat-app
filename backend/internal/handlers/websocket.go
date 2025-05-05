package handlers

import (
	"log"

	"github.com/joshuam/chat-app/backend/internal/broadcast"
	"github.com/joshuam/chat-app/backend/internal/models"
	"github.com/joshuam/chat-app/backend/internal/websocket"
	"github.com/labstack/echo/v4"
)

type WebSocketHandler struct {
	broadcaster *broadcast.Broadcaster
}

func NewWebSocketHandler(broadcaster *broadcast.Broadcaster) *WebSocketHandler {
	return &WebSocketHandler{
		broadcaster: broadcaster,
	}
}

func (h *WebSocketHandler) HandleWebSocket(c echo.Context) error {
	ws, err := websocket.Upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return err
	}

	client := &models.Client{Conn: ws}
	h.broadcaster.AddClient(client)

	defer func() {
		h.broadcaster.RemoveClient(client)
		ws.Close()
	}()

	for {
		var msg models.Message
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("WebSocket read error: %v", err)
			break
		}

		if msg.Type == "user_info" {
			client.Username = msg.Username
			client.Description = msg.Description
			h.broadcaster.SendMessage(models.Message{
				Username: "System",
				Text:     msg.Username + " has joined the chat!",
			})
			h.broadcaster.BroadcastUserList()
		} else if msg.Type == "update_info" {
			client.Username = msg.Username
			client.Description = msg.Description
			h.broadcaster.BroadcastUserList()
		} else {
			h.broadcaster.SendMessage(msg)
		}
	}
	return nil
}
