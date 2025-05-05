package server

import (
	"net/http"

	"github.com/joshuam/chat-app/backend/internal/broadcast"
	"github.com/joshuam/chat-app/backend/internal/handlers"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type Server struct {
	echo *echo.Echo
}

func New() *Server {
	e := echo.New()

	// Configure CORS
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, "Upgrade", "Connection"},
		AllowCredentials: true,
		ExposeHeaders:    []string{"Upgrade", "Connection"},
	}))

	// Add logging middleware
	e.Use(middleware.Logger())

	return &Server{
		echo: e,
	}
}

func (s *Server) SetupRoutes(broadcaster *broadcast.Broadcaster) {
	wsHandler := handlers.NewWebSocketHandler(broadcaster)

	// Serve static files
	s.echo.Static("/", "frontend/build")

	// WebSocket endpoint
	s.echo.GET("/ws", wsHandler.HandleWebSocket)

	// API endpoint for getting connected clients
	s.echo.GET("/api/v1/chat", func(c echo.Context) error {
		return c.JSON(http.StatusOK, broadcaster.GetUserList())
	})
}

func (s *Server) Start(addr string) error {
	return s.echo.Start(addr)
}
