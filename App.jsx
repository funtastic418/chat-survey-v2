import React, { useState, useRef, useEffect } from 'react';

// ============================================
// CONFIGURATION - EDIT THESE VALUES
// ============================================
const CONFIG = {
  // Your Google Apps Script Web App URL
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxKeeyIEvitZcgu2GSJazjO6KALcEQPI9yqrS8VFw6YEUDyP3jmgfg8737_XSrF0SPk/exec',
  
  // Token/character limits to control costs
  MAX_CHARS_PER_RESPONSE: 500,  // Limit each user response
  MAX_TOTAL_CHARS: 2000,       // Total chars across all responses
  
  // Your name for personalization
  YOUR_NAME: 'Fabian',
};

// ============================================
// SURVEY QUESTIONS
// ============================================
const TOPICS = {
  A: 'Building and selling automation templates',
  B: 'Growing an email list in the AI or automation space',
  C: 'Using AI to build simple web apps without a coding background',
  D: 'Publishing books using AI',
  E: 'Building a small solo creator business',
  F: 'Something else',
};

const INTRO_MESSAGE = `Hey! 👋

I'm working on creating something new and I'd love your input. This quick chat will help me understand what would be most valuable for you.

It takes about 2-3 minutes. Ready?`;

const TOPIC_QUESTION = `Over the last few years, I've worked on a few different things:

• Built 46 n8n automation templates (sold via a subscription)
• Grew an email list to around 14k subscribers
• Published several books on Amazon
• Started building simple AI web apps using vibe coding
• Built a small solo creator business without 1-1 clients

**If you had to pick one, what would you most want to learn more about?**`;

const FOLLOW_UP_QUESTIONS = [
  (topic) => `Interesting choice! **Why do you want to learn about ${topic.toLowerCase()}?** What's driving that interest for you?`,
  (topic) => `Got it. **Have you tried ${topic.toLowerCase()} before?** If yes, what happened? If not, what's held you back?`,
  (topic) => `This is really helpful. **What's the #1 thing preventing you from making progress on this right now?** Be as specific as you can.`,
  (topic) => `Last question: **If I could help you with just ONE thing related to ${topic.toLowerCase()}, what would make the biggest difference for you right now?**`,
];

const THANK_YOU_MESSAGE = `Thank you so much for sharing! 🙏

Your answers are incredibly helpful. I read every single response personally.

Based on what you and others tell me, I'll be creating something that directly addresses these challenges.

Stay tuned - ${CONFIG.YOUR_NAME}`;

