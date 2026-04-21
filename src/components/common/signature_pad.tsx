import React, { useRef, useState, useEffect } from 'react';
import { Trash2, PenTool, Type as TypeIcon, CheckCircle2, RotateCcw } from '@/components/common/icons';

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  initialValue?: string;
  type?: 'draw' | 'type' | 'both';
  declarationText?: string;
  required?: boolean;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ 
  onSave, 
  initialValue, 
  type = 'both', 
  declarationText,
  required 
}) => {
  const [mode, setMode] = useState<'draw' | 'type'>(type === 'type' ? 'type' : 'draw');
  const [typedName, setTypedName] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      // Handle high DPI screens
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.scale(2, 2);
        context.lineCap = 'round';
        context.strokeStyle = '#1e1b4b'; // Dark indigo
        context.lineWidth = 2;
        contextRef.current = context;
        
        if (initialValue && initialValue.startsWith('data:image')) {
            const img = new Image();
            img.onload = () => {
                context.drawImage(img, 0, 0, rect.width, rect.height);
                setHasSignature(true);
            };
            img.src = initialValue;
        }
      }
    }
  }, [mode, initialValue]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { offsetX, offsetY } = getCoordinates(e);
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { offsetX, offsetY } = getCoordinates(e);
    contextRef.current?.lineTo(offsetX, offsetY);
    contextRef.current?.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    contextRef.current?.closePath();
    setIsDrawing(false);
    handleSave();
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        offsetX: e.touches[0].clientX - rect.left,
        offsetY: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        offsetX: (e as React.MouseEvent).nativeEvent.offsetX,
        offsetY: (e as React.MouseEvent).nativeEvent.offsetY
      };
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas && contextRef.current) {
      contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      onSave('');
    }
  };

  const handleSave = () => {
    if (mode === 'draw' && canvasRef.current && hasSignature) {
      onSave(canvasRef.current.toDataURL());
    } else if (mode === 'type' && typedName.trim()) {
      // In a real app, you'd render text to a canvas and get toDataURL
      // For now, we'll store the typed text as a special string or just the text
      onSave(`TEXT_SIG:${typedName}`);
    }
  };

  return (
    <div className="space-y-4">
      {declarationText && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-4 leading-relaxed">
          {declarationText}
        </p>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            {type === 'both' && (
              <>
                <button 
                  onClick={() => setMode('draw')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'draw' ? 'bg-violet-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <PenTool size={14} />
                  <span>Draw</span>
                </button>
                <button 
                  onClick={() => setMode('type')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'type' ? 'bg-violet-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <TypeIcon size={14} />
                  <span>Type</span>
                </button>
              </>
            )}
            {type === 'draw' && <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Draw Signature</span>}
            {type === 'type' && <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Type Signature</span>}
          </div>

          <button 
            onClick={mode === 'draw' ? clear : () => { setTypedName(''); onSave(''); }}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Clear signature"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Pad Area */}
        <div className="relative h-48 sm:h-64 bg-gray-50 dark:bg-gray-950/20">
          {mode === 'draw' ? (
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-full cursor-crosshair touch-none"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8">
              <input 
                type="text"
                value={typedName}
                onChange={e => { setTypedName(e.target.value); handleSave(); }}
                className="w-full max-w-md bg-transparent border-b-2 border-dashed border-gray-300 dark:border-gray-700 text-center text-4xl sm:text-5xl font-handwriting py-4 outline-none text-gray-900 dark:text-white placeholder:text-gray-200 dark:placeholder:text-gray-800"
                placeholder="Type your name here..."
                style={{ fontFamily: "'Dancing Script', cursive, serif" }}
              />
              <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Typed Signature</p>
            </div>
          )}
          
          {!hasSignature && mode === 'draw' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 transition-opacity">
              <PenTool size={48} className="text-gray-400" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 px-2">
        <CheckCircle2 size={12} className={hasSignature || typedName ? 'text-emerald-500' : 'text-gray-300'} />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {hasSignature || typedName ? 'Signature Captured' : 'Signature Required'}
        </span>
      </div>

      {/* Font imports for Handwriting style */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap');
        .font-handwriting {
          font-family: 'Dancing Script', cursive;
        }
      `}</style>
    </div>
  );
};

export default SignaturePad;
