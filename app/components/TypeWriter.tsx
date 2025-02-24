'use client';

import { useEffect, useState } from 'react';

interface TypeWriterProps {
  text: string;
  speed?: number;  // milliseconds per character
  className?: string;
  onComplete?: () => void;
}

export default function TypeWriter({ 
  text, 
  speed = 50, 
  className = "", 
  onComplete 
}: TypeWriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex >= text.length) {
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedText(text.slice(0, currentIndex + 1));
      setCurrentIndex(i => i + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [currentIndex, speed, text, onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <span className={className}>
      {displayedText}
    </span>
  );
} 