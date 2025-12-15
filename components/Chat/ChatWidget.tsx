import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { getAIChatResponse } from '../../services/geminiService';
import { UserRole } from '../../types';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatWidgetProps {
  userRole: UserRole;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: `Olá! Sou seu assistente Já vai. Como posso ajudar você hoje?`, sender: 'ai', timestamp: new Date() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Call Gemini API
    const context = userRole === UserRole.DRIVER 
      ? "Você está ajudando um motorista no app Já vai. Ajude com dúvidas sobre ganhos, dicas de navegação ou problemas no app. Responda em Português."
      : "Você está ajudando um passageiro. Ajude com reservas, preços ou itens perdidos. Responda em Português.";

    const responseText = await getAIChatResponse(userMsg.text, context);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      text: responseText,
      sender: 'ai',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-brand-accent text-white rounded-full shadow-lg hover:bg-blue-700 transition-all z-50 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-100 max-h-[500px]">
          {/* Header */}
          <div className="bg-brand-accent p-4 text-white flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare size={18} /> Suporte Já vai
            </h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3 h-80">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  msg.sender === 'user'
                    ? 'bg-black text-white self-end ml-auto rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-200 self-start rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div className="bg-white border border-gray-200 self-start p-3 rounded-lg rounded-bl-none">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua dúvida..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
            />
            <button 
              onClick={handleSend}
              disabled={!inputText.trim() || isTyping}
              className="p-2 bg-brand-accent text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};