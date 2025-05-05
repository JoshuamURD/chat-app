package models

import "github.com/gorilla/websocket"

// Client represents a connected client with their WebSocket connection and user information
type Client struct {
	Conn        *websocket.Conn
	Username    string
	Description string
}

// UserInfo represents the public information about a user
type UserInfo struct {
	Username    string `json:"username"`
	Description string `json:"description"`
}

// Message represents a message sent through the chat system
type Message struct {
	Type        string     `json:"type,omitempty"`
	Username    string     `json:"username"`
	Text        string     `json:"text,omitempty"`
	Description string     `json:"description,omitempty"`
	Users       []UserInfo `json:"users,omitempty"`
}
