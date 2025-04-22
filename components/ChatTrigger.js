import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../contexts/ChatContext';

export default function ChatTrigger() {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasScrolledToProjects, setHasScrolledToProjects] = useState(false);
  const [hasClickedChatButton, setHasClickedChatButton] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [question, setQuestion] = useState('');
  const { messages, isLoading, error, sendMessage, clearChat, threadId } = useChat();
  const messagesEndRef = useRef(null);
  const tooltipTimeoutRef = useRef(null);

  // Auto-scroll to bottom when messages change or when chat is expanded
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  useEffect(() => {
    const checkScrollPosition = () => {
      // Check if user has scrolled to the projects section
      const projectsSection = document.getElementById('projects');
      if (projectsSection) {
        const projectsSectionTop = projectsSection.offsetTop;
        const scrollPosition = window.scrollY + window.innerHeight / 2;
        
        if (scrollPosition > projectsSectionTop) {
          setHasScrolledToProjects(true);
          setShowTooltip(true);
        } else {
          setHasScrolledToProjects(false);
          setShowTooltip(false);
        }
      }
    };

    window.addEventListener('scroll', checkScrollPosition);
    // Check initial position
    checkScrollPosition();
    
    return () => window.removeEventListener('scroll', checkScrollPosition);
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!question.trim()) return;
    
    const messageToSend = question;
    setQuestion(''); // Clear input immediately
    
    await sendMessage(messageToSend);
    
    // Ensure we scroll to the bottom after sending a message
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleChatButtonClick = () => {
    setShowTooltip(false);
    setHasClickedChatButton(true);
    setIsExpanded(true);
  };

  // Handle clicking outside the chat to minimize it
  const handleClickOutside = (e) => {
    if (isExpanded && !isFullScreen) {
      const chatContainer = document.getElementById('chat-container');
      if (chatContainer && !chatContainer.contains(e.target)) {
        setIsExpanded(false);
      }
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, isFullScreen]);

  return (
    <>
      {/* Chat button with tooltip */}
      <AnimatePresence>
        {isVisible && !isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-8 z-50 flex flex-row items-center"
          >
            {showTooltip && !hasClickedChatButton && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="mr-4 bg-white dark:bg-zinc-800 p-3 rounded-lg shadow-lg max-w-xs"
              >
                <p className="text-sm text-gray-700 dark:text-zinc-300">
                  <span className="font-semibold text-primary-600 dark:text-primary-400">EliotAI</span> is ready to answer your questions about my portfolio and experience!
                </p>
                <div className="mt-2 flex items-center text-xs text-primary-600 dark:text-primary-400">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Click to start a conversation
                </div>
              </motion.div>
            )}
            
            <button
              onClick={handleChatButtonClick}
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 flex items-center justify-center"
              aria-label="Open chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed ${isFullScreen ? 'inset-0' : 'bottom-6 right-6'} z-50 bg-white dark:bg-zinc-900 rounded-lg shadow-xl overflow-hidden flex flex-col`}
            style={{ width: isFullScreen ? '100%' : '400px', height: isFullScreen ? '100%' : '600px' }}
            id="chat-container"
          >
            {/* Chat header */}
            <div className="bg-primary-600 dark:bg-primary-500 p-4 flex justify-between items-center">
              <h3 className="font-semibold text-white">Ask Eliot's Bot</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="text-white hover:text-primary-200 transition-colors"
                  aria-label={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullScreen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a2 2 0 012-2h2V3H7a4 4 0 00-4 4v2h2zm10 0V7a4 4 0 00-4-4h-2v2h2a2 2 0 012 2v2h2zm0 2v2a2 2 0 01-2 2h-2v2h2a4 4 0 004-4v-2h-2zm-10 0v2a4 4 0 004 4h2v-2H9a2 2 0 01-2-2v-2H5z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 111.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => setShowClearConfirmation(true)}
                  className="text-white hover:text-primary-200 transition-colors"
                  aria-label="Clear chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-white hover:text-primary-200 transition-colors"
                  aria-label="Close chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat messages container */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-zinc-400 py-8">
                    <div className="bg-gray-100 dark:bg-zinc-700/50 text-gray-900 dark:text-zinc-100 p-4 rounded-lg mb-4 text-left">
                      <p className="font-medium mb-2">Hey! 👋</p>
                      <p>I'm EliotAI, Eliot's AI agent here to help answer any questions you may have about his portfolio, projects, or experience.</p>
                      <p className="mt-2">Feel free to ask me anything!</p>
                    </div>
                    <p>Type your question below to get started.</p>
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
                  <div className="bg-gray-100 dark:bg-zinc-700/50 text-gray-900 dark:text-zinc-100 p-3 rounded-lg mr-auto max-w-[80%]">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 dark:bg-zinc-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-3 rounded-lg mr-auto max-w-[80%]">
                    {error}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Chat input - now fixed to bottom */}
            <div className="p-4 border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-zinc-800 dark:text-white"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !question.trim()}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </form>
            </div>

            {/* Clear confirmation modal */}
            <AnimatePresence>
              {showClearConfirmation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 z-[60]"
                >
                  <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-lg max-w-xs mx-4">
                    <p className="text-gray-800 dark:text-zinc-200 mb-4">Are you sure you want to clear the chat?</p>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setShowClearConfirmation(false)}
                        className="px-3 py-1 text-sm bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-zinc-200 rounded hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          clearChat();
                          setShowClearConfirmation(false);
                        }}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 