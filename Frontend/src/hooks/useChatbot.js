// src/hooks/useChatbot.js

import { useState, useCallback, useEffect } from "react";
import { sendChatMessage } from "../api/chatApi";

const STORAGE_KEY = "placement_assistant_chat_history";

export const CHAT_TRANSLATIONS = {
  title: "Placement Assistant",
  online: "Online",
  typing: "Typing…",
  placeholder: "Ask about placements...",
  clearTitle: "Clear conversation",
  retry: "🔄 Retry",
  defaultGreeting: "👋 Hi! I'm your Placement Assistant. Ask me anything about placements!",
  suggestions: [
    "What companies are visiting?",
    "Eligibility criteria?",
    "Resume tips"
  ],
  outOfScope: "Sorry, I can only answer questions related to the CampusHire College Placement Portal.",
  errorMsg: "⚠️ Sorry, I couldn't connect to the placement assistant.",
  error403: "⚠️ Access denied (403). Please make sure you are logged in to chat."
};

const getFormattedTime = () => {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

// Reads initial messages from localStorage if present
const getInitialMessages = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to parse saved chat history:", e);
  }
  return [
    {
      role: "model",
      text: CHAT_TRANSLATIONS.defaultGreeting,
      timestamp: getFormattedTime()
    }
  ];
};

export function useChatbot() {
  // messages array — persisted in localStorage
  const [messages, setMessages] = useState(() => getInitialMessages());

  // true while waiting for AI chatbot response
  const [isLoading, setIsLoading] = useState(false);

  const t = CHAT_TRANSLATIONS;

  // Sync messages state to localStorage whenever messages update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save chat history to localStorage:", e);
    }
  }, [messages]);

  // Process backend replies (including out-of-scope guardrails) if necessary
  const processBackendReply = (reply) => {
    if (!reply || typeof reply !== "string") return reply;

    const lower = reply.toLowerCase();
    const isOutOfScope = lower.includes("sorry, i can only answer questions related") ||
      lower.includes("only answer questions related to the campushire");

    if (isOutOfScope) {
      return CHAT_TRANSLATIONS.outOfScope;
    }

    return reply;
  };

  // called by UI when user sends a message
  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim()) return; // ignore empty input

    const time = getFormattedTime();

    // build updated history with new user message
    const updatedMessages = [...messages, { role: "user", text: userText, timestamp: time }];

    // update UI immediately, start loading
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const rawReply = await sendChatMessage(userText);
      const finalReply = processBackendReply(rawReply);

      // append bot reply
      setMessages(prev => [...prev, { role: "model", text: finalReply, timestamp: getFormattedTime() }]);
    } catch (error) {
      console.error("Chatbot backend error:", error);
      const is403 = error?.response?.status === 403;
      const errorText = is403 ? t.error403 : t.errorMsg;

      setMessages(prev => [...prev, {
        role: "model",
        text: errorText,
        isError: true,
        lastQuestion: userText,
        timestamp: getFormattedTime()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, t]);

  // retries sending a failed message
  const retryMessage = useCallback(async (index) => {
    if (isLoading) return;

    const errorMsg = messages[index];
    const questionToRetry = errorMsg?.lastQuestion || [...messages].slice(0, index).reverse().find(m => m.role === "user")?.text;

    if (!questionToRetry) return;

    // Remove the error message bubble
    setMessages(prev => prev.filter((_, i) => i !== index));
    setIsLoading(true);

    try {
      const rawReply = await sendChatMessage(questionToRetry);
      const finalReply = processBackendReply(rawReply);
      setMessages(prev => [...prev, { role: "model", text: finalReply, timestamp: getFormattedTime() }]);
    } catch (error) {
      console.error("Retry failed:", error);
      const is403 = error?.response?.status === 403;
      const errorText = is403 ? t.error403 : t.errorMsg;

      setMessages(prev => [...prev, {
        role: "model",
        text: errorText,
        isError: true,
        lastQuestion: questionToRetry,
        timestamp: getFormattedTime()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, t]);

  // resets conversation to the initial greeting
  const clearChat = () => {
    const defaultGreeting = [
      {
        role: "model",
        text: t.defaultGreeting,
        timestamp: getFormattedTime()
      }
    ];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to remove chat history:", e);
    }
    setMessages(defaultGreeting);
  };

  return {
    messages,
    isLoading,
    t,
    sendMessage,
    retryMessage,
    clearChat
  };
}
