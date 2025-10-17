import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ children, content, placement = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [tooltipWidth, setTooltipWidth] = useState(0);
  const [tooltipHeight, setTooltipHeight] = useState(0);

  const updatePosition = () => {
    if (!targetRef.current || !tooltipRef.current) return;
    
    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    setTooltipWidth(tooltipRect.width);
    setTooltipHeight(tooltipRect.height);
    
    let top = 0;
    let left = 0;
    
    switch (placement) {
      case 'top':
        top = targetRect.top - tooltipRect.height - 8;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + 8;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.right + 8;
        break;
    }
    
    // Ensure tooltip stays within viewport
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8));
    
    setPosition({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isVisible, content]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <div 
      className="relative inline-block" 
      ref={targetRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
      <div
        ref={tooltipRef}
        className={`fixed z-[9999] px-3 py-2 rounded-lg bg-gray-800 text-white text-sm shadow-lg transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          visibility: isVisible ? 'visible' : 'hidden',
          whiteSpace: 'nowrap'
        }}
      >
        {content}
      </div>
    </div>
  );
}
