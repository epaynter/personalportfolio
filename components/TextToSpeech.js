import { useState, useRef } from 'react';

const SUGGESTIONS = [
  "Tell me about this portfolio",
  "What's the most impressive project?",
  "What technologies do you use?",
  "Tell me about your experience",
  "What are your main skills?"
];

export default function TextToSpeech() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentAudioRef = useRef(null);

  const handleEndConversation = () => {
    // Stop any playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      URL.revokeObjectURL(currentAudioRef.current.src);
      currentAudioRef.current = null;
      setIsPlaying(false);
    }
    
    // Reset UI state
    setText('');
    setIsLoading(false);
  };

  const handleSpeak = async () => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          style: localStorage.getItem('assistant_voice_style') || 'neutral'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Clean up previous audio if it exists
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        URL.revokeObjectURL(currentAudioRef.current.src);
      }
      
      // Create and store new audio
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        setIsPlaying(false);
      };

      audio.onplay = () => {
        setIsPlaying(true);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error playing speech:', error);
      alert('Failed to play speech. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setText(suggestion);
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={isPlaying}
            className={`px-3 py-1 text-sm rounded-full transition-colors
              ${isPlaying 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
          >
            {suggestion}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to speak..."
        className="w-full p-2 border rounded-md min-h-[100px] resize-y"
        disabled={isLoading || isPlaying}
      />
      <div className="flex gap-2">
        <button
          onClick={handleSpeak}
          disabled={!text.trim() || isLoading || isPlaying}
          className={`flex-1 px-4 py-2 rounded-md text-white font-medium transition-colors
            ${!text.trim() || isLoading || isPlaying
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
            }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                  fill="none"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </span>
          ) : (
            'Speak'
          )}
        </button>
        {(isPlaying || isLoading) && (
          <button
            onClick={handleEndConversation}
            className="px-4 py-2 rounded-md text-white font-medium 
                     bg-red-500 hover:bg-red-600 transition-colors"
          >
            End conversation
          </button>
        )}
      </div>
    </div>
  );
} 