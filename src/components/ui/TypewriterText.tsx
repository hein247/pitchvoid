import { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
}

const TypewriterText = ({ text, speed = 50, className = '' }: TypewriterTextProps) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-blink text-primary">|</span>
    </span>
  );
};

export default TypewriterText;
