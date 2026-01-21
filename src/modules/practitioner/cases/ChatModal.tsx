import { useState } from "react";
import { X, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  type: "bot" | "user";
  content: string;
  avatar?: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
}

export const ChatModal = ({ isOpen, onClose, sessionData }: ChatModalProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content: "Hello! I'm your personal AI Assistant Kapacia AI Bot.",
    },
    {
      id: "2",
      type: "user",
      content: "I need to know the session summary?",
    },
    {
      id: "3",
      type: "bot",
      content: `S (SUBJECTIVE):
${
  sessionData?.subjective ||
  "Patient reports significant improvement in anxiety symptoms. Panic attacks reduced from 5-6 per week to 1 this week. Successfully used breathing techniques (4-7-8 method). Experienced one panic episode before work presentation. Sleep has improved, now getting 6-7 hours vs. previous 4-5 hours."
}

O (OBJECTIVE):
${
  sessionData?.objective ||
  "Patient appeared more relaxed than previous sessions. Made consistent eye contact throughout session. Speech was clear and well-paced (vs. previous rapid speech). Minimal fidgeting observed. Affect brightened when discussing progress. No suicidal ideation reported or observed."
}

A (ASSESSMENT):
${
  sessionData?.assessment ||
  "Adjustment Disorder with anxious features - showing good response to treatment. Significant reduction in panic symptoms indicates positive trajectory. Work-related triggers remain but patient demonstrating improved coping.\n\nPrognosis: Good with continued intervention."
}

P (PLAN):
${
  sessionData?.plan ||
  "1. Continue weekly CBT sessions\n2. Maintain breathing exercises daily (4-7-8 technique)\n3. Introduce progressive muscle relaxation for work stress\n4. Explore cognitive restructuring for presentation anxiety\n5. Follow-up: 1 week (Jan 22, 2024)\n6. Re-assess need for psychiatric referral in 2 weeks"
}

Citations: Based on transcript segments [00:00:23], [00:12:45], [00:34:12]
[00:45:30]`,
    },
  ]);

  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: newMessage,
      };

      setMessages((prev) => [...prev, userMessage]);
      setNewMessage("");

      // Simulate bot response (replace with actual API call)
      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: "I'm processing your request...",
        };
        setMessages((prev) => [...prev, botMessage]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50 p-2">
      <div className="relative bg-white/95 shadow-xl rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center bg-white px-6 py-4 border-border border-b">
          <h2 className="text-secondary text-xl">Kapacia AI Bot</h2>

          <button
            onClick={onClose}
            className="bg-primary/10 p-1 rounded-full text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="space-y-4 p-6 h-125 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.type === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`shrink-0 flex justify-center items-center rounded-full w-10 h-10 font-semibold text-sm ${
                  message.type === "bot"
                    ? "bg-primary/20 text-primary"
                    : "bg-accent/20 text-secondary"
                }`}
              >
                {message.type === "bot" ? "SL" : "U"}
              </div>

              {/* Message Content */}
              <div
                className={`flex-1 ${
                  message.type === "user" ? "flex justify-end" : ""
                }`}
              >
                <div
                  className={`inline-block px-4 py-3 rounded-lg max-w-[80%] ${
                    message.type === "user"
                      ? "bg-primary text-white"
                      : "bg-white text-secondary border border-border/50"
                  }`}
                >
                  <p
                    className={`text-sm whitespace-pre-wrap ${
                      message.type === "user" ? "text-white" : "text-secondary"
                    }`}
                  >
                    {message.content}
                  </p>
                </div>

                {/* More Options for bot messages */}
                {/* {message.type === "bot" && message.id === "3" && (
                  <button className="mt-2 text-accent hover:text-secondary">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                )} */}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="bg-white mx-6 mb-6 px-4 py-3 border border-border rounded-full">
          <div className="flex items-center gap-3">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message"
              className="flex-1 shadow-none px-2 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="icon"
              className={`rounded-full w-auto px-3 h-10 shrink-0 ${
                !newMessage.trim()
                  ? "bg-accent/20 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/80"
              } text-white`}
            >
              Send
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
