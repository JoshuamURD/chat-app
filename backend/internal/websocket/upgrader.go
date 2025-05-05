package websocket

import (
	"net/http"

	"github.com/gorilla/websocket"
)

// Upgrader is the websocket upgrader configuration
var Upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins for development
		return true
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}
