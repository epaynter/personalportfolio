import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { motion } from 'framer-motion';
import MinimalInput from './MinimalInput';
import { toast } from 'react-hot-toast';
import { useVoiceChat } from '../contexts/VoiceChatContext';
import { usePrompts } from '../contexts/PromptContext';
import { useChat } from '../contexts/ChatContext';
import WaveformAnimation from './WaveformAnimation';

const TypewriterText = ({ phrases }) => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    const typeSpeed = 100;
    const deleteSpeed = 50;
    const waitTime = 2000;

    const type = () => {
      const currentPhrase = phrases[currentPhraseIndex];
      
      if (isWaiting) {
        setTimeout(() => {
          setIsWaiting(false);
          setIsDeleting(true);
        }, waitTime);
        return;
      }

      if (isDeleting) {
        setCurrentText(currentPhrase.substring(0, currentText.length - 1));
        if (currentText === '') {
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      } else {
        setCurrentText(currentPhrase.substring(0, currentText.length + 1));
        if (currentText === currentPhrase) {
          setIsWaiting(true);
        }
      }
    };

    const timer = setTimeout(type, isDeleting ? deleteSpeed : typeSpeed);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, isWaiting, currentPhraseIndex, phrases]);

  return (
    <span className="text-primary-600 font-medium">
      {currentText}
      <span className="animate-blink">|</span>
    </span>
  );
};

// Add ScrollArrow component
const ScrollArrow = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-primary-600 hover:text-primary-500 transition-all duration-300 p-2 rounded-full hover:bg-primary-100/20 hover:ring-2 hover:ring-primary-200/50"
      aria-label="Scroll to projects"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  );
};

