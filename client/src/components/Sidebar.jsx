import { useState, memo } from 'react'
import { Sparkles, Plus, Trash2, MessageSquare, Search, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function Sidebar({ chats, activeId, onSelect, onNew, onDelete, user, navigate }) {
  const { logout } = useAuth()
  const [search, setSearch] = useState('')
  const [hovered, setHovered] = useState(null)

  const filtered = chats.filter(c =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase())
  )

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><Sparkles size={18} /></div>
          <div>
            <div className="sidebar-brand-name">Kryonix AI</div>
            <div className="sidebar-brand-sub">Your own AI</div>
          </div>
        </div>
        <button onClick={onNew} className="sidebar-new-btn"><Plus size={16}/> New Chat</button>
        <div className="sidebar-search-wrap">
          <Search size={14} className="sidebar-search-ico"/>
          <input className="sidebar-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chats..."/>
        </div>
      </div>

      <div className="sidebar-list">
        <div className="sidebar-section-label">Chats</div>
        {filtered.length === 0
          ? <div className="sidebar-empty">No chats yet</div>
          : filtered.map(c => (
            <div key={c.id} onClick={() => onSelect(c.id)}
              onMouseEnter={() => setHovered(c.id)} onMouseLeave={() => setHovered(null)}
              className={`sidebar-item ${activeId === c.id ? 'active' : ''}`}>
              <MessageSquare size={14} className="sidebar-item-ico"/>
              <span className="sidebar-item-title">{c.title}</span>
              {hovered === c.id && (
                <button className="sidebar-delete" onClick={e => { e.stopPropagation(); onDelete(c.id) }}>
                  <Trash2 size={13}/>
                </button>
              )}
            </div>
          ))
        }
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-username">{user?.username}</div>
          <div className="sidebar-email">{user?.email}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/admin')} className="sidebar-icon-btn" title="Admin Panel">
              <Shield size={15}/>
            </button>
          )}
          <button onClick={handleLogout} className="sidebar-icon-btn logout" title="Logout">
            <LogOut size={15}/>
          </button>
        </div>
      </div>
    </aside>
  )
}
export default memo(Sidebar)
