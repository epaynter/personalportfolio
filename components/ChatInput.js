import { useState, useEffect, useRef } from 'react';
import { useChat } from '../contexts/ChatContext';
import { toast } from 'react-hot-toast';
import MinimalInput from './MinimalInput';

const ChatInput = () => {
  const { messages, sendMessage, isLoading, error } = useChat();
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <div className="flex flex-col gap-4">
      <MinimalInput />
    </div>
  );
};

export default ChatInput; 