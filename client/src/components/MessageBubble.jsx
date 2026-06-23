import { useState } from 'react'
import { Copy, Check, RefreshCw, User, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <button onClick={copy} className="copy-btn" title="Copy">
      {copied ? <Check size={13} color="#22c55e"/> : <Copy size={13}/>}
    </button>
  )
}

export default function MessageBubble({ message, onRegenerate, loading }) {
  const isUser = message.role === 'user'

  const components = {
    code({ node, inline, className, children, ...props }) {
      const lang = /language-(\w+)/.exec(className || '')?.[1]
      const code = String(children).replace(/\n$/, '')
      if (inline) return <code className="inline-code">{children}</code>
      return (
        <div className="code-block">
          <div className="code-block-header">
            <span className="code-lang">{lang || 'code'}</span>
            <CopyBtn text={code}/>
          </div>
          <SyntaxHighlighter style={oneDark} language={lang || 'text'} PreTag="div" customStyle={{ margin: 0, borderRadius: '0 0 10px 10px', fontSize: 13, background: '#0d0d14' }} {...props}>
            {code}
          </SyntaxHighlighter>
        </div>
      )
    }
  }

  return (
    <div className={`bubble-row ${isUser ? 'user' : 'assistant'}`}>
      <div className="bubble-avatar">
        {isUser ? <User size={15}/> : <Sparkles size={15} color="#7c6ef5"/>}
      </div>
      <div className={`bubble ${isUser ? 'bubble-user' : 'bubble-assistant'} ${message.error ? 'bubble-error' : ''}`}>
        {isUser
          ? <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.content}</p>
          : <div className="markdown-body">
              <ReactMarkdown components={components}>{message.content || (message.streaming ? '▍' : '')}</ReactMarkdown>
            </div>
        }
        {message.streaming && <span className="cursor-blink">▍</span>}
        {!isUser && !message.streaming && message.content && (
          <div className="bubble-actions">
            <CopyBtn text={message.content}/>
            {!loading && (
              <button onClick={() => onRegenerate(message.id)} className="copy-btn" title="Regenerate">
                <RefreshCw size={13}/>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
