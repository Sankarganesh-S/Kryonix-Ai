import { useState } from "react";
import {
  Copy,
  Check,
  RefreshCw,
  User,
  Sparkles,
  ThumbsUp,
  Heart,
  Laugh,
  Frown,
  Zap,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
  dracula,
  nord,
  atomDark,
} from "react-syntax-highlighter/dist/esm/styles/prism";

const CODE_THEMES = {
  "One Dark": oneDark,
  "One Light": oneLight,
  Dracula: dracula,
  Nord: nord,
  "Atom Dark": atomDark,
};
const REACTIONS = [
  { emoji: "👍", icon: <ThumbsUp size={12} />, label: "like" },
  { emoji: "❤️", icon: <Heart size={12} />, label: "love" },
  { emoji: "😂", icon: <Laugh size={12} />, label: "haha" },
  { emoji: "😮", icon: null, label: "wow" },
  { emoji: "⚡", icon: <Zap size={12} />, label: "fast" },
];

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="copy-btn" title="Copy">
      {copied ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
    </button>
  );
}

export default function MessageBubble({ message, onRegenerate, loading }) {
  const isUser = message.role === "user";
  const [reaction, setReaction] = useState(null);
  const [showReactions, setShowReactions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const codeTheme =
    CODE_THEMES[localStorage.getItem("kryonix_code_theme") || "One Dark"] ||
    oneDark;

  const components = {
    code({ node, inline, className, children, ...props }) {
      const lang = /language-(\w+)/.exec(className || "")?.[1];
      const code = String(children).replace(/\n$/, "");
      if (inline) return <code className="inline-code">{children}</code>;
      return (
        <div className="code-block">
          <div className="code-block-header">
            <span className="code-lang">{lang || "code"}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <CopyBtn text={code} />
            </div>
          </div>
          <SyntaxHighlighter
            style={codeTheme}
            language={lang || "text"}
            PreTag="div"
            customStyle={{
              margin: 0,
              borderRadius: "0 0 10px 10px",
              fontSize: 13,
              background: "#0d0d14",
            }}
            {...props}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );
    },
  };

  return (
    <div
      className={`bubble-row ${isUser ? "user" : "assistant"}`}
      onMouseEnter={() => !isUser && setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >
      <div className="bubble-avatar">
        {isUser ? <User size={15} /> : <Sparkles size={15} color="#7c6ef5" />}
      </div>

      <div
        className={`bubble ${isUser ? "bubble-user" : "bubble-assistant"} ${message.error ? "bubble-error" : ""}`}
      >
        {/* File badge */}
        {message.file && (
          <div className="bubble-file-badge">📎 {message.file}</div>
        )}

        {isUser ? (
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{message.content}</p>
        ) : (
          <div className="markdown-body">
            {showPreview ? (
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: 13,
                  color: "var(--muted)",
                }}
              >
                {message.content}
              </pre>
            ) : (
              <ReactMarkdown components={components}>
                {message.content || (message.streaming ? "▍" : "")}
              </ReactMarkdown>
            )}
          </div>
        )}

        {message.streaming && <span className="cursor-blink">▍</span>}

        {/* Reaction badge */}
        {reaction && (
          <div style={{ marginTop: 6, fontSize: 18 }}>{reaction}</div>
        )}

        {!isUser && !message.streaming && message.content && (
          <div className="bubble-actions">
            <CopyBtn text={message.content} />
            {!loading && (
              <button
                onClick={() => onRegenerate(message.id)}
                className="copy-btn"
                title="Regenerate"
              >
                <RefreshCw size={13} />
              </button>
            )}
            <button
              onClick={() => setShowPreview((p) => !p)}
              className="copy-btn"
              title="Toggle markdown preview"
              style={{ fontSize: 10, width: "auto", padding: "0 6px" }}
            >
              {showPreview ? "MD" : "Raw"}
            </button>
          </div>
        )}
      </div>

      {/* Reaction picker */}
      {!isUser && showReactions && !message.streaming && (
        <div className="reaction-picker">
          {REACTIONS.map((r) => (
            <button
              key={r.label}
              onClick={() => setReaction(reaction === r.emoji ? null : r.emoji)}
              className={`reaction-btn ${reaction === r.emoji ? "active" : ""}`}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
