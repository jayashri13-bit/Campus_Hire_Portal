import api from "./axios";

/**
 * Sends a question to the Spring Boot AI Chatbot API endpoint (ai-chat-controller: POST /api/ai/chat).
 * @param {string} question - The user's query text
 * @returns {Promise<string>} The response text from the chatbot backend
 */
export async function sendChatMessage(question) {
  const token = localStorage.getItem("token");
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const response = await api.post("/ai/chat", { question }, config);

  const data = response.data;

  if (typeof data === "string") {
    return data;
  }

  if (data && typeof data === "object") {
    return (
      data.answer ||
      data.response ||
      data.reply ||
      data.message ||
      data.content ||
      JSON.stringify(data)
    );
  }

  return String(data);
}
