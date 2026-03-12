import { useState, useRef, useEffect } from "react";
import { Bot, Send, Image as ImageIcon, X, Trash2, Camera, UploadCloud } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AiLoading } from "@/components/ui/ai-loading";

type Message = {
    id: string;
    text: string;
    sender: "user" | "ai";
    ts: Date;
    image?: string; // base64 image data
};

type ChatSession = {
    id: string;
    title: string;
    updatedAt: Date;
    messages: Message[];
};

export default function KisanSahayakPage() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    const [input, setInput] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initialize first chat or load from localStorage (frontend-only persistence)
    useEffect(() => {
        const saved = localStorage.getItem("gqa:kisanChats");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Revive dates
                parsed.forEach((s: any) => {
                    s.updatedAt = new Date(s.updatedAt);
                    s.messages.forEach((m: any) => m.ts = new Date(m.ts));
                });
                setSessions(parsed);
                if (parsed.length > 0) {
                    setActiveSessionId(parsed[0].id);
                }
            } catch (e) {
                // ignore parse error
            }
        } else {
            handleNewChat();
        }
    }, []);

    // Save to localStorage when sessions change
    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem("gqa:kisanChats", JSON.stringify(sessions));
        }
    }, [sessions]);

    // Scroll to bottom when messages change
    const activeSession = sessions.find((s) => s.id === activeSessionId);
    const messages = activeSession?.messages || [];

    useEffect(() => {
        if (scrollRef.current) {
            // Small timeout to allow render
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 50);
        }
    }, [messages, isTyping, activeSessionId]);

    const handleNewChat = () => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: "Nai Baat-Cheet (New Chat)",
            updatedAt: new Date(),
            messages: [
                {
                    id: Date.now().toString() + "-ai",
                    text: "Namaste! Main aapka Kisan Sahayak hoon. Fasal me koi bimari ya sukhapan dikhai de raha hai? Photo upload karein ya apna sawaal poochein, main zaroor madad karunga.",
                    sender: "ai",
                    ts: new Date(),
                },
            ],
        };
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setSelectedImage(null);
    };

    const deleteSession = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (activeSessionId === id) {
            const remaining = sessions.filter((s) => s.id !== id);
            if (remaining.length > 0) {
                setActiveSessionId(remaining[0].id);
            } else {
                handleNewChat();
            }
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setSelectedImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSend = async () => {
        if (!input.trim() && !selectedImage) return;
        if (!activeSessionId) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: input,
            sender: "user",
            ts: new Date(),
            image: selectedImage || undefined,
        };

        const currentImage = selectedImage; // save reference for API call

        // Add user message to active session
        setSessions((prev) =>
            prev.map((s) => {
                if (s.id === activeSessionId) {
                    return {
                        ...s,
                        updatedAt: new Date(),
                        // Set dynamic title based on first real message
                        title: s.messages.length === 1 && input ? (input.slice(0, 25) + (input.length > 25 ? "..." : "")) : s.title,
                        messages: [...s.messages, userMsg]
                    };
                }
                return s;
            })
        );

        setInput("");
        setSelectedImage(null);
        setIsTyping(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

            // We will still try to hit the backend chat endpoint
            const response = await fetch(`${apiUrl}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input, image: currentImage }), // Optional image passing
            });

            if (!response.ok) throw new Error("API Error");
            const data = await response.json();

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: data.response || "Mafi chahta hoon, mujhe aapki baat samajh nahi aayi.",
                sender: "ai",
                ts: new Date(),
            };

            setSessions((prev) =>
                prev.map((s) => {
                    if (s.id === activeSessionId) {
                        return { ...s, messages: [...s.messages, aiMsg], updatedAt: new Date() };
                    }
                    return s;
                })
            );
        } catch (error) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "Mafi chahta hoon, abhi server se connect karne mein pareshani ho rahi hai. Kripya thodi der baad koshish karein.",
                sender: "ai",
                ts: new Date(),
            };
            setSessions((prev) =>
                prev.map((s) => {
                    if (s.id === activeSessionId) {
                        return { ...s, messages: [...s.messages, errorMsg] };
                    }
                    return s;
                })
            );
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex h-full flex-col lg:flex-row gap-4">
            {/* Sidebar - History */}
            <Card className="card-premium flex h-[300px] lg:h-[calc(100vh-120px)] w-full lg:w-[280px] shrink-0 flex-col overflow-hidden rounded-3xl border bg-card/60">
                <div className="p-4 border-b">
                    <Button onClick={handleNewChat} className="w-full rounded-2xl gap-2 font-semibold">
                        <Bot className="size-4" />
                        Nayi Baat-cheet
                    </Button>
                </div>
                <ScrollArea className="flex-1 px-3 py-3">
                    <div className="space-y-2">
                        {sessions.map((s) => (
                            <div
                                key={s.id}
                                onClick={() => setActiveSessionId(s.id)}
                                className={cn(
                                    "group flex cursor-pointer items-center justify-between rounded-2xl px-3 py-3 text-sm transition-colors",
                                    activeSessionId === s.id
                                        ? "bg-primary/10 text-primary font-medium dark:bg-primary/20"
                                        : "hover:bg-foreground/5 text-muted-foreground"
                                )}
                            >
                                <div className="min-w-0 pr-2">
                                    <div className="truncate">{s.title}</div>
                                    <div className="text-[10px] opacity-70 mt-1">
                                        {s.updatedAt.toLocaleDateString([], { month: "short", day: "numeric" })}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-500"
                                    onClick={(e) => deleteSession(e, s.id)}
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </Card>

            {/* Main Chat Area */}
            <Card className="card-premium flex flex-1 h-[600px] lg:h-[calc(100vh-120px)] flex-col overflow-hidden rounded-3xl border bg-card/90">
                {/* Chat Header */}
                <div className="flex items-center gap-3 border-b bg-muted/30 px-6 py-4 backdrop-blur-md">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Bot className="size-5" />
                    </div>
                    <div>
                        <h1 className="font-display text-lg font-semibold tracking-[-0.01em]">किसान सहायक (Kisan Sahayak)</h1>
                        <p className="text-xs text-muted-foreground">Ask in Hindi or English</p>
                    </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4 lg:p-6" viewportRef={scrollRef}>
                    <div className="space-y-6 max-w-3xl mx-auto pb-4">
                        {activeSession?.messages.map((m) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={m.id}
                                className={cn(
                                    "flex w-full",
                                    m.sender === "user" ? "justify-end" : "justify-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "flex max-w-[85%] lg:max-w-[75%] gap-3",
                                        m.sender === "user" ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "flex size-8 shrink-0 items-center justify-center rounded-2xl mt-1",
                                            m.sender === "user"
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        )}
                                    >
                                        {m.sender === "user" ? <span className="text-xs font-semibold">ME</span> : <Bot className="size-4" />}
                                    </div>

                                    <div className="flex flex-col gap-2 min-w-0">
                                        <div
                                            className={cn(
                                                "rounded-2xl px-5 py-3 text-[15px] leading-relaxed shadow-sm",
                                                m.sender === "user"
                                                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                                                    : "bg-background border rounded-tl-sm text-foreground"
                                            )}
                                        >
                                            {m.image && (
                                                <div className="mb-3 overflow-hidden rounded-xl border bg-background/50">
                                                    <img src={m.image} alt="Uploaded crop" className="max-h-60 w-auto object-cover" />
                                                </div>
                                            )}

                                            {m.text && (
                                                <div className="whitespace-pre-wrap break-words">{m.text}</div>
                                            )}
                                        </div>
                                        <span
                                            className={cn(
                                                "text-[10px] text-muted-foreground font-medium px-1",
                                                m.sender === "user" ? "text-right" : "text-left"
                                            )}
                                        >
                                            {m.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {isTyping && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                <div className="flex max-w-[80%] gap-3">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-2xl mt-1 bg-emerald-500/10 text-emerald-600">
                                        <Bot className="size-4" />
                                    </div>
                                    <div className="rounded-2xl bg-background border rounded-tl-sm px-5 py-4">
                                        <AiLoading lines={1} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t bg-background/50 p-4 backdrop-blur-md">
                    <div className="mx-auto max-w-3xl">
                        {/* Image Preview Area */}
                        <AnimatePresence>
                            {selectedImage && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    className="flex items-center gap-3 overflow-hidden"
                                >
                                    <div className="relative inline-block">
                                        <div className="h-16 w-16 overflow-hidden rounded-xl border shadow-sm">
                                            <img src={selectedImage} alt="Preview" className="h-full w-full object-cover" />
                                        </div>
                                        <button
                                            onClick={() => setSelectedImage(null)}
                                            className="absolute -right-2 -top-2 rounded-full border bg-background p-1 text-muted-foreground shadow-sm hover:text-rose-500"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium">Image attached for analysis</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input Box */}
                        <div className="flex items-end gap-2">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-[52px] w-[52px] shrink-0 rounded-2xl border-dashed hover:border-primary hover:text-primary transition-colors bg-background/50"
                                onClick={() => fileInputRef.current?.click()}
                                title="Upload Crop Photo"
                            >
                                <Camera className="size-5" />
                            </Button>

                            <div className="relative flex-1">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    disabled={isTyping}
                                    placeholder="Apne fasal ki samasya batayein..."
                                    className="h-[52px] w-full rounded-2xl bg-background/80 pr-14 text-[15px] shadow-sm"
                                />
                                <Button
                                    size="icon"
                                    className="absolute right-1.5 top-1.5 h-10 w-10 shrink-0 rounded-xl"
                                    onClick={handleSend}
                                    disabled={isTyping || (!input.trim() && !selectedImage)}
                                >
                                    <Send className="size-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="mt-3 text-center text-[10px] text-muted-foreground max-w-md mx-auto">
                            AI dawara diye gaye sujhaav ko apne anubhav se jaanchen. Gambhir bimari me krishi visheshagya se sampark karein.
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
