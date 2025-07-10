import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Close,
  Send,
  ChatBubble,
  ExpandLess,
  ExpandMore,
  Settings,
  Delete
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from 'firebase/firestore';
import db from '../firebase-config';


const Message = ({ message, onDelete }) => {
  const safeText = typeof message.text === 'string' ? message.text : String(message.text || '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded-lg ${message.sender === 'user'
          ? 'bg-blue-500 text-white ml-auto'
          : 'bg-gray-100 text-gray-800'
        } max-w-[80%] relative group`}
    >
      <div className="pr-6">
        {message.sender === 'bot' ? (
          <ReactMarkdown>{safeText}</ReactMarkdown>
        ) : (
          <p>{safeText}</p>
        )}
      </div>
      {onDelete && (
        <motion.button
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute top-1 right-1 p-1 text-xs opacity-0 group-hover:opacity-100"
          onClick={() => onDelete(message.id)}
        >
          <Delete fontSize="small" className={message.sender === 'user' ? 'text-white' : 'text-gray-500'} />
        </motion.button>
      )}
    </motion.div>
  );
};
// http://127.0.0.1:8000 Local
// https://gcp-gencal-devpost.onrender.com/orchestrate Production
async function callOrchestrator(message, history = []) {
  try {
    const response = await fetch('https://gcp-gencal-devpost.onrender.com/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        context: { history }
      }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.responses;
  } catch (error) {
    console.error("Failed to call orchestrator:", error);
    return null;
  }
}


const ChatPanel = () => {
  const [userId] = useState('anonymous');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      const chatRef = collection(db, 'chats', userId, 'messages');
      const snapshot = await getDocs(chatRef);
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    };
    fetchMessages();
  }, [userId]);
  

  const handleSend = async () => {
    if (input.trim()) {
      const newMessage = {
        id: Date.now(),
        text: input,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      await addDoc(collection(db, 'chats', userId, 'messages'), newMessage);
      setInput('');
      setLoading(true);
      try {
        const botText = await callOrchestrator(newMessage.text, [...messages, newMessage]);
        const aiResponse = {
          id: Date.now() + 1,
          text: botText || 'Sorry, I could not get a response.',
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
        await addDoc(collection(db, 'chats', userId, 'messages'), aiResponse);
      } catch (err) {
        setMessages(prev => [...prev, {
          id: Date.now() + 2,
          text: 'Error: Could not reach the assistant API.',
          sender: 'bot',
          timestamp: new Date()
        }]);
      }
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteMessage = (messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const handleClearChat = async () => {
    const querySnapshot = await getDocs(collection(db, 'chats', userId, 'messages'));
    const deletions = querySnapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, 'chats', userId, 'messages', docSnap.id))
    );
    await Promise.all(deletions);
    setMessages([]);
    setIsSettingsOpen(false);
  };
  

  return (
    <div className="w-80 bg-white shadow-lg border-l flex flex-col h-screen">
      {/* Header */}
      {window.location.hostname !== 'localhost' && (
        <div className="bg-yellow-100 text-yellow-800 text-sm px-4 py-2 border-b border-yellow-300">
          ⚠️ This hosted demo may take up to a minute to respond. To run locally for faster replies, follow {" "}
          <a
            href="https://github.com/ManojBaasha/gcp-gencal-devpost"
            className="underline text-blue-600 hover:text-blue-800"
            target="_blank"
            rel="noopener noreferrer"
          >
            this
          </a>
        </div>
      )}

      <div className="flex justify-between items-center p-3 border-b bg-gray-50">
        <div className="flex items-center">
          <ChatBubble className="text-blue-500 mr-2" />
          <h2 className="text-lg font-semibold">AI Assistant</h2>
        </div>
        <div className="flex items-center space-x-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-1 hover:bg-gray-200 rounded-full"
          >
            <Settings fontSize="small" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-gray-200 rounded-full"
          >
            {isMinimized ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </motion.button>
        </div>
      </div>

      {/* Settings Dropdown */}
      <AnimatePresence>
        {isSettingsOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b"
          >
            <div className="p-4 bg-gray-50">
              <button
                onClick={handleClearChat}
                className="flex items-center space-x-2 text-red-500 hover:text-red-600"
              >
                <Delete fontSize="small" />
                <span>Clear Chat History</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <Message
              key={msg.id}
              message={msg}
              onDelete={handleDeleteMessage}
            />
          ))}
          {loading && (
            <div className="text-xs text-gray-400 italic">AI Assistant is typing...</div>
          )}
        </div>
      )}

      {/* Input Area */}
      {!isMinimized && (
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
              disabled={loading}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
              disabled={loading}
            >
              <Send />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel; 