'use client';

import { useState } from 'react';

interface MicrophoneButtonProps {
  isListening: boolean;
  isSpeaking?: boolean;
  onToggle: () => void;
}

const MicrophoneButton = ({ isListening, isSpeaking = false, onToggle }: MicrophoneButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  return (
    <button
      onClick={onToggle}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={`relative w-20 h-20 rounded-full transition-all duration-200 transform ${
        isPressed ? 'scale-95' : 'scale-100'
      } ${
        isListening 
          ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/30 hover:from-red-600 hover:to-red-700' 
          : isSpeaking
          ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30 hover:from-orange-600 hover:to-orange-700'
          : 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30 hover:from-blue-600 hover:to-purple-700'
      } group focus:outline-none focus:ring-4 focus:ring-blue-500/30`}
    >
      {/* Pulse animation for listening state */}
      {isListening && (
        <>
          <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20"></div>
          <div className="absolute inset-2 rounded-full bg-red-400 animate-ping opacity-40 animation-delay-150"></div>
        </>
      )}
      
      {/* Microphone icon */}
      <div className="relative z-10 flex items-center justify-center h-full">
        {isListening ? (
          // Stop icon when listening
          <svg
            className="w-8 h-8 text-white transition-transform group-hover:scale-110"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          // Microphone icon when not listening
          <svg
            className="w-8 h-8 text-white transition-transform group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        )}
      </div>

      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-30 transition-opacity ${
        isListening ? 'bg-red-400' : 'bg-blue-400'
      } blur-xl`}></div>
    </button>
  );
};

export default MicrophoneButton;