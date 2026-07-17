import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Upload,
  Download,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Sun,
  Contrast,
  Droplets,
} from "lucide-react";

export default function ImageEditorPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    grayscale: 0,
    sepia: 0,
  });
  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState({ h: false, v: false });
  const [activeFilter, setActiveFilter] = useState("adjust");
  const fileRef = useRef(null);

  const PRESETS = [
    {
      name: "Original",
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        grayscale: 0,
        sepia: 0,
      },
    },
    {
      name: "Vivid",
      filters: {
        brightness: 110,
        contrast: 120,
        saturation: 140,
        blur: 0,
        grayscale: 0,
        sepia: 0,
      },
    },
    {
      name: "Matte",
      filters: {
        brightness: 105,
        contrast: 90,
        saturation: 80,
        blur: 0,
        grayscale: 0,
        sepia: 10,
      },
    },
    {
      name: "B&W",
      filters: {
        brightness: 100,
        contrast: 110,
        saturation: 0,
        blur: 0,
        grayscale: 100,
        sepia: 0,
      },
    },
    {
      name: "Sepia",
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 80,
        blur: 0,
        grayscale: 0,
        sepia: 80,
      },
    },
    {
      name: "Cool",
      filters: {
        brightness: 100,
        contrast: 105,
        saturation: 110,
        blur: 0,
        grayscale: 0,
        sepia: 0,
      },
    },
    {
      name: "Warm",
      filters: {
        brightness: 105,
        contrast: 100,
        saturation: 120,
        blur: 0,
        grayscale: 0,
        sepia: 20,
      },
    },
    {
      name: "Fade",
      filters: {
        brightness: 115,
        contrast: 85,
        saturation: 75,
        blur: 0,
        grayscale: 0,
        sepia: 5,
      },
    },
  ];

  const applyFilters = useCallback(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      const rad = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      canvas.width = img.width * cos + img.height * sin;
      canvas.height = img.width * sin + img.height * cos;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.scale(flip.h ? -1 : 1, flip.v ? -1 : 1);
      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%)`;
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    };
    img.src = image;
  }, [image, filters, rotation, flip]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleFile = (file) => {
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target.result);
    reader.readAsDataURL(file);
  };

  const download = () => {
    if (!canvasRef.current) return;
    const a = document.createElement("a");
    a.download = "kryonix-edited.png";
    a.href = canvasRef.current.toDataURL("image/png");
    a.click();
  };

  const sliders = [
    {
      key: "brightness",
      label: "Brightness",
      icon: <Sun size={14} />,
      min: 0,
      max: 200,
    },
    {
      key: "contrast",
      label: "Contrast",
      icon: <Contrast size={14} />,
      min: 0,
      max: 200,
    },
    {
      key: "saturation",
      label: "Saturation",
      icon: <Droplets size={14} />,
      min: 0,
      max: 200,
    },
    { key: "blur", label: "Blur", icon: null, min: 0, max: 10, step: 0.1 },
    { key: "grayscale", label: "Grayscale", icon: null, min: 0, max: 100 },
    { key: "sepia", label: "Sepia", icon: null, min: 0, max: 100 },
  ];

  return (
    <div className="editor-shell">
      {/* Header */}
      <div className="editor-header">
        <button onClick={() => navigate("/chat")} className="editor-back">
          <ChevronLeft size={18} /> Back
        </button>
        <h1 className="editor-title">Image Editor</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => fileRef.current?.click()}
            className="editor-btn"
          >
            <Upload size={15} /> Upload
          </button>
          {image && (
            <button onClick={download} className="editor-btn primary">
              <Download size={15} /> Save
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      <div className="editor-body">
        {/* Canvas */}
        <div
          className="editor-canvas-wrap"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files[0]);
          }}
        >
          {!image ? (
            <div
              className="editor-empty"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={40} color="#7c6ef5" />
              <p>Click or drag an image here</p>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>
                PNG, JPG, GIF, WebP supported
              </p>
            </div>
          ) : (
            <canvas ref={canvasRef} className="editor-canvas" />
          )}
        </div>

        {/* Controls */}
        {image && (
          <div className="editor-controls">
            {/* Rotate/Flip */}
            <div className="editor-toolbar">
              <button
                onClick={() => setRotation((r) => r - 90)}
                className="editor-tool-btn"
                title="Rotate left"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => setRotation((r) => r + 90)}
                className="editor-tool-btn"
                title="Rotate right"
              >
                <RotateCw size={16} />
              </button>
              <button
                onClick={() => setFlip((f) => ({ ...f, h: !f.h }))}
                className="editor-tool-btn"
                title="Flip horizontal"
              >
                <FlipHorizontal size={16} />
              </button>
              <button
                onClick={() => setFlip((f) => ({ ...f, v: !f.v }))}
                className="editor-tool-btn"
                title="Flip vertical"
              >
                <FlipVertical size={16} />
              </button>
              <button
                onClick={() => {
                  setFilters(PRESETS[0].filters);
                  setRotation(0);
                  setFlip({ h: false, v: false });
                }}
                className="editor-tool-btn"
                style={{ fontSize: 11, width: "auto", padding: "0 10px" }}
              >
                Reset
              </button>
            </div>

            {/* Presets */}
            <div className="editor-presets">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setFilters(p.filters)}
                  className="editor-preset-btn"
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Sliders */}
            <div className="editor-sliders">
              {sliders.map((s) => (
                <div key={s.key} className="editor-slider-row">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      minWidth: 100,
                    }}
                  >
                    {s.icon}
                    <span className="editor-slider-label">{s.label}</span>
                  </div>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step || 1}
                    value={filters[s.key]}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        [s.key]: Number(e.target.value),
                      }))
                    }
                    className="editor-range"
                  />
                  <span className="editor-slider-val">
                    {filters[s.key]}
                    {s.key === "blur" ? "px" : "%"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
