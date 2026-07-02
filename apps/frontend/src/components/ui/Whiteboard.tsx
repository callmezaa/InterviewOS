import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Paintbrush, Square, ArrowUpRight, Type, Eraser, Trash2, Undo, Redo, ImagePlus, X } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { Tooltip } from './Tooltip';

export interface WhiteboardShape {
  id: string;
  type: 'pen' | 'rect' | 'arrow' | 'text' | 'image';
  color: string;
  lineWidth: number;
  points?: { x: number; y: number }[];
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  text?: string;
  imageData?: string;   // base64 data URL for image type
  imageWidth?: number;  // natural width
  imageHeight?: number; // natural height
}

interface WhiteboardProps {
  shapes: WhiteboardShape[];
  onDraw: (shapes: WhiteboardShape[]) => void;
  onClear: () => void;
  onCursorMove: (x: number, y: number) => void;
  peerCursors: Record<string, { userName: string; x: number; y: number; timestamp: number }>;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
  shapes,
  onDraw,
  onClear,
  onCursorMove,
  peerCursors,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [tool, setTool] = useState<'pen' | 'rect' | 'arrow' | 'text' | 'eraser' | 'image'>('pen');
  const [color, setColor] = useState<string>('#3B82F6');
  const [lineWidth, setLineWidth] = useState<number>(4);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<WhiteboardShape | null>(null);
  const [textState, setTextState] = useState<{ x: number; y: number; active: boolean }>({
    x: 0, y: 0, active: false,
  });
  const [textValue, setTextValue] = useState('');

  const [history, setHistory] = useState<WhiteboardShape[][]>([[]]);
  const [historyStep, setHistoryStep] = useState<number>(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Pending image: stores base64 + dimensions waiting for placement
  const [pendingImage, setPendingImage] = useState<{ data: string; w: number; h: number } | null>(null);

  // Image cache: preloaded Image objects keyed by base64 data URL prefix (first 80 chars)
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  const VIRTUAL_WIDTH = 1200;
  const VIRTUAL_HEIGHT = 800;

  const colors = [
    { value: '#FFFFFF', name: 'White' },
    { value: '#3B82F6', name: 'Blue' },
    { value: '#10B981', name: 'Green' },
    { value: '#EF4444', name: 'Red' },
    { value: '#F59E0B', name: 'Yellow' },
  ];

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * VIRTUAL_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * VIRTUAL_HEIGHT;
    return { x: Math.round(x), y: Math.round(y) };
  };

