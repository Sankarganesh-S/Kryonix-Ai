import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { setModel, setTheme } from "../store/uiSlice";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "/api";
const MODEL_OPTIONS = [
  { label: "Qwen 2.5 1.5B — Fast", value: "qwen2.5:1.5b" },
  { label: "Llama 3.1 8B — Quality", value: "llama3.1:8b" },
  { label: "LLaVA 7B — Vision", value: "llava:7b" },
  { label: "Mistral 7B — Balanced", value: "mistral:7b" },
];
const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const newChat = () => ({
  id: uid(),
  dbId: null,
  title: "New Chat",
  messages: [],
  loaded: true,
});
const isMobile = () => window.innerWidth <= 768;

export default function ChatPage() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([newChat()]);
  const [activeId, setActiveId] = useState(chats[0].id);
  const [loadingByChat, setLoadingByChat] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile());
  const dispatch = useDispatch();
  const { model, theme } = useSelector((state) => state.ui);
  const controllerByChat = useRef({});
  const activeRef = useRef(null);

  const { data: savedChats } = useQuery({
    queryKey: ["chat-history", token],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await fetch(`${API}/chat/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Could not load chat history");
      const data = await response.json();
      return data.chats || [];
    },
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    const onResize = () => {
      if (isMobile()) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
        if (!savedChats?.length) return;
        const loaded = savedChats.map((c) => ({
          id: uid(),
          dbId: c.id,
          title: c.title || "Chat",
          messages: [],
          loaded: false,
        }));
        setChats((prev) =>
          prev[0].messages.length === 0
            ? [prev[0], ...loaded]
            : [newChat(), ...loaded],
        );
  }, [savedChats]);

  useEffect(() => {
    const chat = chats.find((c) => c.id === activeId);
    if (!chat || !chat.dbId || chat.loaded) return;
    fetch(`${API}/chat/history/${chat.dbId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setChats((prev) =>
          prev.map((c) =>
            c.id !== activeId
              ? c
              : {
                  ...c,
                  loaded: true,
                  messages: (d.messages || []).map((m) => ({
                    ...m,
                    id: uid(),
                  })),
                },
          ),
        );
      })
      .catch(() => {});
  }, [activeId]);

  const activeChat = chats.find((c) => c.id === activeId);
  const activeLoading = Boolean(loadingByChat[activeId]);
  activeRef.current = activeChat;

  const setChatLoading = (chatId, isLoading) => {
    setLoadingByChat((prev) => {
      const next = { ...prev };
      if (isLoading) next[chatId] = true;
      else delete next[chatId];
      return next;
    });
  };

  const startNewChat = () => {
    const c = newChat();
    setChats((p) => [c, ...p]);
    setActiveId(c.id);
  };

  const deleteChat = useCallback(
    (id) => {
      const c = chats.find((x) => x.id === id);
      if (c?.dbId && token)
        fetch(`${API}/chat/history/${c.dbId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      setChats((prev) => {
        const next = prev.filter((x) => x.id !== id);
        if (!next.length) {
          const nc = newChat();
          setActiveId(nc.id);
          return [nc];
        }
        if (activeId === id) setActiveId(next[0].id);
        return next;
      });
    },
    [activeId, chats, token],
  );

  const pinChat = useCallback(
    async (id) => {
      const c = chats.find((x) => x.id === id);
      if (!c?.dbId) return;
      const r = await fetch(`${API}/chat/history/${c.dbId}/pin`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      setChats((prev) =>
        prev.map((x) => (x.id === id ? { ...x, title: d.title } : x)),
      );
    },
    [chats, token],
  );

  const patchAssistant = (chatId, asstId, changes) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id !== chatId
          ? c
          : {
              ...c,
              messages: c.messages.map((m) =>
                m.id !== asstId ? m : { ...m, ...changes },
              ),
            },
      ),
    );
  };

  const addMessages = (chatId, userMsg, asstId) => {
    const placeholder = {
      id: asstId,
      role: "assistant",
      content: "",
      streaming: true,
    };
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== chatId) return c;
        const title =
          c.title === "New Chat" && !c.messages.length
            ? (userMsg.content || "File").slice(0, 40)
            : c.title;
        return { ...c, title, messages: [...c.messages, userMsg, placeholder] };
      }),
    );
    setChatLoading(chatId, true);
  };

  const refreshHistory = () => {
    fetch(`${API}/chat/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.chats?.length) return;
        setChats((prev) =>
          prev.map((c) =>
            c.id === activeId ? { ...c, dbId: d.chats[0].id } : c,
          ),
        );
      })
      .catch(() => {});
  };

  const handleUpload = useCallback(
    async (message, file) => {
      const current = activeRef.current;
      if (!current || activeLoading) return;
      const userMsg = {
        id: uid(),
        role: "user",
        content: `📎 **${file.name}**\n${message}`,
        file: file.name,
      };
      const asstId = uid();
      addMessages(current.id, userMsg, asstId);
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("message", message);
        fd.append("model", model);
        fd.append("chat_id", current?.dbId || "");
        fd.append(
          "history",
          JSON.stringify(
            (current?.messages || [])
              .slice(-6)
              .map((m) => ({
                role: m.role,
                content: String(m.content || "").slice(0, 600),
              })),
          ),
        );
        const res = await fetch(`${API}/chat/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json();
        patchAssistant(current.id, asstId, {
          content: data.response || "⚠️ No response",
          streaming: false,
          error: !!data.error,
        });
        if (!current?.dbId) refreshHistory();
      } catch {
        patchAssistant(current.id, asstId, {
          content: "⚠️ Upload failed.",
          streaming: false,
          error: true,
        });
      } finally {
        if (current?.id) setChatLoading(current.id, false);
      }
    },
    [activeLoading, model, token],
  );

  const sendMessage = useCallback(
    async (text, enableSearch = false) => {
      const trimmed = text?.trim();
      if (!trimmed || activeLoading) return;
      const current = activeRef.current;
      let targetChat = current;

      if (current?.messages?.length) {
        const nextChat = newChat();
        setChats((prev) => [nextChat, ...prev]);
        setActiveId(nextChat.id);
        targetChat = nextChat;
      }
      if (!targetChat?.id) return;

      const history = (targetChat?.messages || [])
        .filter((m) => !m.streaming && !m.error)
        .slice(-6)
        .map((m) => ({
          role: m.role,
          content: String(m.content || "").slice(0, 600),
        }));
      const userMsg = { id: uid(), role: "user", content: trimmed };
      const asstId = uid();
      addMessages(targetChat.id, userMsg, asstId);
      const ctrl = new AbortController();
      controllerByChat.current[targetChat.id] = ctrl;
      let full = "",
        lastUpdate = 0;
      try {
        const res = await fetch(`${API}/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: trimmed,
            history,
            model,
            chat_id: targetChat?.dbId || null,
            enable_search: enableSearch,
          }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          throw new Error(errText || `Stream failed (${res.status})`);
        }
        if (!res.body) {
          throw new Error("Stream failed: no body available");
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += dec.decode(value, { stream: true }).replace(/\u0000/g, "");
          const now = Date.now();
          if (now - lastUpdate > 30) {
            patchAssistant(targetChat.id, asstId, {
              content: full,
              streaming: true,
            });
            lastUpdate = now;
          }
        }
        full += dec.decode().replace(/\u0000/g, "");
        patchAssistant(targetChat.id, asstId, {
          content: full.trim() || "…",
          streaming: false,
        });
        if (!current?.dbId) refreshHistory();
      } catch (err) {
        if (err.name === "AbortError") {
          patchAssistant(targetChat.id, asstId, {
            content: full.trim() || "Stopped.",
            streaming: false,
            stopped: true,
          });
        } else {
          const msg = err.message || "Unknown error";
          if (msg.includes("Invalid or expired token")) {
            logout();
            navigate("/login");
          }
          patchAssistant(targetChat.id, asstId, {
            content: `⚠️ Something went wrong. ${msg}`,
            streaming: false,
            error: true,
          });
        }
      } finally {
        setChatLoading(targetChat.id, false);
        if (controllerByChat.current[targetChat.id] === ctrl) {
          delete controllerByChat.current[targetChat.id];
        }
      }
    },
    [activeId, activeLoading, model, token],
  );

  const stopGen = useCallback(() => {
    if (!activeId) return;
    controllerByChat.current[activeId]?.abort();
  }, [activeId]);
  const regenerate = useCallback(
    async (msgId) => {
      const chat = chats.find((c) => c.id === activeId);
      if (!chat) return;
      const idx = chat.messages.findIndex((m) => m.id === msgId);
      if (idx <= 0) return;
      const prev = chat.messages[idx - 1];
      if (prev?.role === "user") await sendMessage(prev.content);
    },
    [activeId, chats, sendMessage],
  );

  return (
    <div className="shell">
      <Sidebar
        chats={chats}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={startNewChat}
        onDelete={deleteChat}
        onPin={pinChat}
        user={user}
        navigate={navigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <ChatWindow
        chat={activeChat}
        loading={activeLoading}
        onSend={sendMessage}
        onStop={stopGen}
        onUpload={handleUpload}
        onRegenerate={regenerate}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((p) => !p)}
        model={model}
        onModel={(value) => dispatch(setModel(value))}
        modelOptions={MODEL_OPTIONS}
        theme={theme}
        onTheme={() => dispatch(setTheme(theme === "dark" ? "light" : "dark"))}
      />
    </div>
  );
}
