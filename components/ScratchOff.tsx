'use client';

import React, { useRef, useEffect, useState } from 'react';

interface ScratchOffProps {
  onComplete?: () => void;
  onFullyScratched?: () => void;
  width: number;
  height: number;
}

export default function ScratchOff({ onComplete, onFullyScratched, width, height }: ScratchOffProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [thresholdReached, setThresholdReached] = useState(false);
  const [fullyScratched, setFullyScratched] = useState(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use standard config for better GPU acceleration on mobile
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    // Set actual canvas size
    canvas.width = width;
    canvas.height = height;

    // Silver gradient for a metallic foil look
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#d1d5db');
    gradient.addColorStop(0.2, '#9ca3af');
    gradient.addColorStop(0.5, '#e5e7eb');
    gradient.addColorStop(0.8, '#6b7280');
    gradient.addColorStop(1, '#9ca3af');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add some noise/texture to look like a scratch card
    for (let i = 0; i < width * height * 0.02; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)';
      ctx.fillRect(x, y, 2, 2);
    }

    // Add some text
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCRATCH', width / 2, height / 2 - 20);
    ctx.fillText('TO REVEAL', width / 2, height / 2 + 20);

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 80; // Doubled scratch size
  }, [width, height]);

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineTo(x, y);
    ctx.stroke();

    // Throttle the completion check to max 4 times a second
    if (!checkTimeoutRef.current) {
      checkTimeoutRef.current = setTimeout(() => {
        checkCompletion();
        checkTimeoutRef.current = null;
      }, 250);
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // Calculate scaling in case the canvas is styled to be smaller/larger than its actual bounds
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation(); // prevent card flip
    setIsScratching(true);
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isScratching) return;
    e.stopPropagation(); // prevent card flip if dragging over it
    e.preventDefault(); // prevent scrolling while scratching
    const { x, y } = getCoordinates(e);
    scratch(x, y);
  };

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation(); // prevent card flip
    setIsScratching(false);
  };

  const checkCompletion = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Read less data to improve performance (e.g. read every 16th pixel)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;
    let checkedPixels = 0;

    // Jump by 16 pixels (64 array elements) to radically speed up loop
    for (let i = 3; i < pixels.length; i += 64) {
      checkedPixels++;
      if (pixels[i] < 128) {
        transparentPixels++;
      }
    }

    const percentage = (transparentPixels / checkedPixels) * 100;
    
    // Trigger callback when 50% scratched, to enable glow effects, but do NOT auto-scratch the rest
    if (percentage > 50 && !thresholdReached) {
      setThresholdReached(true);
      if (onComplete) {
        onComplete();
      }
    }

    if (percentage > 95 && !fullyScratched) {
      setFullyScratched(true);
      if (onFullyScratched) {
        onFullyScratched();
      }
    }
  };

  // Ensure touch events don't trigger scrolling when interacting with the canvas directly.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventTouchScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    if (isScratching) {
      canvas.addEventListener('touchmove', preventTouchScroll, { passive: false });
    }

    return () => {
      canvas.removeEventListener('touchmove', preventTouchScroll);
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [isScratching]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 z-50 w-full h-full cursor-crosshair rounded-xl touch-none transition-opacity duration-1000 ${fullyScratched ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      style={{ touchAction: 'none' }}
    />
  );
}
