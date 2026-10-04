import React, { useState, useRef, useEffect } from 'react';
import { Send, BookOpen, Bot, User, RotateCcw, AlertCircle } from 'lucide-react';
import { Language, i18n } from '../i18n';
import { callTutorApi } from '../services/api';
import { MarkdownView } from './MarkdownView';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

interface LearnScreenProps {
  language: Language;
  isOnline: boolean;
}

export const LearnScreen: React.FC<LearnScreenProps> = ({ language, isOnline }) => {
  const t = i18n[language];
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text:
        language === 'hi'
          ? 'नमस्ते! मैं **बिन साथी** ट्यूटर हूँ। आप परिसर में ठोस अपशिष्ट नियम 2026, ई-कचरा, बैटरी या रीसाइक्लिंग से संबंधित कोई भी सवाल पूछ सकते हैं।'
          : "Hello! I am your **Bin Saathi** waste tutor. Ask me anything about IIT Roorkee campus segregation, SWM Rules 2026, e-waste, batteries, or recycling.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [lastQuery, setLastQuery] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickPrompts = [
    t.tutorPrompt1,
    t.tutorPrompt2,
    t.tutorPrompt3,
    t.tutorPrompt4,
  ];

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    if (!isOnline) {
      setErrorMessage(t.tutorOfflineNotice);
      return;
    }

    setErrorMessage(null);
    setIsQuotaError(false);
    setInput('');
    setLastQuery(query);

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Map prior conversation turns
      const history = newMessages.slice(1, -1).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await callTutorApi({
        message: query,
        history,
        lang: language,
      });

      if (res.isQuotaError) {
        setIsQuotaError(true);
        setErrorMessage(t.quotaLimitReached);
        setIsLoading(false);
        return;
      }

      if (res.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
        return;
      }

      const botReply = res.reply || (language === 'hi' ? 'कोई उत्तर उपलब्ध नहीं है।' : 'No answer available.');
      const botMsg: Message = {
        id: `m_${Date.now()}`,
        role: 'model',
        text: botReply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setErrorMessage(t.aiBusyError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryLast = () => {
    if (lastQuery) {
      handleSend(lastQuery);
    }
  };

  return (
    <div className="w-full max-w-3xl lg:max-w-4xl mx-auto flex flex-col h-[calc(100dvh-170px)] sm:h-[calc(100vh-190px)] md:h-[calc(100vh-210px)] max-h-[850px] pb-2 pt-1">
      {/* Header Info */}
      <div className="rounded-xl border border-[#E6E5E0] bg-white p-3.5 sm:p-4 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-[#2F3E46]" />
          <div>
            <h2 className="text-xs sm:text-sm font-semibold text-[#1C1C1A]">{t.tutorTitle}</h2>
            <p className="text-[11px] sm:text-xs text-[#6B6B66]">{t.tutorSubtitle}</p>
          </div>
        </div>
        <p className="mt-1.5 text-[10px] sm:text-xs text-[#6B6B66] leading-relaxed border-t border-[#E6E5E0]/60 pt-2">
          {t.tutorDisclaimer}
        </p>
      </div>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs sm:text-sm text-amber-900">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" />
          <span>{t.tutorOfflineNotice}</span>
        </div>
      )}

      {/* Error Banner with quiet "Try again" button (Requirement 4) */}
      {errorMessage && (
        <div className="mt-2.5 flex items-center justify-between gap-2.5 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs sm:text-sm text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-amber-700" />
            <span>{errorMessage}</span>
          </div>
          {lastQuery && !isQuotaError && isOnline && (
            <button
              type="button"
              onClick={handleRetryLast}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-[#2F3E46]/30 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-[#2F3E46] shadow-2xs hover:bg-neutral-50 active:scale-95 disabled:opacity-50 shrink-0 min-h-[40px] cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t.tryAgain}</span>
            </button>
          )}
        </div>
      )}

      {/* Conversation Thread */}
      <div className="mt-3 flex-1 overflow-y-auto space-y-3 px-1 scrollbar-thin">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full text-xs ${
                  isUser
                    ? 'bg-[#2F3E46] text-white'
                    : 'border border-[#E6E5E0] bg-white text-[#2F3E46]'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`max-w-[88%] sm:max-w-[80%] md:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                  isUser
                    ? 'bg-[#2F3E46] text-white rounded-tr-xs'
                    : 'border border-[#E6E5E0] bg-white text-[#1C1C1A] rounded-tl-xs'
                }`}
              >
                {isUser ? (
                  <span>{msg.text}</span>
                ) : (
                  <MarkdownView content={msg.text} />
                )}
              </div>
            </div>
          );
        })}

        {/* Small "Thinking..." state while retrying/loading (Requirement 6) */}
        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border border-[#E6E5E0] bg-white text-[#2F3E46]">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-xs border border-[#E6E5E0] bg-white px-4 py-3 text-xs sm:text-sm text-[#6B6B66] shadow-2xs">
              <div className="h-2 w-2 animate-ping rounded-full bg-[#2F3E46]" />
              <span className="font-medium text-[#2F3E46]">{t.tutorThinking}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length <= 3 && (
        <div className="mt-3 space-y-1.5">
          <span className="text-[10px] sm:text-xs font-semibold text-[#6B6B66] uppercase tracking-wider">
            {t.tutorQuickPrompts}:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-1">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={isLoading || !isOnline}
                className="flex items-center rounded-xl border border-[#E6E5E0] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#1C1C1A] shadow-2xs hover:bg-neutral-50 active:scale-95 disabled:opacity-50 text-left min-h-[44px] cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Input Field (Disabled during retries/loading - Requirement 6) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-3 flex items-center gap-2 rounded-2xl border border-[#E6E5E0] bg-white p-2 shadow-2xs min-h-[56px]"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.tutorPlaceholder}
          disabled={isLoading || !isOnline}
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-[#1C1C1A] placeholder-[#6B6B66] outline-none disabled:opacity-50 min-h-[44px]"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading || !isOnline}
          className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-[#2F3E46] text-white transition hover:bg-[#253238] active:scale-95 disabled:opacity-40 cursor-pointer shrink-0"
          aria-label={t.tutorAskBtn}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

