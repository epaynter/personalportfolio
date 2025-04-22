// Updated getSafePosition function with more horizontal spacing
const getSafePosition = (index) => {
  // Define a grid-like layout with fixed positions to prevent overlap
  // These positions are carefully chosen to avoid the central area where the audio wave and button are
  const positions = [
    // Top row - far from center with more horizontal spacing
    { top: '5%', left: '2%' },
    { top: '5%', right: '2%' },
    
    // Bottom row - far from center with more horizontal spacing and more vertical padding from button
    { bottom: '15%', left: '2%' },
    { bottom: '15%', right: '2%' }
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
};

// Updated bubble styling with reduced width and more spacing
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
    width: '130px', // Further reduced width to prevent overlap
    maxHeight: '80px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    transition: 'all 0.3s ease-in-out',
    whiteSpace: 'normal',
    wordBreak: 'break-word'
  }}
  onClick={() => handlePromptClick(prompt, index)}
>
  {prompt}
</div>

// Updated button styling with more bottom margin
<button 
  onClick={handleAskMeAnything}
  className={`mt-4 mb-8 flex items-center space-x-2 px-3 py-1.5 rounded-full shadow-sm transition-all z-20 ${
    isRecording 
      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/30' 
      : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-800/30'
  }`}
  title={isRecording ? "Click to end" : "Click to start"}
>
  {/* Button content */}
</button> 