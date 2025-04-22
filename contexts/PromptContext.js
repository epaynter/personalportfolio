import { createContext, useContext, useState, useCallback } from 'react';

const PromptContext = createContext();

export function PromptProvider({ children }) {
  const [allPrompts, setAllPrompts] = useState([
    "Who built this assistant?",
    "What projects has Eliot built?",
    "Does voice-to-voice chat work?",
    "What is the SMOC system?",
    "How does the copy trading bot work?",
    "What kind of bots has Eliot built?",
    "What’s the Macro Insights Model?",
    "Tell me about Eliot’s Datsun project",
    "What is HypedUp?",
    "Has Eliot done any GIS work?",
    "What tools and technologies does Eliot use?",
    "How does Eliot approach learning new tech?",
    "What kind of work does Eliot do?",
    "What's Eliot’s tech stack?"
  ]);
  
  const [usedPrompts, setUsedPrompts] = useState(new Set());
  
  // Get visible prompts (limited to 4) that haven't been used
  const visiblePrompts = allPrompts
    .filter(prompt => !usedPrompts.has(prompt))
    .slice(0, 4);
  
  // Mark a prompt as used
  const markPromptAsUsed = useCallback((prompt) => {
    setUsedPrompts(prev => {
      const newSet = new Set(prev);
      newSet.add(prompt);
      // If all prompts are used, reset the set
      if (newSet.size === allPrompts.length) {
        return new Set();
      }
      return newSet;
    });
  }, [allPrompts.length]);
  
  // Reset all prompts (for admin use)
  const resetPrompts = useCallback(() => {
    setUsedPrompts(new Set());
  }, []);
  
  // Update prompts (for admin use)
  const updatePrompts = useCallback((newPrompts) => {
    setAllPrompts(newPrompts);
    setUsedPrompts(new Set());
  }, []);
  
  return (
    <PromptContext.Provider value={{
      visiblePrompts,
      allPrompts,
      markPromptAsUsed,
      resetPrompts,
      updatePrompts
    }}>
      {children}
    </PromptContext.Provider>
  );
}

export function usePrompts() {
  const context = useContext(PromptContext);
  if (!context) {
    throw new Error('usePrompts must be used within a PromptProvider');
  }
  return context;
} 