// ============================================
// MAIN COMPONENT
// ============================================
export default function SurveyChatbot() {
  const [stage, setStage] = useState('intro');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userData, setUserData] = useState({
    email: '',
    name: '',
    topic: '',
    topicLabel: '',
    answers: [],
  });
  const [totalChars, setTotalChars] = useState(0);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [stage]);

  useEffect(() => {
    addBotMessage(INTRO_MESSAGE, () => {
      setTimeout(() => {
        addBotMessage("First, what's your email address?", () => setStage('email'));
      }, 800);
    });
  }, []);

  const addBotMessage = (text, callback) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { type: 'bot', text }]);
      if (callback) setTimeout(callback, 300);
    }, 600 + Math.random() * 400);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { type: 'user', text }]);
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const value = inputValue.trim();
    setError('');

    if (value.length > CONFIG.MAX_CHARS_PER_RESPONSE) {
      setError(`Please keep your response under ${CONFIG.MAX_CHARS_PER_RESPONSE} characters.`);
      return;
    }

    if (totalChars + value.length > CONFIG.MAX_TOTAL_CHARS && stage.startsWith('followup')) {
      setError(`You've reached the maximum response length. Please be more concise.`);
      return;
    }

    addUserMessage(value);
    setInputValue('');
    setTotalChars(prev => prev + value.length);

    switch (stage) {
      case 'email':
        if (!validateEmail(value)) {
          addBotMessage("Hmm, that doesn't look like a valid email. Could you try again?");
          return;
        }
        setUserData(prev => ({ ...prev, email: value }));
        addBotMessage("Perfect! And what's your first name?", () => setStage('name'));
        break;

      case 'name':
        setUserData(prev => ({ ...prev, name: value }));
        addBotMessage(`Nice to meet you, ${value}! 😊`, () => {
          setTimeout(() => {
            addBotMessage(TOPIC_QUESTION, () => setStage('topic'));
          }, 600);
        });
        break;

      case 'topic':
        const topicKey = value.toUpperCase().charAt(0);
        if (TOPICS[topicKey]) {
          const topicLabel = TOPICS[topicKey];
          setUserData(prev => ({ ...prev, topic: topicKey, topicLabel }));
          addBotMessage(FOLLOW_UP_QUESTIONS[0](topicLabel), () => setStage('followup1'));
        } else if (value.toLowerCase().includes('something else') || value.toLowerCase().includes('other')) {
          setUserData(prev => ({ ...prev, topic: 'F', topicLabel: 'Something else' }));
          addBotMessage("Interesting! What topic would you like to learn more about?", () => setStage('other_topic'));
        } else {
          const topicLabel = value;
          setUserData(prev => ({ ...prev, topic: 'custom', topicLabel }));
          addBotMessage(FOLLOW_UP_QUESTIONS[0](topicLabel), () => setStage('followup1'));
        }
        break;

      case 'other_topic':
        setUserData(prev => ({ ...prev, topicLabel: value }));
        addBotMessage(FOLLOW_UP_QUESTIONS[0](value), () => setStage('followup1'));
        break;

      case 'followup1':
        setUserData(prev => ({ ...prev, answers: [...prev.answers, value] }));
        addBotMessage(FOLLOW_UP_QUESTIONS[1](userData.topicLabel), () => setStage('followup2'));
        break;

      case 'followup2':
        setUserData(prev => ({ ...prev, answers: [...prev.answers, value] }));
        addBotMessage(FOLLOW_UP_QUESTIONS[2](userData.topicLabel), () => setStage('followup3'));
        break;

      case 'followup3':
        setUserData(prev => ({ ...prev, answers: [...prev.answers, value] }));
        addBotMessage(FOLLOW_UP_QUESTIONS[3](userData.topicLabel), () => setStage('followup4'));
        break;

      case 'followup4':
        const finalData = { ...userData, answers: [...userData.answers, value] };
        setUserData(finalData);
        await saveToGoogleSheets(finalData);
        addBotMessage(THANK_YOU_MESSAGE, () => setStage('complete'));
        break;
    }
  };

  const saveToGoogleSheets = async (data) => {
    try {
      await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          email: data.email,
          name: data.name,
          topic: data.topicLabel,
          why: data.answers[0] || '',
          tried_before: data.answers[1] || '',
          preventing: data.answers[2] || '',
          need_help_with: data.answers[3] || '',
        }),
      });
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const handleTopicClick = (key) => {
    if (stage !== 'topic' || isTyping) return;
    addUserMessage(TOPICS[key]);
    
    const topicLabel = TOPICS[key];
    if (key === 'F') {
      setUserData(prev => ({ ...prev, topic: 'F', topicLabel: 'Something else' }));
      addBotMessage("Interesting! What topic would you like to learn more about?", () => setStage('other_topic'));
    } else {
      setUserData(prev => ({ ...prev, topic: key, topicLabel }));
      addBotMessage(FOLLOW_UP_QUESTIONS[0](topicLabel), () => setStage('followup1'));
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        
        * { box-sizing: border-box; }
        
        .chat-container {
          width: 100%;
          max-width: 520px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        }
        
        .chat-header {
          padding: 24px 28px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.02);
        }
        
        .chat-header h1 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          letter-spacing: -0.02em;
        }
        
        .chat-header p {
          margin: 4px 0 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }
        
        .messages-area {
          height: 480px;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .messages-area::-webkit-scrollbar { width: 6px; }
        .messages-area::-webkit-scrollbar-track { background: transparent; }
        .messages-area::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 3px; }
        
        .message {
          max-width: 85%;
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .message.bot { align-self: flex-start; }
        .message.user { align-self: flex-end; }
        
        .message-bubble {
          padding: 14px 18px;
          border-radius: 18px;
          font-size: 15px;
          line-height: 1.5;
          white-space: pre-wrap;
        }
        
        .message.bot .message-bubble {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.9);
          border-bottom-left-radius: 6px;
        }
        
        .message.user .message-bubble {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #fff;
          border-bottom-right-radius: 6px;
        }
        
        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          border-bottom-left-radius: 6px;
          width: fit-content;
        }
        
        .typing-dot {
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          animation: typingBounce 1.4s ease-in-out infinite;
        }
        
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        
        .topic-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
        }
        
        .topic-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.85);
          font-size: 14px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .topic-btn:hover {
          background: rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateX(4px);
        }
        
        .topic-btn .letter {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(99, 102, 241, 0.2);
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          color: #a5b4fc;
          flex-shrink: 0;
        }
        
        .input-area {
          padding: 20px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.2);
        }
        
        .input-form {
          display: flex;
          gap: 12px;
        }
        
        .input-field {
          flex: 1;
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          color: #fff;
          font-size: 15px;
          font-family: inherit;
          outline: none;
          transition: all 0.2s ease;
        }
        
        .input-field:focus {
          border-color: rgba(99, 102, 241, 0.5);
          background: rgba(255, 255, 255, 0.08);
        }
        
        .input-field::placeholder { color: rgba(255, 255, 255, 0.35); }
        .input-field:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .send-btn {
          padding: 14px 20px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .send-btn:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
        }
        
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .error-text { color: #f87171; font-size: 13px; margin-top: 8px; }
        
        .char-counter {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 8px;
          text-align: right;
        }
        
        .char-counter.warning { color: #fbbf24; }
        .char-counter.danger { color: #f87171; }
      `}</style>

      <div className="chat-container">
        <div className="chat-header">
          <h1>Quick Survey</h1>
          <p>Help shape what I create next</p>
        </div>

        <div className="messages-area">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.type}`}>
              <div className="message-bubble">
                {msg.text.split('\n').map((line, j) => (
                  <React.Fragment key={j}>
                    {line.split('**').map((part, k) => 
                      k % 2 === 1 ? <strong key={k}>{part}</strong> : part
                    )}
                    {j < msg.text.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
              
              {msg.type === 'bot' && msg.text.includes('If you had to pick one') && stage === 'topic' && (
                <div className="topic-buttons">
                  {Object.entries(TOPICS).map(([key, label]) => (
                    <button
                      key={key}
                      className="topic-btn"
                      onClick={() => handleTopicClick(key)}
                    >
                      <span className="letter">{key}</span>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="message bot">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          {stage !== 'complete' ? (
            <form onSubmit={handleSubmit} className="input-form">
              <input
                ref={inputRef}
                type={stage === 'email' ? 'email' : 'text'}
                className="input-field"
                placeholder={
                  stage === 'email' ? 'your@email.com' :
                  stage === 'name' ? 'Your first name' :
                  stage === 'topic' ? 'Type A, B, C, D, E, or F' :
                  'Type your answer...'
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isTyping}
                maxLength={CONFIG.MAX_CHARS_PER_RESPONSE}
              />
              <button 
                type="submit" 
                className="send-btn"
                disabled={!inputValue.trim() || isTyping}
              >
                Send
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '10px' }}>
              ✅ Survey complete - thank you!
            </div>
          )}
          
          {error && <div className="error-text">{error}</div>}
          
          {stage.startsWith('followup') && (
            <div className={`char-counter ${
              inputValue.length > CONFIG.MAX_CHARS_PER_RESPONSE * 0.9 ? 'danger' :
              inputValue.length > CONFIG.MAX_CHARS_PER_RESPONSE * 0.7 ? 'warning' : ''
            }`}>
              {inputValue.length} / {CONFIG.MAX_CHARS_PER_RESPONSE} characters
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
