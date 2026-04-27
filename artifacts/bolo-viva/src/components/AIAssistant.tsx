import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, SmilePlus } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import { useAppContext } from "@/context/AppContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { STATIC_ACTIVITIES } from "@/data/activities";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS_EN = [
  "What should I do in Bologna today?",
  "Where should I eat tonight?",
  "Help me plan my day",
  "What are Bologna's hidden gems?",
];

const SUGGESTIONS_IT = [
  "Cosa fare oggi a Bologna?",
  "Dove mangio stasera?",
  "Aiutami a pianificare la giornata",
  "Dimmi i posti nascosti di Bologna",
];

export default function AIAssistant() {
  const { lang } = useLang();
  const { savedItems } = useAppContext();
  const { profile } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = lang === "it" ? SUGGESTIONS_IT : SUGGESTIONS_EN;

  const greeting =
    lang === "it"
      ? "Ciao! Sono Bolo 🍝 La tua guida personale a Bologna. Come posso aiutarti oggi?"
      : "Hey! I'm Bolo 🍝 Your personal Bologna guide. How can I help you today?";

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const newMessages: Message[] = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const context = {
        profile: {
          travelStyle: profile.travelStyle,
          interests: profile.interests,
        },
        activities: STATIC_ACTIVITIES.map((a) => ({
          id: a.id,
          title: a.title,
          type: a.type,
          category: a.category,
        })),
        savedItems: savedItems.map((i) => ({ id: i.id, title: i.title })),
      };

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, context, lang }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
      } else {
        throw new Error("no message");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            lang === "it"
              ? "Mi dispiace, qualcosa è andato storto. Riprova!"
              : "Sorry, something went wrong. Please try again!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-[76px] right-4 z-[300] w-13 h-13 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors active:scale-95"
            style={{ width: 52, height: 52 }}
            aria-label={lang === "it" ? "Apri assistente Bolo" : "Open Bolo assistant"}
          >
            <SmilePlus className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[350] bg-black/30 backdrop-blur-[1px]"
            />

            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-[400] bg-white rounded-t-3xl shadow-2xl border-t border-border flex flex-col"
              style={{ maxHeight: "75vh" }}
            >
              <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-1 shrink-0" />

              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                    B
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-tight">Bolo</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {lang === "it" ? "Guida AI di Bologna" : "AI Bologna Guide"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
                <BubbleAssistant text={greeting} />

                {messages.length === 0 && (
                  <div className="flex flex-wrap gap-2 pl-8">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-xs bg-primary/5 border border-primary/20 text-primary px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {messages.map((msg, i) =>
                  msg.role === "assistant" ? (
                    <BubbleAssistant key={i} text={msg.content} />
                  ) : (
                    <BubbleUser key={i} text={msg.content} />
                  )
                )}

                {loading && <TypingIndicator />}

                <div ref={bottomRef} />
              </div>

              <div className="px-4 pb-5 pt-2 border-t border-border shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      lang === "it" ? "Chiedi a Bolo..." : "Ask Bolo..."
                    }
                    className="flex-1 text-sm bg-muted border border-border rounded-full px-4 py-2.5 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 shrink-0 transition-all active:scale-95"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function BubbleAssistant({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 items-end"
    >
      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary mb-0.5">
        B
      </div>
      <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2 max-w-[82%]">
        <p className="text-sm text-foreground leading-relaxed">{text}</p>
      </div>
    </motion.div>
  );
}

function BubbleUser({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-end"
    >
      <div className="bg-primary text-white rounded-2xl rounded-br-sm px-3 py-2 max-w-[82%]">
        <p className="text-sm leading-relaxed">{text}</p>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 items-end">
      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary mb-0.5">
        B
      </div>
      <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2.5">
        <div className="flex gap-1 items-center">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
