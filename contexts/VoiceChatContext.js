import React, { createContext, useContext, useState } from 'react';

const VoiceChatContext = createContext();

export function VoiceChatProvider({ children }) {
  // Placeholder state for voice functionality that will be implemented later
  const [voiceMode, setVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);

  // Placeholder functions that will be implemented later
  const startRecording = async () => {
    console.log('Voice functionality is not yet implemented');
  };

  const stopRecording = async () => {
    console.log('Voice functionality is not yet implemented');
  };

  const playAudio = async () => {
    console.log('Voice functionality is not yet implemented');
  };

  const toggleVoiceMode = () => {
    setVoiceMode(prev => !prev);
  };

  return (
    <VoiceChatContext.Provider value={{
      voiceMode,
      setVoiceMode,
      toggleVoiceMode,
      isRecording,
      isProcessing,
      error,
      hasPermission,
      isSpeaking,
      isGeneratingVoice,
      startRecording,
      stopRecording,
      playAudio
    }}>
      {children}
    </VoiceChatContext.Provider>
  );
}

export function useVoiceChat() {
  const context = useContext(VoiceChatContext);
  if (!context) {
    throw new Error('useVoiceChat must be used within a VoiceChatProvider');
  }
  return context;
} 