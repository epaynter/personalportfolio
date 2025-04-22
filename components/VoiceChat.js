import React, { useState } from 'react';
import { useVoiceChat } from '../contexts/VoiceChatContext';
import styles from '../styles/VoiceChat.module.css';

export default function VoiceChat() {
  const { 
    isRecording, 
    isProcessing, 
    error, 
    hasPermission, 
    startRecording, 
    stopRecording,
    requestMicrophonePermission 
  } = useVoiceChat();
  
  const [showPermissionMessage, setShowPermissionMessage] = useState(false);

  const handleClick = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    
    if (!hasPermission) {
      setShowPermissionMessage(true);
      const granted = await requestMicrophonePermission();
      if (granted) {
        setShowPermissionMessage(false);
        startRecording();
      }
    } else {
      startRecording();
    }
  };

  return (
    <div className={styles.voiceChatContainer}>
      <button
        className={`${styles.voiceButton} ${isRecording ? styles.recording : ''} ${isProcessing ? styles.processing : ''} ${!hasPermission ? styles.noPermission : ''}`}
        onClick={handleClick}
        disabled={isProcessing}
        title={!hasPermission ? "Click to enable microphone access" : isRecording ? "Click to stop recording" : "Click to start recording"}
      >
        {isRecording ? (
          <span className={styles.recordingIcon} />
        ) : isProcessing ? (
          <span className={styles.processingIcon} />
        ) : (
          <span className={styles.micIcon} />
        )}
      </button>
      
      {showPermissionMessage && (
        <div className={styles.permissionMessage}>
          Please allow microphone access to use voice chat
        </div>
      )}
      
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
} 