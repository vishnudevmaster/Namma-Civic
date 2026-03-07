import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Mic, Volume2, Search, Loader2, Phone, AlertCircle } from 'lucide-react';

// Gracefully handle missing API key - the chatbot will work in offline mode
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let ai: any = null;
if (GEMINI_API_KEY) {
  import('@google/genai').then(({ GoogleGenAI }) => {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }).catch(() => {
    console.warn('Google GenAI SDK not available');
  });
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string; isSearch?: boolean }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      if (!ai) {
        // Offline mode — provide helpful local responses
        const offlineResponse = getOfflineResponse(userMsg);
        setMessages(prev => [...prev, { role: 'model', text: offlineResponse }]);
        setIsLoading(false);
        return;
      }

      const contents = [
        ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        { role: 'user', parts: [{ text: userMsg }] },
      ];

      const config: any = {
        systemInstruction:
          'You are a helpful civic assistant for Namma Bengaluru (NammaCivic platform). Help citizens with their queries about city services, reporting issues like potholes / garbage / water / streetlights / drainage / traffic, tracking complaint status, and general information about Bengaluru civic services. Be concise, friendly, and helpful.',
      };

      if (useSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: contents as any,
        config,
      });

      const responseText = response.text || 'No response received.';
      setMessages(prev => [...prev, { role: 'model', text: responseText, isSearch: useSearch }]);
    } catch (error: any) {
      console.error('Chat error:', error);
      
      const offlineFallback = getOfflineResponse(userMsg);
      setMessages(prev => [...prev, { role: 'model', text: offlineFallback }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getOfflineResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('pothole') || q.includes('road'))
      return '🕳️ To report a pothole, go to the "Report Issue" page, select "Pothole" as the category, and provide the location and a photo if possible. Your complaint will be tracked with a unique ID.';
    if (q.includes('garbage') || q.includes('waste') || q.includes('dump'))
      return '🗑️ Garbage issues can be reported through the "Report Issue" page. Select "Garbage" category, pin your location, and describe the problem. BBMP usually responds within 48 hours.';
    if (q.includes('water') || q.includes('bwssb'))
      return '💧 For water supply issues, report it on our platform or contact BWSSB helpline: 1916. Select "Water" category when filing your complaint.';
    if (q.includes('streetlight') || q.includes('light'))
      return '💡 Broken streetlights can be reported under the "Streetlight" category. Include the exact location and nearest landmark for quicker resolution.';
    if (q.includes('track') || q.includes('status') || q.includes('complaint'))
      return '📊 You can track your complaint status on the "My Complaints" page. Each complaint has a unique ID (e.g., NC-2026-00042) and follows a clear status flow: Submitted → Under Review → Assigned → In Progress → Resolved → Closed.';
    if (q.includes('bbmp') || q.includes('helpline') || q.includes('contact'))
      return '📞 Key helplines:\n• BBMP: 080-22660000\n• BWSSB (Water): 1916\n• BESCOM (Electricity): 1912\n• Traffic Police: 103\n• Emergency: 112';
    return '👋 I\'m your NammaCivic assistant! I can help you with:\n\n• Reporting civic issues (potholes, garbage, water, etc.)\n• Tracking complaint status\n• BBMP/BWSSB contact info\n• Understanding the complaint process\n\nWhat would you like to know?';
  };

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full shadow-lg shadow-emerald-200/50 flex items-center justify-center hover:shadow-xl hover:scale-105 transition-all z-40 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-[calc(100vw-2rem)] md:w-96 h-[480px] bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-sm">NammaCivic Assistant</span>
                  <p className="text-[10px] text-emerald-100">
                    {ai ? 'Powered by Gemini AI' : 'Offline Mode'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-emerald-100 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* No API Key Notice */}
            {!ai && (
              <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2 shrink-0">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <p className="text-[10px] text-amber-700">Running in offline mode. Set VITE_GEMINI_API_KEY for AI responses.</p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50">
              {messages.length === 0 && (
                <div className="text-center text-stone-500 text-sm mt-6 space-y-2">
                  <div className="text-3xl">🏙️</div>
                  <p className="font-medium">Hi! I'm your civic assistant.</p>
                  <p className="text-xs text-stone-400">Ask me about reporting issues, tracking complaints, or city services.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-sm'
                        : 'bg-white border border-stone-200 text-stone-800 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    {msg.isSearch && (
                      <div className="mt-1.5 pt-1.5 border-t border-stone-100">
                        <span className="text-[9px] text-stone-400 flex items-center gap-1">
                          <Search className="w-2.5 h-2.5" /> Search Grounded
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-sm p-3 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-stone-100 shrink-0">
              {ai && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <label className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useSearch}
                      onChange={(e) => setUseSearch(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3 h-3"
                    />
                    <Search className="w-3 h-3" /> Web Search
                  </label>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about civic services..."
                  className="flex-1 bg-stone-100 rounded-full px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-200 transition-all outline-none border border-transparent focus:border-emerald-300"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center hover:shadow-md disabled:opacity-50 transition-all shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
