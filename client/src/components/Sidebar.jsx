import { useState, memo, useEffect } from 'react'
import { Sparkles, Plus, Trash2, MessageSquare, Search, LogOut, Shield, X, Settings, Pin, Download, Image } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function Sidebar({ chats, activeId, onSelect, onNew, onDelete, user, navigate, isOpen, onClose, onPin, onExport }) {
  const { logout, token } = useAuth()
  const [search, setSearch] = useState('')
  const [hovered, setHovered] = useState(null)
  const [menuOpen, setMenuOpen] = useState(null)

  const handleLogout = () => { logout(); navigate('/login') }

  const handleSelect = (id) => {
    onSelect(id)
    if (window.innerWidth <= 768 && onClose) onClose()
  }

  const pinned = chats.filter(c => c.title?.startsWith('📌'))
  const unpinned = chats.filter(c => !c.title?.startsWith('📌'))
  const filtered = (arr) => arr.filter(c => !search || c.title?.toLowerCase().includes(search.toLowerCase()))

  const isMobile = window.innerWidth <= 768

  const handleExport = async (chatId) => {
    setMenuOpen(null)
    try {
      const res = await fetch(`${API}/chat/history/${chatId}/export?fmt=txt`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `chat-${chatId}.txt`; a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  const renderChat = (c) => (
    <div key={c.id} style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(c.id)}
      onMouseLeave={() => { setHovered(null); setMenuOpen(null) }}>
      <div onClick={() => handleSelect(c.id)}
        className={`sidebar-item ${activeId === c.id ? 'active' : ''}`}>
        <MessageSquare size={14} className="sidebar-item-ico"/>
        <span className="sidebar-item-title">{c.title}</span>
        {hovered === c.id && (
          <div style={{ display: 'flex', gap: 2 }}>
            <button onClick={e => { e.stopPropagation(); onPin && onPin(c.id) }} className="sidebar-delete" title="Pin">
              <Pin size={12}/>
            </button>
            <button onClick={e => { e.stopPropagation(); handleExport(c.id) }} className="sidebar-delete" title="Export">
              <Download size={12}/>
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(c.id) }} className="sidebar-delete" title="Delete">
              <Trash2 size={13}/>
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {isMobile && isOpen && <div className="sidebar-backdrop" onClick={onClose}/>}
      <aside className={`sidebar ${isMobile && isOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon"><Sparkles size={18}/></div>
            <div>
              <div className="sidebar-brand-name">Kryonix AI</div>
              <div className="sidebar-brand-sub">Your own AI</div>
            </div>
            {isMobile && (
              <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={18}/>
              </button>
            )}
          </div>
          <button onClick={() => { onNew(); if (isMobile && onClose) onClose() }} className="sidebar-new-btn">
            <Plus size={16}/> New Chat
          </button>
          <div className="sidebar-search-wrap">
            <Search size={14} className="sidebar-search-ico"/>
            <input className="sidebar-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chats..."/>
          </div>
        </div>

        <div className="sidebar-list">
          {pinned.length > 0 && (
            <>
              <div className="sidebar-section-label">📌 Pinned</div>
              {filtered(pinned).map(renderChat)}
            </>
          )}
          <div className="sidebar-section-label">Recent</div>
          {filtered(unpinned).length === 0
            ? <div className="sidebar-empty">No chats yet</div>
            : filtered(unpinned).map(renderChat)
          }
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-avatar" style={{ background: user?.avatar_color || '#7c6ef5' }}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-username">{user?.username}</div>
            <div className="sidebar-email">{user?.email}</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => navigate('/image-editor')} className="sidebar-icon-btn" title="Image Editor"><Image size={14}/></button>
            <button onClick={() => navigate('/settings')} className="sidebar-icon-btn" title="Settings"><Settings size={14}/></button>
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="sidebar-icon-btn" title="Admin"><Shield size={14}/></button>
            )}
            <button onClick={handleLogout} className="sidebar-icon-btn logout" title="Logout"><LogOut size={14}/></button>
          </div>
        </div>
      </aside>
    </>
  )
}
export default memo(Sidebar)
