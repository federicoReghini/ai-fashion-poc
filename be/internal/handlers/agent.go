package handlers

import (
	"net/http"

	"clienteling-poc/internal/agent"

	"github.com/gin-gonic/gin"
)

type AgentHandler struct{ ag *agent.Agent }

func NewAgentHandler(ag *agent.Agent) *AgentHandler { return &AgentHandler{ag: ag} }

type chatRequest struct {
	// Full conversation history. The frontend owns this and sends it every turn.
	Messages []agent.ChatMessage `json:"messages" binding:"required,min=1"`
	// Current state of the frontend app — injected into the system prompt.
	AppContext agent.AppContext `json:"app_context"`
}

func (h *AgentHandler) Chat(c *gin.Context) {
	var req chatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.ag.Chat(c.Request.Context(), req.Messages, req.AppContext)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}
