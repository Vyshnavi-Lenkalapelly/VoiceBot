'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import MicrophoneButton from './MicrophoneButton';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const VoiceBotCard = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognition = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);

  // Handle speech recognition result
  const handleSpeechResult = useCallback(async (finalText: string) => {
    if (finalText.length < 2) return;
    
    // Ignore speech input if AI is currently speaking
    if (isSpeaking) {
      console.log('Ignoring speech input - AI is speaking');
      return;
    }

    console.log('Processing speech result:', finalText);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: finalText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setTranscript('');
    setIsProcessing(true);

    try {
      console.log('Calling Gemini API...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: finalText }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `API call failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Clean up the response text by removing markdown formatting
      let cleanResponse = data.response || 'I apologize, but I couldn\'t generate a response.';
      
      // Remove markdown formatting like **bold**, *italic*, etc.
      cleanResponse = cleanResponse
        .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold**
        .replace(/\*(.*?)\*/g, '$1')      // Remove *italic*
        .replace(/`(.*?)`/g, '$1')       // Remove `code`
        .replace(/#{1,6}\s/g, '')        // Remove # headers
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove [links](url)
        .trim();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: cleanResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      console.log('AI response added successfully');
      
      // Speak the AI response
      setTimeout(() => {
        speakText(aiMessage.content);
      }, 500);
      
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      
      let errorMessage = 'Sorry, I encountered an error processing your request.';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please try again with a shorter message.';
        } else if (error.message.includes('API key')) {
          errorMessage = 'API configuration error. Please check the setup.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection.';
        }
      }
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: errorMessage + ' Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsProcessing(false);
    }
  }, [isSpeaking]);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Check if we're in a secure context (HTTPS or localhost)
    const isSecureContext = window.location.protocol === 'https:' || 
                           window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';

    if (!isSecureContext) {
      setError('Speech recognition requires HTTPS. The site must be served over a secure connection.');
      return;
    }

    // Initialize Speech Synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.current = window.speechSynthesis;
    }

    // Initialize Speech Recognition
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = 'en-US';
      recognition.current.maxAlternatives = 1;

      recognition.current.onresult = (event: any) => {
        // Don't process results if AI is speaking
        if (isSpeaking) {
          console.log('Ignoring recognition result - AI is speaking');
          return;
        }

        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart;
          } else {
            interimTranscript += transcriptPart;
          }
        }

        setTranscript(finalTranscript + interimTranscript);

        if (finalTranscript.trim().length > 0 && !isSpeaking) {
          handleSpeechResult(finalTranscript.trim());
          setIsListening(false);
        }
      };

      recognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        switch (event.error) {
          case 'network':
            setError('Network error. Please check your internet connection and try again.');
            break;
          case 'not-allowed':
            setError('Microphone access denied. Please allow microphone permissions.');
            break;
          case 'no-speech':
            setError('No speech detected. Speak louder and closer to the microphone. Ensure you\'re in a quiet environment.');
            // Don't stop listening immediately - give user another chance
            setTimeout(() => {
              if (recognition.current && isListening) {
                setError(null);
                setTranscript('🎤 Ready - Please speak now...');
              }
            }, 3000);
            return; // Don't set isListening to false
          case 'audio-capture':
            setError('Audio capture failed. Please check your microphone.');
            break;
          default:
            setError(`Speech recognition error: ${event.error}. Please try again.`);
        }
        setIsListening(false);
      };

      recognition.current.onend = () => {
        console.log('Speech recognition ended');
        // Only auto-restart if we're supposed to be listening AND AI is not speaking
        if (isListening && !transcript.trim() && !isSpeaking) {
          setTimeout(() => {
            if (recognition.current && isListening && !isSpeaking) {
              try {
                recognition.current.start();
                setTranscript('🎤 Listening... Speak now');
              } catch (error) {
                console.log('Failed to restart:', error);
                setIsListening(false);
              }
            }
          }, 500);
        } else {
          setIsListening(false);
        }
      };

      recognition.current.onstart = () => {
        console.log('Speech recognition started');
        setError(null);
        setTranscript('🎤 Listening... Please speak clearly');
      };
    } else {
      setError('Speech recognition not supported in this browser. Please use Chrome for the best experience.');
    }

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
    };
  }, [handleSpeechResult, isListening, isSpeaking]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Text-to-Speech function
  const speakText = (text: string) => {
    if (!speechSynthesis.current) {
      console.log('Speech synthesis not available');
      return;
    }

    speechSynthesis.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    const voices = speechSynthesis.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.includes('Google') || voice.name.includes('Female') || voice.name.includes('Samantha'))
    ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      console.log('Speech started - stopping recognition');
      setIsSpeaking(true);
      // Stop speech recognition when AI starts speaking
      if (recognition.current && isListening) {
        recognition.current.stop();
        setIsListening(false);
        setTranscript('');
      }
    };

    utterance.onend = () => {
      console.log('Speech ended');
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      // Don't log "interrupted" errors as they're expected when we cancel speech
      if (event.error !== 'interrupted') {
        console.error('Speech synthesis error:', event.error);
      }
      setIsSpeaking(false);
    };

    speechSynthesis.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleListening = () => {
    if (!recognition.current) {
      setError('Speech recognition not available. Please use Chrome browser for the best experience.');
      return;
    }

    // Don't start listening if AI is speaking
    if (isSpeaking) {
      setError('Please wait for the AI to finish speaking before starting voice input.');
      return;
    }

    // Stop any ongoing speech when starting to listen
    if (isSpeaking) {
      stopSpeaking();
    }

    if (isListening) {
      console.log('Stopping speech recognition...');
      recognition.current.stop();
      setIsListening(false);
    } else {
      console.log('Starting speech recognition...');
      setError(null);
      setTranscript('');
      
      try {
        recognition.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setError('Failed to start speech recognition. Please try again.');
        setIsListening(false);
      }
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setTranscript('');
    setError(null);
    stopSpeaking();
  };

  return (
    <div className="relative z-10 w-full max-w-2xl mx-auto">
      {/* Main Card */}
      <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            VoiceBot
          </h1>
          <p className="text-gray-300 text-lg">Ask Me Anything</p>
          <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mt-4"></div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Messages Area */}
        <div className="mb-6 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-gray-800">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-2xl mb-2">🎤</div>
              <p className="text-lg mb-2">Click the microphone and start speaking</p>
              <p className="text-sm mt-1">I&apos;ll listen and respond using AI</p>
              <div className="text-xs mt-4 space-y-1 text-gray-500 bg-gray-800/50 p-3 rounded-lg">
                <p><strong>💡 Tips for better speech recognition:</strong></p>
                <p>• Speak clearly and at normal volume</p>
                <p>• Allow microphone permissions when prompted</p>
                <p>• Use Chrome or Edge browser for best results</p>
                <p>• Ensure you&apos;re in a quiet environment</p>
                <p>• Wait for the microphone icon to turn blue before speaking</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 text-gray-100 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Live Transcript Display */}
        {(isListening || transcript) && (
          <div className="mb-6 p-4 bg-gray-800/50 border border-gray-600/50 rounded-lg">
            <div className="flex items-center mb-2">
              {isListening && (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
              )}
              <span className="text-sm text-gray-400">
                {isListening ? 'Listening...' : 'Last heard:'}
              </span>
            </div>
            <p className="text-white">{transcript || 'Speak now...'}</p>
          </div>
        )}

        {/* Speaking Indicator */}
        {isSpeaking && (
          <div className="mb-6 p-4 bg-blue-800/30 border border-blue-600/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm text-blue-300">AI is speaking...</span>
              </div>
              <button
                onClick={stopSpeaking}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Stop
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col items-center space-y-4">
          <div onClick={isSpeaking ? stopSpeaking : toggleListening}>
            <MicrophoneButton isListening={isListening} onToggle={() => {}} />
          </div>
          
          <div className="flex space-x-4">
            <p className="text-sm text-gray-400 text-center">
              {isListening 
                ? 'Click to stop listening' 
                : isSpeaking 
                ? 'Click to stop speaking'
                : 'Click to start listening'}
            </p>
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="text-sm text-gray-400 hover:text-white transition-colors underline"
              >
                Clear chat
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="mt-4 text-center">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
          isListening 
            ? 'bg-red-900/50 text-red-300 border border-red-700/50' 
            : isSpeaking
            ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
            : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            isListening 
              ? 'bg-red-400 animate-pulse' 
              : isSpeaking
              ? 'bg-blue-400 animate-pulse'
              : 'bg-gray-600'
          }`}></div>
          {isListening ? 'Recording' : isSpeaking ? 'Speaking' : 'Ready'}
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="ml-2 text-xs underline hover:no-underline"
            >
              Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceBotCard;