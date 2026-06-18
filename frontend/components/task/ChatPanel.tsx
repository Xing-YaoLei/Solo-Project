"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, Image } from "lucide-react";
import { ChatMessage } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { USER_ROLE_LABELS } from "@/lib/constants";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export function ChatPanel({ messages, onSendMessage, disabled }: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !disabled) {
      onSendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-gray-50 rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 bg-white rounded-t-lg">
        <h3 className="font-semibold text-gray-900">沟通记录</h3>
        <p className="text-xs text-gray-500">共 {messages.length} 条消息</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquareIcon className="h-12 w-12 mb-2" />
            <p className="text-sm">暂无消息</p>
            <p className="text-xs">发送第一条消息开始沟通</p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = false;

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  isCurrentUser ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <Avatar
                  src={message.sender.avatar}
                  fallback={message.sender.name}
                  size="sm"
                />
                <div
                  className={`flex flex-col max-w-[75%] ${
                    isCurrentUser ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 mb-1 ${
                      isCurrentUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {message.sender.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {USER_ROLE_LABELS[message.sender.role]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(message.createdAt, "MM-dd HH:mm")}
                    </span>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      isCurrentUser
                        ? "bg-primary-600 text-white rounded-tr-none"
                        : "bg-white text-gray-700 rounded-tl-none border border-gray-200"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={disabled ? "请先登录后发言..." : "输入消息..."}
                disabled={disabled}
                rows={2}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <button
                  type="button"
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                  disabled={disabled}
                >
                  <Image className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                  disabled={disabled}
                >
                  <Paperclip className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <Button
            type="submit"
            disabled={!newMessage.trim() || disabled}
            className="h-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          按 Enter 发送，Shift + Enter 换行
        </p>
      </form>
    </div>
  );
}

function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
