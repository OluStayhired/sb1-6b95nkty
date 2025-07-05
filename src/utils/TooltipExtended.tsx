// src/utils/TooltipHelp.tsx
import React, { useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM

interface TooltipExtendedProps {
  text: string;
  children: ReactNode;
  bgColor?: string;
  textColor?: string;
  className?: string;
  show?: boolean;
  
}

export function TooltipExtended({ text, children, bgColor = 'gray-900', textColor = 'white', className, show = true }: TooltipExtendedProps) {
  // State to manage the tooltip's visibility
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
   const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

   useEffect(() => {
    let element = document.getElementById('tooltip-portal-root');
    if (!element) {
      element = document.createElement('div');
      element.setAttribute('id', 'tooltip-portal-root');
      document.body.appendChild(element);
    }
    setPortalRoot(element);

      // Cleanup function to remove the element when the component unmounts
    return () => {
      if (element && document.body.contains(element)) {
        document.body.removeChild(element);
      }
    };
     }, []);

   // Only allow visibility change if the 'show' prop is true
  const handleMouseEnter = () => {
    if (show) {
      setIsTooltipVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (show) {
      setIsTooltipVisible(false);
    }
  };

 const tooltipContent = (
    <div
      // Apply positioning and styling directly to this div
      // z-index should be high enough to appear above other content
      style={{ position: 'relative', zIndex: 9999 }}
      className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                 bg-${bgColor} text-${textColor} text-xs rounded-md py-1 px-2
                 shadow-lg whitespace-nowrap
                 ${isTooltipVisible ? 'opacity-100' : 'opacity-0'}
                 transition-opacity duration-300 pointer-events-none       
                 ${className || ''} whitespace-pre-line`}
    >
      {text}
    </div>
  );
  
  
  return (
    // Apply onMouseEnter and onMouseLeave directly to this container
    // REMOVE the 'group' class here if it was present, as it's no longer needed for internal hover
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsTooltipVisible(true)} // Set tooltip visible on hover in
      onMouseLeave={() => setIsTooltipVisible(false)} // Hide tooltip on hover out
    >
      {children} 
      
      {show && (
      <div
        className={`absolute z-9999 bottom-full left-1/2 transform -translate-x-1/2 mb-2
                   bg-${bgColor} text-${textColor} text-xs rounded-md py-1 px-2
                    shadow-lg w-[200px]  
                   ${isTooltipVisible ? 'opacity-100' : 'opacity-0'} // Use state for opacity
                   transition-opacity duration-300 pointer-events-none
                   ${className || ''} whitespace-pre-line`}
      >
        
        {text}
        
      </div>
      )}
    </div>
  );
  
}