  // Load image into cache, returns HTMLImageElement
  const loadImage = useCallback((dataUrl: string): Promise<HTMLImageElement> => {
    const key = dataUrl.slice(0, 80);
    const cached = imageCache.current.get(key);
    if (cached) return Promise.resolve(cached);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        imageCache.current.set(key, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }, []);

  // Preload all image shapes
  useEffect(() => {
    shapes.forEach((s) => {
      if (s.type === 'image' && s.imageData) {
        loadImage(s.imageData).catch(() => {});
      }
    });
  }, [shapes, loadImage]);

  // Canvas rendering
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSpacing = 40;
    for (let x = 0; x < VIRTUAL_WIDTH; x += gridSpacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, VIRTUAL_HEIGHT); ctx.stroke();
    }
    for (let y = 0; y < VIRTUAL_HEIGHT; y += gridSpacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIRTUAL_WIDTH, y); ctx.stroke();
    }

    const allShapes = [...shapes];
    if (currentShape) allShapes.push(currentShape);

    allShapes.forEach((shape) => {
      ctx.strokeStyle = shape.color;
      ctx.fillStyle = shape.color;
      ctx.lineWidth = shape.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (shape.type === 'pen') {
        if (!shape.points || shape.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++) {
          ctx.lineTo(shape.points[i].x, shape.points[i].y);
        }
        ctx.stroke();
      } else if (shape.type === 'rect') {
        const x1 = shape.x1 ?? 0, y1 = shape.y1 ?? 0;
        const x2 = shape.x2 ?? 0, y2 = shape.y2 ?? 0;
        ctx.beginPath();
        ctx.rect(x1, y1, x2 - x1, y2 - y1);
        ctx.stroke();
      } else if (shape.type === 'arrow') {
        const x1 = shape.x1 ?? 0, y1 = shape.y1 ?? 0;
        const x2 = shape.x2 ?? 0, y2 = shape.y2 ?? 0;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLength = 15;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
        ctx.closePath(); ctx.fill();
      } else if (shape.type === 'text') {
        ctx.font = `${shape.lineWidth * 4 + 12}px sans-serif`;
        ctx.fillText(shape.text ?? '', shape.x1 ?? 0, shape.y1 ?? 0);
      } else if (shape.type === 'image' && shape.imageData) {
        const x1 = shape.x1 ?? 0, y1 = shape.y1 ?? 0;
        const x2 = shape.x2 ?? (x1 + 200), y2 = shape.y2 ?? (y1 + 150);
        const w = x2 - x1, h = y2 - y1;
        const key = shape.imageData.slice(0, 80);
        const img = imageCache.current.get(key);
        if (img) {
          ctx.drawImage(img, x1, y1, w, h);
        } else {
          // Placeholder while loading
          ctx.save();
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          ctx.fillRect(x1, y1, w, h);
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x1, y1, w, h);
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Loading...', x1 + w / 2, y1 + h / 2);
          ctx.textAlign = 'start';
          ctx.restore();
          loadImage(shape.imageData).then(() => drawCanvas()).catch(() => {});
        }
      }
    });

    // Peer cursors
    Object.entries(peerCursors).forEach(([peerId, cursor]) => {
      if (Date.now() - cursor.timestamp > 15000) return;
      const px = cursor.x, py = cursor.y;
      ctx.fillStyle = '#10B981';
      ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      const name = cursor.userName;
      ctx.font = '10px monospace';
      const textWidth = ctx.measureText(name).width;
      ctx.beginPath(); ctx.roundRect(px + 8, py - 18, textWidth + 12, 18, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#FFFFFF'; ctx.fillText(name, px + 14, py - 6);
    });
  }, [shapes, currentShape, peerCursors, loadImage]);

  // Sync external shapes to history
  useEffect(() => {
    if (JSON.stringify(shapes) !== JSON.stringify(history[historyStep])) {
      const newHistory = history.slice(0, historyStep + 1);
      setHistory([...newHistory, shapes]);
      setHistoryStep(newHistory.length);
    }
  }, [shapes]);

  const handleUndo = () => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      setHistoryStep(prevStep);
      onDraw(history[prevStep]);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      setHistoryStep(nextStep);
      onDraw(history[nextStep]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !textState.active) {
        if (e.key.toLowerCase() === 'z') { e.preventDefault(); handleUndo(); }
        else if (e.key.toLowerCase() === 'y') { e.preventDefault(); handleRedo(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyStep, history, textState.active]);

  useEffect(() => { drawCanvas(); }, [shapes, currentShape, peerCursors, drawCanvas]);

  // ── Image Import ──────────────────────────────────────────

  const processImageFile = useCallback((file: File, targetX?: number, targetY?: number) => {
    if (!file.type.startsWith('image/')) return;
    // Max 5MB
    if (file.size > 5 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Scale to fit within virtual canvas while preserving aspect ratio
        const maxW = VIRTUAL_WIDTH * 0.6;
        const maxH = VIRTUAL_HEIGHT * 0.6;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > maxW) { h = (h * maxW) / w; w = maxW; }
        if (h > maxH) { w = (w * maxH) / h; h = maxH; }
        w = Math.round(w);
        h = Math.round(h);

        // Cache the image
        imageCache.current.set(dataUrl.slice(0, 80), img);

        // If we have a target position (click), place immediately
        if (targetX !== undefined && targetY !== undefined) {
          const cx = targetX - w / 2;
          const cy = targetY - h / 2;
          const shape: WhiteboardShape = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'image',
            color: '#ffffff',
            lineWidth: 1,
            x1: Math.max(0, Math.round(cx)),
            y1: Math.max(0, Math.round(cy)),
            x2: Math.min(VIRTUAL_WIDTH, Math.round(cx + w)),
            y2: Math.min(VIRTUAL_HEIGHT, Math.round(cy + h)),
            imageData: dataUrl,
            imageWidth: img.naturalWidth,
            imageHeight: img.naturalHeight,
          };
          onDraw([...shapes, shape]);
        } else {
          // No click position — store as pending, user will click to place
          setPendingImage({ data: dataUrl, w: img.naturalWidth, h: img.naturalHeight });
          setTool('image');
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [shapes, onDraw]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  }, [processImageFile]);

  // Open file picker
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ── Mouse Handlers ────────────────────────────────────────

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (textState.active) { commitText(); return; }
    const { x, y } = getCoordinates(e);

    // Image tool: place pending image or open file picker
    if (tool === 'image') {
      if (pendingImage) {
        const maxW = VIRTUAL_WIDTH * 0.6;
        const maxH = VIRTUAL_HEIGHT * 0.6;
        let w = pendingImage.w, h = pendingImage.h;
        if (w > maxW) { h = (h * maxW) / w; w = maxW; }
        if (h > maxH) { w = (w * maxH) / h; h = maxH; }
        w = Math.round(w); h = Math.round(h);

        // Start drag-to-resize
        setIsDrawing(true);
        setCurrentShape({
          id: Math.random().toString(36).substr(2, 9),
          type: 'image',
          color: '#ffffff',
          lineWidth: 1,
          x1: x, y1: y,
          x2: x + w, y2: y + h,
          imageData: pendingImage.data,
          imageWidth: pendingImage.w,
          imageHeight: pendingImage.h,
        });
        setPendingImage(null);
      } else {
        openFilePicker();
      }
      return;
    }

    if (tool === 'text') {
      setTextState({ x, y, active: true });
      setTextValue('');
      setTimeout(() => textInputRef.current?.focus(), 50);
      return;
    }

    setIsDrawing(true);
    setCurrentShape({
      id: Math.random().toString(36).substr(2, 9),
      type: tool === 'eraser' ? 'pen' : tool,
      color: tool === 'eraser' ? '#000000' : color,
      lineWidth: tool === 'eraser' ? lineWidth * 3 : lineWidth,
      x1: x, y1: y,
      points: tool === 'pen' || tool === 'eraser' ? [{ x, y }] : undefined,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCoordinates(e);
    onCursorMove(x, y);

    if (!isDrawing || !currentShape) return;

    if (currentShape.type === 'pen') {
      setCurrentShape({ ...currentShape, points: [...(currentShape.points || []), { x, y }] });
    } else {
      setCurrentShape({ ...currentShape, x2: x, y2: y });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentShape) return;
    setIsDrawing(false);

    // For image shapes, ensure minimum size
    if (currentShape.type === 'image') {
      const x1 = currentShape.x1 ?? 0, y1 = currentShape.y1 ?? 0;
      let x2 = currentShape.x2 ?? x1 + 200, y2 = currentShape.y2 ?? y1 + 150;
      if (Math.abs(x2 - x1) < 20) x2 = x1 + 200;
      if (Math.abs(y2 - y1) < 20) y2 = y1 + 150;
      onDraw([...shapes, { ...currentShape, x2, y2 }]);
    } else {
      onDraw([...shapes, currentShape]);
    }
    setCurrentShape(null);
  };

  const commitText = () => {
    if (!textValue.trim()) { setTextState({ ...textState, active: false }); return; }
    onDraw([...shapes, {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text', color, lineWidth,
      x1: textState.x, y1: textState.y, text: textValue,
    }]);
    setTextState({ ...textState, active: false });
    setTextValue('');
  };

  // Drag-drop handler on the canvas container
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // Get drop position relative to canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.round(((e.clientX - rect.left) / rect.width) * VIRTUAL_WIDTH);
        const y = Math.round(((e.clientY - rect.top) / rect.height) * VIRTUAL_HEIGHT);
        processImageFile(file, x, y);
      } else {
        processImageFile(file);
      }
    }
  }, [processImageFile]);

  // Cancel pending image
  const cancelPendingImage = useCallback(() => {
    setPendingImage(null);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col bg-surface-black rounded-lg overflow-hidden border border-white/[0.06] relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Top Toolbar */}
      <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-surface-tile-3/80 backdrop-blur-md border border-white/[0.06] px-4 py-2 rounded-full flex items-center gap-4 z-20 shadow-lg">
        {/* Tool selectors */}
        <div className="flex items-center gap-1.5 border-r border-white/[0.06] pr-4">
          <Tooltip content="Brush Tool">
            <button
              onClick={() => { setTool('pen'); setTextState({ ...textState, active: false }); setPendingImage(null); }}
              className={`p-2 rounded-lg transition-all ${tool === 'pen' ? 'bg-primary text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'}`}
              aria-label="Brush tool"
            >
              <Paintbrush className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Rectangle Tool">
            <button
              onClick={() => { setTool('rect'); setTextState({ ...textState, active: false }); setPendingImage(null); }}
              className={`p-2 rounded-lg transition-all ${tool === 'rect' ? 'bg-primary text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'}`}
              aria-label="Rectangle tool"
            >
              <Square className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Arrow Tool">
            <button
              onClick={() => { setTool('arrow'); setTextState({ ...textState, active: false }); setPendingImage(null); }}
              className={`p-2 rounded-lg transition-all ${tool === 'arrow' ? 'bg-primary text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'}`}
              aria-label="Arrow tool"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Text Tool">
            <button
              onClick={() => { setTool('text'); setPendingImage(null); }}
              className={`p-2 rounded-lg transition-all ${tool === 'text' ? 'bg-primary text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'}`}
              aria-label="Text tool"
            >
              <Type className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Import Image">
            <button
              onClick={() => {
                if (tool === 'image') {
                  setTool('pen');
                  setPendingImage(null);
                } else {
                  setTextState({ ...textState, active: false });
                  openFilePicker();
                }
              }}
              className={`p-2 rounded-lg transition-all ${tool === 'image' ? 'bg-primary text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'}`}
              aria-label="Import image"
            >
              <ImagePlus className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Eraser Tool">
            <button
              onClick={() => { setTool('eraser'); setTextState({ ...textState, active: false }); setPendingImage(null); }}
              className={`p-2 rounded-lg transition-all ${tool === 'eraser' ? 'bg-primary text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'}`}
              aria-label="Eraser tool"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>

        {/* Color Palette (disabled for Eraser and Image) */}
        <div className={`flex items-center gap-1.5 border-r border-white/[0.06] pr-4 ${tool === 'eraser' || tool === 'image' ? 'opacity-30 pointer-events-none' : ''}`}>
          {colors.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className={`w-5 h-5 rounded-full border transition-all ${color === c.value ? 'ring-2 ring-primary border-white scale-110' : 'border-white/20'}`}
              style={{ backgroundColor: c.value }}
              title={c.name}
              aria-label={`Select color: ${c.name}`}
            />
          ))}
        </div>

        {/* Line weight slider */}
        <div className={`flex items-center gap-2 border-r border-white/[0.06] pr-4 ${tool === 'image' ? 'opacity-30 pointer-events-none' : ''}`}>
          <label htmlFor="wb-line-width" className="text-[10px] text-white/55 font-mono font-semibold">Size</label>
          <input
            id="wb-line-width"
            type="range"
            min="2"
            max="12"
            value={lineWidth}
            aria-label="Brush size"
            title="Brush size"
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            className="w-16 accent-primary"
          />
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-1 border-r border-white/[0.06] pr-4">
          <Tooltip content="Undo" shortcut="⌘Z">
            <button
              onClick={handleUndo}
              disabled={historyStep === 0}
              className={`p-1.5 rounded-lg transition-all ${historyStep === 0 ? 'text-white/20 cursor-not-allowed' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'}`}
              aria-label="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Redo" shortcut="⌘Y">
            <button
              onClick={handleRedo}
              disabled={historyStep === history.length - 1}
              className={`p-1.5 rounded-lg transition-all ${historyStep === history.length - 1 ? 'text-white/20 cursor-not-allowed' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'}`}
              aria-label="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>

        {/* Clear */}
        <Tooltip content="Clear Whiteboard">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="p-2 text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            aria-label="Clear whiteboard"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      {/* Pending image indicator */}
      {pendingImage && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-primary/90 text-white text-[12px] px-3 py-1.5 rounded-full flex items-center gap-2 z-20 shadow-lg">
          <ImagePlus className="w-3.5 h-3.5" />
          Click on canvas to place image
          <button onClick={cancelPendingImage} className="hover:text-white/60 transition-colors ml-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 w-full h-full relative flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          width={VIRTUAL_WIDTH}
          height={VIRTUAL_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`w-full h-full object-contain bg-surface-black shadow-inner max-h-[700px] border border-white/[0.06] ${
            tool === 'eraser' ? 'cursor-cell'
            : tool === 'text' ? 'cursor-text'
            : tool === 'image' ? 'cursor-copy'
            : 'cursor-crosshair'
          }`}
        />

        {/* Floating Text Input */}
        {textState.active && (
          <div
            className="absolute z-30"
            style={{
              left: `${(textState.x / VIRTUAL_WIDTH) * 100}%`,
              top: `${(textState.y / VIRTUAL_HEIGHT) * 100}%`,
              transform: 'translate(-5px, -15px)',
            }}
          >
            <input
              ref={textInputRef}
              type="text"
              value={textValue}
              aria-label="Whiteboard text input"
              title="Type text and press Enter to place on whiteboard"
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitText();
                if (e.key === 'Escape') setTextState({ ...textState, active: false });
              }}
              onBlur={commitText}
              className="bg-surface-tile-3 border border-primary px-2.5 py-1 text-white rounded text-[13px] outline-none shadow-xl font-sans"
              style={{ color }}
              placeholder="Type & press Enter..."
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="h-6 bg-surface-tile-3/40 border-t border-white/[0.06] px-3 flex items-center justify-between text-[10px] text-white/50 font-mono">
        <span>Workspace coordinate scale: {VIRTUAL_WIDTH}x{VIRTUAL_HEIGHT}</span>
        <span>Realtime Sync: Socket.io Enabled</span>
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => { onClear(); setShowClearConfirm(false); }}
        title="Clear whiteboard?"
        description="This will permanently erase all shapes, drawings, and images on the whiteboard. This action cannot be undone."
        confirmText="Clear All"
        variant="danger"
      />
    </div>
  );
};
