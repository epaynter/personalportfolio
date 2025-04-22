// Script to generate relevant questions for the prompt bubbles
const questions = [
  "What programming languages do you know?",
  "Tell me about your experience with React",
  "What's your favorite development tool?",
  "How do you approach problem solving?",
  "What's your experience with databases?",
  "Tell me about your web development skills",
  "What's your experience with APIs?",
  "How do you handle version control?",
  "What's your experience with testing?",
  "Tell me about your deployment experience",
  "What's your experience with cloud services?",
  "How do you stay updated with tech?",
  "What's your experience with mobile development?",
  "Tell me about your UI/UX skills",
  "What's your experience with DevOps?"
];

// Format the questions for the PromptContext.js file
const formattedQuestions = questions.map(q => `"${q}"`).join(',\n  ');

console.log('Copy these questions to the allPrompts array in PromptContext.js:');
console.log('\n' + formattedQuestions + '\n'); 