export default function Hero({ heroData, onUpdateHero }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { isRecording, isSpeaking, startRecording, stopRecording, setVoiceMode } = useVoiceChat();
  const { sendMessage } = useChat();
  const { visiblePrompts, markPromptAsUsed } = usePrompts();
  const [poppingBubble, setPoppingBubble] = useState(null);
  const [showBubbles, setShowBubbles] = useState(true);
  const minimalInputRef = useRef(null);
  const { handleAskMeAnything } = useVoiceChat();
  const [isWorkInProgress, setIsWorkInProgress] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // Enhanced animations
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(
      '.hero-title',
      { 
        opacity: 0, 
        y: 30,
        scale: 0.95
      },
      { 
        opacity: 1, 
        y: 0,
        scale: 1,
        duration: 1
      }
    )
    .fromTo(
      '.hero-description',
      { 
        opacity: 0, 
        y: 20 
      },
      { 
        opacity: 1, 
        y: 0,
        duration: 0.8
      },
      '-=0.6'
    )
    .fromTo(
      '.hero-cta',
      { 
        opacity: 0, 
        y: 20 
      },
      { 
        opacity: 1, 
        y: 0,
        duration: 0.8
      },
      '-=0.4'
    );
  }, []);

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

  const scrollToProjects = () => {
    const projectsSection = document.getElementById('projects');
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePromptClick = (prompt, index) => {
    // Set the popping bubble
    setPoppingBubble(index);
    
    // Set voice mode first, then send message after a small delay
    setVoiceMode(true);
    setTimeout(() => {
      sendMessage(prompt, true);
      
      // Trigger the chat button click to expand the chat window
      const chatButton = document.querySelector('[aria-label="Open chat"]');
      if (chatButton) {
        chatButton.click();
      }
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
      // On mobile, position bubbles on left and right sides with controlled spacing
      const leftPositions = [
        { left: '-80%', top: '20%', transform: 'translateY(-50%)' },  // Left upper
        { left: '-80%', top: '60%', transform: 'translateY(-50%)' }   // Left lower
      ];
      const rightPositions = [
        { right: '-80%', top: '30%', transform: 'translateY(-50%)' },  // Right upper
        { right: '-80%', top: '70%', transform: 'translateY(-50%)' }   // Right lower
      ];
      
      // First two indices (0,1) use left positions, last two (2,3) use right positions
      return index < 2 ? leftPositions[index] : rightPositions[index - 2];
    } else {
      // Desktop layout with all four positions
    const positions = [
      { top: '5%', left: '2%' },
      { top: '5%', right: '2%' },
      { bottom: '-2%', left: '2%' },
      { bottom: '-2%', right: '2%' }
    ];
    
    // Get the position based on index
    const position = positions[index % positions.length];
    
    // Add a very small random offset (max 2px) to make it look slightly more natural
    // but not enough to cause overlap
    const randomOffsetX = (Math.random() * 4 - 2);
    const randomOffsetY = (Math.random() * 4 - 2);
    
    return {
      ...position,
      transform: `translate(${randomOffsetX}px, ${randomOffsetY}px) rotate(-5deg)`
    };
    }
  };

  const handleAskClick = async () => {
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

  return (
    <div className="relative">
      <section id="home" className="relative min-h-[68vh] flex items-center justify-center overflow-hidden bg-background">
        {/* Enhanced background elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/textures/noise.png')] opacity-[0.15] mix-blend-overlay"></div>
          <div 
            className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-transparent to-background"
            style={{
              transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          ></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-3xl">
              <h1 className="hero-title text-5xl font-bold leading-tight bg-gradient-to-r from-primary-600 via-primary-400 to-primary-500 bg-clip-text text-transparent animate-gradient">
                {heroData?.title || "I build tools at the edge of crypto, code, and automation."}
              </h1>
              <p className="hero-description mt-4 text-lg text-zinc-500 max-w-xl">
                {heroData?.description || "From Telegram trading bots to environmental geospatial analytics, I'm obsessed with building things that actually work."}
              </p>
              <div className="hero-cta mt-6">
                <a 
                  href="#projects" 
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToProjects();
                  }}
                  className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition"
                >
                  See My Work
                </a>
              </div>
            </div>
            
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="relative">
                {/* Robot Shadow */}
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-primary-200/30 dark:bg-primary-900/30 rounded-full blur-md"></div>
                
                {/* Voice Chat Button */}
                <div className="relative w-52 h-52 md:w-80 md:h-80">
                  {/* Floating prompt bubbles - limit to 4 to prevent overlap */}
                  {showBubbles && !isRecording && !isSpeaking && visiblePrompts.slice(0, 4).map((prompt, index) => (
                    <div 
                      key={index}
                      className={`absolute transition-all duration-300 ${
                        poppingBubble === index ? 'animate-pop' : 'animate-float'
                      }`}
                      style={{
                        ...getSafePosition(index),
                        animationDelay: `${index * 0.8}s`,
                        zIndex: 10
                      }}
                    >
                      <div 
                        className="text-xs font-medium cursor-pointer hover:scale-105 transition-transform"
                        style={{
                          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(173,216,230,0.6))',
                          backdropFilter: 'blur(8px)',
                          boxShadow: '0 0 20px rgba(100, 149, 237, 0.4), inset 0 0 15px rgba(255, 255, 255, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.7)',
                          borderRadius: '30px',
                          padding: '12px 16px',
                          color: '#1f3b64',
                          fontWeight: '500',
                          width: '130px',
                          maxHeight: '80px',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          transition: 'all 0.3s ease-in-out',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          transform: 'translateZ(0)',
                          willChange: 'transform',
                          backfaceVisibility: 'hidden',
                          WebkitFontSmoothing: 'antialiased',
                          MozOsxFontSmoothing: 'grayscale'
                        }}
                        onClick={() => handlePromptClick(prompt, index)}
                      >
                        {prompt}
                      </div>
                    </div>
                  ))}
                  
                  {/* Center the waveform and button */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <WaveformAnimation />
                    
                    <button 
                      onClick={handleAskClick}
                      className={`mt-4 mb-8 flex items-center space-x-2 px-3 py-1.5 rounded-full shadow-sm transition-all z-20 ${
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
              </div>
            </div>
          </div>
        </div>
      </section>
      <ScrollArrow onClick={scrollToProjects} />
    </div>
  );
}