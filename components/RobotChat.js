import { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useVoiceChat } from '../contexts/VoiceChatContext';
import WaveformAnimation from './WaveformAnimation';

export default function RobotChat() {
  const [question, setQuestion] = useState('');
  const { messages, isLoading, error, sendMessage, threadId } = useChat();
  const { voiceMode, isListening, isSpeaking, lastQuestion, lastResponse } = useVoiceChat();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!question.trim()) return;
    
    const messageToSend = question;
    setQuestion(''); // Clear input immediately
    
    await sendMessage(messageToSend);
  };

  return (
    <div className="mt-8 w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 bg-primary-600 dark:bg-primary-500 text-white">
          <h3 className="font-semibold text-center">
            {voiceMode ? 'Voice Chat Mode' : 'Ask Eliot\'s Bot'}
          </h3>
        </div>
        
        <div className="h-64 overflow-y-auto p-4 space-y-4">
          {voiceMode ? (
            <>
              {lastQuestion && (
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100 rounded-lg">
                  You: {lastQuestion}
                </div>
              )}
              {isListening && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-300">
                  <div className="w-16 h-8">
                    <WaveformAnimation />
                  </div>
                  <span>Listening...</span>
                </div>
              )}
              {isSpeaking && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-300">
                  <div className="w-16 h-8">
                    <WaveformAnimation />
                  </div>
                  <span>Speaking...</span>
                </div>
              )}
              {lastResponse && !isSpeaking && (
                <div className="p-3 bg-gray-100 dark:bg-zinc-700/50 text-gray-900 dark:text-zinc-100 rounded-lg">
                  {lastResponse}
                </div>
              )}
            </>
          ) : (
            <>
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-zinc-400 py-8">
                  <p>Ask me anything about the projects, skills, or experience!</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100 ml-auto max-w-[80%]' 
                        : 'bg-gray-100 dark:bg-zinc-700/50 text-gray-900 dark:text-zinc-100 mr-auto max-w-[80%]'
                    }`}
                  >
                    {msg.content}
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex items-center space-x-2 text-gray-500 dark:text-zinc-400">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-zinc-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              )}
              
              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
                  {error}
                </div>
              )}
            </>
          )}
        </div>
        
        {!voiceMode && (
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-zinc-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your question here..."
                className="flex-1 p-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-zinc-700/50 dark:text-zinc-100"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!question.trim() || isLoading}
                className="bg-primary-600 text-white px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 