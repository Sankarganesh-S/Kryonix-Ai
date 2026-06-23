import { useState, useRef, useCallback } from 'react'
import { Send, Square, Paperclip, Globe, X, FileText, Image, File } from 'lucide-react'

export default function InputArea({ onSend, onStop, onUpload, loading }) {
  const [text, setText] = useState('')
  const [searchEnabled, setSearchEnabled] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const textRef = useRef(null)
  const fileRef = useRef(null)

  const getFileIcon = (file) => {
    if (!file) return <File size={14}/>
    if (file.type.startsWith('image/')) return <Image size={14} color="#a78bfa"/>
    if (file.type === 'application/pdf') return <FileText size={14} color="#f59e0b"/>
    return <File size={14} color="#71717a"/>
  }

  const send = useCallback(() => {
    if (loading) return
    if (selectedFile) {
      onUpload(text.trim() || 'Analyze this file', selectedFile)
      setSelectedFile(null)
      setText('')
      textRef.current.style.height = 'auto'
      return
    }
    const t = text.trim()
    if (!t) return
    onSend(t, searchEnabled)
    setText('')
    textRef.current.style.height = 'auto'
  }, [text, loading, onSend, onUpload, selectedFile, searchEnabled])

  const keyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const resize = (e) => {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
  }

  const handleFile = (file) => {
    if (!file) return
    const allowed = ['image/jpeg','image/png','image/gif','image/webp','application/pdf',
      'text/plain','text/csv','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type) && !file.name.match(/\.(txt|csv|docx|pdf|jpg|jpeg|png|gif|webp)$/i)) {
      alert('Unsupported file type. Supported: PDF, Word, Images, CSV, TXT')
      return
    }
    if (file.size > 20 * 1024 * 1024) { alert('File too large. Max 20MB.'); return }
    setSelectedFile(file)
    if (!text) setText('Analyze this file')
  }

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="input-area">
      {/* Drag overlay */}
      {dragOver && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(124,110,245,.15)', border: '2px dashed #7c6ef5', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <p style={{ color: '#a78bfa', fontWeight: 600 }}>Drop file here</p>
        </div>
      )}

      {/* File preview */}
      {selectedFile && (
        <div className="file-preview">
          {getFileIcon(selectedFile)}
          <span className="file-preview-name">{selectedFile.name}</span>
          <span className="file-preview-size">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
          <button onClick={() => setSelectedFile(null)} className="file-preview-remove"><X size={13}/></button>
        </div>
      )}

      <div className={`input-box ${dragOver ? 'drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}>

        {/* File attach button */}
        <button onClick={() => fileRef.current?.click()} className="input-icon-btn" title="Attach file (PDF, Word, Image, CSV)">
          <Paperclip size={17}/>
        </button>
        <input ref={fileRef} type="file" style={{ display: 'none' }}
          accept=".pdf,.docx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
          onChange={e => handleFile(e.target.files[0])}/>

        <textarea ref={textRef} value={text}
          onChange={e => { setText(e.target.value); resize(e) }}
          onKeyDown={keyDown}
          placeholder={selectedFile ? "Ask something about this file..." : "Message Kryonix AI…"}
          className="input-textarea" rows={1} disabled={loading}/>

        <div className="input-actions">
          {/* Web search toggle */}
          <button onClick={() => setSearchEnabled(p => !p)}
            className={`input-icon-btn ${searchEnabled ? 'active' : ''}`}
            title={searchEnabled ? 'Web search ON' : 'Web search OFF'}>
            <Globe size={17}/>
          </button>

          {loading
            ? <button onClick={onStop} className="input-stop-btn" title="Stop"><Square size={16} fill="currentColor"/></button>
            : <button onClick={send} disabled={!text.trim() && !selectedFile} className="input-send-btn" title="Send"><Send size={16}/></button>
          }
        </div>
      </div>

      <p className="input-hint">
        {searchEnabled ? '🌐 Web search ON · ' : ''}
        Enter to send · Shift+Enter for new line · 📎 Attach PDF, Word, Image, CSV
      </p>
    </div>
  )
}
