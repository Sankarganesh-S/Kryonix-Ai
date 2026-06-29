import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const MODEL_OPTIONS = [
  { label: 'Qwen 2.5 1.5B — Fast', value: 'qwen2.5:1.5b' },
  { label: 'Llama 3.1 8B — Quality', value: 'llama3.1:8b' },
  { label: 'LLaVA 7B — Vision', value: 'llava:7b' },
  { label: 'Mistral 7B — Balanced', value: 'mistral:7b' },
]
const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
const newChat = () => ({ id: uid(), dbId: null, title: 'New Chat', messages: [], loaded: true })
const isMobile = () => window.innerWidth <= 768

export default function ChatPage() {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [chats, setChats] = useState([newChat()])
  const [activeId, setActiveId] = useState(chats[0].id)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile())
  const [model, setModel] = useState(() => localStorage.getItem('kryonix_model') || 'qwen2.5:1.5b')
  const [theme, setTheme] = useState(() => localStorage.getItem('kryonix_theme') || 'dark')
  const ctrlRef = useRef(null)
  const activeRef = useRef(null)

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('kryonix_theme', theme) }, [theme])
  useEffect(() => { localStorage.setItem('kryonix_model', model) }, [model])
  useEffect(() => {
    const onResize = () => { if (isMobile()) setSidebarOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!token) return
    fetch(`${API}/chat/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        if (!d.chats?.length) return
        const loaded = d.chats.map(c => ({ id: uid(), dbId: c.id, title: c.title || 'Chat', messages: [], loaded: false }))
        setChats(prev => prev[0].messages.length === 0 ? [prev[0], ...loaded] : [newChat(), ...loaded])
      }).catch(() => {})
  }, [token])

  useEffect(() => {
    const chat = chats.find(c => c.id === activeId)
    if (!chat || !chat.dbId || chat.loaded) return
    fetch(`${API}/chat/history/${chat.dbId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        setChats(prev => prev.map(c => c.id !== activeId ? c : {
          ...c, loaded: true, messages: (d.messages || []).map(m => ({ ...m, id: uid() }))
        }))
      }).catch(() => {})
  }, [activeId])

  const activeChat = chats.find(c => c.id === activeId)
  activeRef.current = activeChat

  const startNewChat = () => { const c = newChat(); setChats(p => [c, ...p]); setActiveId(c.id) }

  const deleteChat = useCallback((id) => {
    const c = chats.find(x => x.id === id)
    if (c?.dbId && token) fetch(`${API}/chat/history/${c.dbId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
    setChats(prev => {
      const next = prev.filter(x => x.id !== id)
      if (!next.length) { const nc = newChat(); setActiveId(nc.id); return [nc] }
      if (activeId === id) setActiveId(next[0].id)
      return next
    })
  }, [activeId, chats, token])

  const pinChat = useCallback(async (id) => {
    const c = chats.find(x => x.id === id)
    if (!c?.dbId) return
    const r = await fetch(`${API}/chat/history/${c.dbId}/pin`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } })
    const d = await r.json()
    setChats(prev => prev.map(x => x.id === id ? { ...x, title: d.title } : x))
  }, [chats, token])

  const patchAssistant = (asstId, changes) => {
    setChats(prev => prev.map(c => c.id !== activeId ? c : {
      ...c, messages: c.messages.map(m => m.id !== asstId ? m : { ...m, ...changes })
    }))
  }

  const addMessages = (userMsg, asstId) => {
    const placeholder = { id: asstId, role: 'assistant', content: '', streaming: true }
    setChats(prev => prev.map(c => {
      if (c.id !== activeId) return c
      const title = c.title === 'New Chat' && !c.messages.length ? (userMsg.content || 'File').slice(0, 40) : c.title
      return { ...c, title, messages: [...c.messages, userMsg, placeholder] }
    }))
  }

  const refreshHistory = () => {
    fetch(`${API}/chat/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        if (!d.chats?.length) return
        setChats(prev => prev.map(c => c.id === activeId ? { ...c, dbId: d.chats[0].id } : c))
      }).catch(() => {})
  }

  const handleUpload = useCallback(async (message, file) => {
    if (loading) return
    const current = activeRef.current
    const userMsg = { id: uid(), role: 'user', content: `📎 **${file.name}**\n${message}`, file: file.name }
    const asstId = uid()
    addMessages(userMsg, asstId)
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file); fd.append('message', message); fd.append('model', model)
      fd.append('chat_id', current?.dbId || '')
      fd.append('history', JSON.stringify((current?.messages || []).slice(-6).map(m => ({ role: m.role, content: String(m.content || '').slice(0, 600) }))))
      const res = await fetch(`${API}/chat/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
      const data = await res.json()
      patchAssistant(asstId, { content: data.response || '⚠️ No response', streaming: false, error: !!data.error })
      if (!current?.dbId) refreshHistory()
    } catch { patchAssistant(asstId, { content: '⚠️ Upload failed.', streaming: false, error: true }) }
    finally { setLoading(false) }
  }, [activeId, loading, model, token])

  const sendMessage = useCallback(async (text, enableSearch = false) => {
    const trimmed = text?.trim()
    if (!trimmed || loading) return
    const current = activeRef.current
    const history = (current?.messages || []).filter(m => !m.streaming && !m.error)
      .slice(-6).map(m => ({ role: m.role, content: String(m.content || '').slice(0, 600) }))
    const userMsg = { id: uid(), role: 'user', content: trimmed }
    const asstId = uid()
    addMessages(userMsg, asstId)
    setLoading(true)
    const ctrl = new AbortController()
    ctrlRef.current = ctrl
    let full = '', lastUpdate = 0
    try {
      const res = await fetch(`${API}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: trimmed, history, model, chat_id: current?.dbId || null, enable_search: enableSearch }),
        signal: ctrl.signal
      })
      if (!res.ok || !res.body) throw new Error('Stream failed')
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += dec.decode(value, { stream: true }).replace(/\u0000/g, '')
        const now = Date.now()
        if (now - lastUpdate > 30) { patchAssistant(asstId, { content: full, streaming: true }); lastUpdate = now }
      }
      full += dec.decode().replace(/\u0000/g, '')
      patchAssistant(asstId, { content: full.trim() || '…', streaming: false })
      if (!current?.dbId) refreshHistory()
    } catch (err) {
      if (err.name === 'AbortError') patchAssistant(asstId, { content: full.trim() || 'Stopped.', streaming: false, stopped: true })
      else patchAssistant(asstId, { content: '⚠️ Something went wrong. Is Ollama running?', streaming: false, error: true })
    } finally {
      setLoading(false)
      if (ctrlRef.current === ctrl) ctrlRef.current = null
    }
  }, [activeId, loading, model, token])

  const stopGen = useCallback(() => ctrlRef.current?.abort(), [])
  const regenerate = useCallback(async (msgId) => {
    const chat = chats.find(c => c.id === activeId)
    if (!chat) return
    const idx = chat.messages.findIndex(m => m.id === msgId)
    if (idx <= 0) return
    const prev = chat.messages[idx - 1]
    if (prev?.role === 'user') await sendMessage(prev.content)
  }, [activeId, chats, sendMessage])

  return (
    <div className="shell">
      <Sidebar
        chats={chats} activeId={activeId}
        onSelect={setActiveId} onNew={startNewChat}
        onDelete={deleteChat} onPin={pinChat}
        user={user} navigate={navigate}
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
      />
      <ChatWindow
        chat={activeChat} loading={loading}
        onSend={sendMessage} onStop={stopGen}
        onUpload={handleUpload} onRegenerate={regenerate}
        sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(p => !p)}
        model={model} onModel={setModel} modelOptions={MODEL_OPTIONS}
        theme={theme} onTheme={() => setTheme(p => p === 'dark' ? 'light' : 'dark')}
      />
    </div>
  )
}
