import { useRef, useEffect } from 'react'
import { PanelLeftOpen, PanelLeftClose, Sun, Moon, ChevronDown } from 'lucide-react'
import MessageBubble from './MessageBubble'
import InputArea from './InputArea'
import { Sparkles } from 'lucide-react'

const SUGGESTIONS = [
  'Explain how neural networks work',
  'Write a Python web scraper',
  'Search for latest AI news',
  'Help me debug my code',
]

export default function ChatWindow({ chat, loading, onSend, onStop, onUpload, onRegenerate, sidebarOpen, onToggleSidebar, model, onModel, modelOptions, theme, onTheme }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat?.messages?.length, chat?.messages?.at(-1)?.content])

  const isEmpty = !chat?.messages?.length

  return (
    <div className="chat-shell">
      <header className="chat-header">
        <div className="chat-header-left">
          <button onClick={onToggleSidebar} className="header-icon-btn">
            {sidebarOpen ? <PanelLeftClose size={18}/> : <PanelLeftOpen size={18}/>}
          </button>
          <div className="model-selector-wrap">
            <select className="model-selector" value={model} onChange={e => onModel(e.target.value)}>
              {modelOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} className="model-selector-ico"/>
          </div>
        </div>
        <div className="chat-header-title">
          <Sparkles size={16} color="#7c6ef5"/>
          <span>{chat?.title || 'New Chat'}</span>
        </div>
        <div className="chat-header-right">
          <button onClick={onTheme} className="header-icon-btn">
            {theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>}
          </button>
        </div>
      </header>

      <div className="chat-messages">
        {isEmpty ? (
          <div className="chat-empty">
            <div className="chat-empty-icon"><Sparkles size={32} color="#7c6ef5"/></div>
            <h2 className="chat-empty-title">How can I help you today?</h2>
            <p className="chat-empty-sub">Ask anything, upload files, or search the web.</p>
            <div className="chat-suggestions">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => onSend(s, false)} className="chat-suggestion-btn">{s}</button>
              ))}
            </div>
            <div className="chat-features">
              <div className="chat-feature"><span>📎</span><span>Upload PDF, Word, Images, CSV</span></div>
              <div className="chat-feature"><span>🌐</span><span>Web search with DuckDuckGo</span></div>
              <div className="chat-feature"><span>🖼️</span><span>Image analysis with LLaVA</span></div>
              <div className="chat-feature"><span>💻</span><span>Code help in any language</span></div>
            </div>
          </div>
        ) : (
          chat.messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} onRegenerate={onRegenerate} loading={loading}/>
          ))
        )}
        {loading && !chat?.messages?.at(-1)?.streaming && (
          <div className="typing-indicator"><span/><span/><span/></div>
        )}
        <div ref={bottomRef}/>
      </div>

      <InputArea onSend={onSend} onStop={onStop} onUpload={onUpload} loading={loading}/>
    </div>
  )
}
