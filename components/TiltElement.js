import { useRef, useState, useEffect } from 'react';
import WaveformAnimation from './WaveformAnimation';
import { useVoiceChat } from '../contexts/VoiceChatContext';
import { useChat } from '../contexts/ChatContext';
import { usePrompts } from '../contexts/PromptContext';

export default function AudioWaveWithPrompts() {
  const containerRef = useRef(null);
  const { isRecording, isSpeaking, startRecording, stopRecording, setVoiceMode } = useVoiceChat();
  const { sendMessage } = useChat();
  const { visiblePrompts, markPromptAsUsed } = usePrompts();
  const [poppingBubble, setPoppingBubble] = useState(null);
  const [showBubbles, setShowBubbles] = useState(true);
  const [isWorkInProgress, setIsWorkInProgress] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check window size and update bubble visibility
  useEffect(() => {
    const checkWindowSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkWindowSize();

    // Add event listener for window resize
    window.addEventListener('resize', checkWindowSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkWindowSize);
  }, []);

  const handleAskMeAnything = async () => {
    try {
      if (isRecording) {
        stopRecording();
        setVoiceMode(false);
        console.log('🛑 Voice mode manually ended');
      } else {
        // Show work in progress state
        setIsWorkInProgress(true);
        
        // Reset after 4 seconds
        setTimeout(() => {
          setIsWorkInProgress(false);
        }, 4000);
      }
    } catch (error) {
      console.error('Error handling voice session:', error);
    }
  };

  const handlePromptClick = (prompt, index) => {
    // Set the popping bubble
    setPoppingBubble(index);
    
    // Set voice mode first, then send message after a small delay
    setVoiceMode(true);
    setTimeout(() => {
      sendMessage(prompt, true);
    }, 100);
    
    // Mark the prompt as used after animation completes
    setTimeout(() => {
      markPromptAsUsed(prompt);
      setPoppingBubble(null);
    }, 400); // Match the animation duration
  };

  // Generate safe positions for bubbles that ensure they're fully visible and don't overlap
  const getSafePosition = (index) => {
    if (isMobile || window.innerWidth < 768) {
      // On mobile, position bubbles on left and right sides
      const positions = [
        { left: '0%', top: '50%', transform: 'translateY(-50%)' },  // Left side
        { right: '0%', top: '50%', transform: 'translateY(-50%)' }   // Right side
      ];
      return positions[index % 2]; // Only use first two positions
    } else {
      // Desktop layout with all four positions
      const positions = [
        { top: '5%', left: '5%' },      // Top left
        { top: '5%', right: '5%' },     // Top right
        { bottom: '20%', left: '5%' },   // Bottom left
        { bottom: '20%', right: '5%' }   // Bottom right
      ];
      return positions[index % positions.length];
    }
  };

  return (
    <div 
      className="relative w-52 h-52 md:w-80 md:h-80 overflow-visible"
    >
      <div 
        id="waveform-container"
        ref={containerRef}
        className="w-full h-full flex flex-col items-center justify-center gap-4"
      >
        {/* Floating prompt bubbles - limited to 4 and only shown when window is large enough */}
        {showBubbles && !isRecording && !isSpeaking && visiblePrompts.map((prompt, index) => (
          <div 
            key={index}
            className={`absolute transition-all duration-300 ${
              poppingBubble === index ? 'animate-pop' : 'animate-float'
            }`}
            style={{
              ...getSafePosition(index),
              animationDelay: `${index * 0.8}s`,
              zIndex: 20
            }}
          >
            <div 
              className="text-xs font-medium max-w-[120px] truncate cursor-pointer hover:scale-105 transition-transform"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(173,216,230,0.4))',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 0 20px rgba(100, 149, 237, 0.4), inset 0 0 15px rgba(255, 255, 255, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '50%',
                padding: '12px',
                color: '#1f3b64',
                fontWeight: '500',
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                transform: 'rotate(-5deg)',
                transition: 'all 0.3s ease-in-out'
              }}
              onClick={() => handlePromptClick(prompt, index)}
            >
              {prompt}
            </div>
          </div>
        ))}
        
        <WaveformAnimation />
        
        {/* Button */}
        <button 
          onClick={handleAskMeAnything}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full shadow-sm transition-all ${
            isWorkInProgress
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800/30'
              : isRecording 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/30' 
                : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-800/30'
          }`}
          title={isRecording ? "Click to end" : "Click to start"}
        >
          {isWorkInProgress ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium">
                Work in progress - voice to voice coming soon!
              </span>
            </>
          ) : isRecording ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-xs font-medium">
                End conversation
              </span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="text-xs font-medium">
                Ask me anything
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
} 