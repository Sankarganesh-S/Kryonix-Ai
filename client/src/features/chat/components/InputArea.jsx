import { useState, useRef, useCallback, useEffect } from "react";
import {
  Send,
  Square,
  Paperclip,
  Globe,
  X,
  FileText,
  Image,
  File,
  Mic,
  MicOff,
} from "lucide-react";

export default function InputArea({ onSend, onStop, onUpload, loading }) {
  const [text, setText] = useState("");
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const textRef = useRef(null);
  const fileRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";
      rec.onresult = (e) => {
        const transcript = Array.from(e.results)
          .map((r) => r[0].transcript)
          .join("");
        setText(transcript);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const getFileIcon = (file) => {
    if (!file) return <File size={14} />;
    if (file.type.startsWith("image/"))
      return <Image size={14} color="#a78bfa" />;
    if (file.type === "application/pdf")
      return <FileText size={14} color="#f59e0b" />;
    return <File size={14} color="#71717a" />;
  };

  const send = useCallback(() => {
    if (loading) return;
    if (selectedFile) {
      onUpload(text.trim() || "Analyze this file", selectedFile);
      setSelectedFile(null);
      setText("");
      if (textRef.current) textRef.current.style.height = "auto";
      return;
    }
    const t = text.trim();
    if (!t) return;
    onSend(t, searchEnabled);
    setText("");
    if (textRef.current) textRef.current.style.height = "auto";
  }, [text, loading, onSend, onUpload, selectedFile, searchEnabled]);

  const keyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const resize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert("File too large. Max 20MB.");
      return;
    }
    setSelectedFile(file);
    if (!text) setText("Analyze this file");
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="input-area">
      {selectedFile && (
        <div className="file-preview">
          {getFileIcon(selectedFile)}
          <span className="file-preview-name">{selectedFile.name}</span>
          <span className="file-preview-size">
            ({(selectedFile.size / 1024).toFixed(0)} KB)
          </span>
          <button
            onClick={() => setSelectedFile(null)}
            className="file-preview-remove"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {listening && (
        <div
          style={{
            textAlign: "center",
            color: "#ef4444",
            fontSize: 12,
            marginBottom: 6,
            animation: "blink 1s step-end infinite",
          }}
        >
          🎤 Listening... speak now
        </div>
      )}

      <div
        className={`input-box ${dragOver ? "drag-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <button
          onClick={() => fileRef.current?.click()}
          className="input-icon-btn"
          title="Attach file"
        >
          <Paperclip size={17} />
        </button>
        <input
          ref={fileRef}
          type="file"
          style={{ display: "none" }}
          accept=".pdf,.docx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        <textarea
          ref={textRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            resize(e);
          }}
          onKeyDown={keyDown}
          placeholder={
            listening
              ? "Listening..."
              : selectedFile
                ? "Ask about this file..."
                : "Message Kryonix AI…"
          }
          className="input-textarea"
          rows={1}
          disabled={loading}
        />

        <div
          className="input-actions"
          style={{ display: "flex", gap: 4, alignItems: "center" }}
        >
          {voiceSupported && (
            <button
              onClick={toggleVoice}
              className={`input-icon-btn ${listening ? "active" : ""}`}
              title={listening ? "Stop listening" : "Voice input"}
              style={{ color: listening ? "#ef4444" : undefined }}
            >
              {listening ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
          )}
          <button
            onClick={() => setSearchEnabled((p) => !p)}
            className={`input-icon-btn ${searchEnabled ? "active" : ""}`}
            title={searchEnabled ? "Web search ON" : "Web search OFF"}
          >
            <Globe size={17} />
          </button>
          {loading ? (
            <button onClick={onStop} className="input-stop-btn">
              <Square size={16} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={send}
              disabled={!text.trim() && !selectedFile}
              className="input-send-btn"
            >
              <Send size={16} />
            </button>
          )}
        </div>
      </div>

      <p className="input-hint">
        {listening
          ? "🎤 Speaking..."
          : searchEnabled
            ? "🌐 Web search ON · "
            : ""}
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  );
}
