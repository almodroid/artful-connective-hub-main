import { ChatMessage } from "@/hooks/use-chat";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const API_URL = "https://openrouter.ai/api/v1";

export interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string | Array<{
    type: "text" | "image_url";
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

// Logging utility
const logApiCall = (type: 'request' | 'response' | 'error', data: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[API ${type}] ${timestamp}:`, data);
};

export async function sendToOpenRouter(
  messages: OpenRouterMessage[],
  model: string = "opengvlab/internvl3-14b:free"
) {
  if (!OPENROUTER_API_KEY) {
    const error = "OpenRouter API key is not configured";
    logApiCall('error', error);
    throw new Error(error);
  }

  // Add system message for brevity
  const systemMessage: OpenRouterMessage = {
    role: "system",
    content: "You are Space AI, an art and design expert. Keep your responses concise and to the point. Aim for 2-3 sentences maximum. Focus on providing clear, actionable advice about art, design, and UI/UX."
  };

  const requestBody = {
    model,
    messages: [systemMessage, ...messages],
    temperature: 0.7,
    max_tokens: 150, // Reduced from 1000 to get shorter responses
    presence_penalty: 0.6, // Encourage more focused responses
    frequency_penalty: 0.6, // Discourage repetition
  };

  logApiCall('request', {
    model,
    messageCount: messages.length,
    lastMessage: messages[messages.length - 1],
  });

  try {
    const response = await fetch(`${API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Space AI Chat",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = `API error: ${response.status}`;
      const errorData = { 
        status: response.status, 
        error,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      };
      
      logApiCall('error', errorData);

      // Handle specific error cases
      if (response.status === 404) {
        throw new Error("API endpoint not found. Please check the API configuration.");
      } else if (response.status === 401) {
        throw new Error("Invalid API key. Please check your OpenRouter API key.");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else if (response.status === 400) {
        const errorText = await response.text();
        throw new Error(`Invalid request: ${errorText}`);
      }
      
      throw new Error(error);
    }

    const data = await response.json();
    logApiCall('response', {
      model: data.model,
      usage: data.usage,
      responseLength: data.choices[0].message.content.length,
    });

    return data.choices[0].message.content;
  } catch (error) {
    // Enhanced error logging
    logApiCall('error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });

    // Rethrow with a more user-friendly message
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to the AI service. Please check your internet connection.');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred while communicating with the AI service.');
  }
}

export function convertToOpenRouterMessages(messages: ChatMessage[]): OpenRouterMessage[] {
  return messages.map((msg) => ({
    role: msg.role,
    content: typeof msg.content === 'string' 
      ? msg.content 
      : [{
          type: "text",
          text: msg.content
        }]
  }));
}

// Helper function to create a message with both text and image
export function createMessageWithImage(text: string, imageUrl: string): OpenRouterMessage {
  return {
    role: "user",
    content: [
      {
        type: "text",
        text: text
      },
      {
        type: "image_url",
        image_url: {
          url: imageUrl
        }
      }
    ]
  };
} 