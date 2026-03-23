// TestHeader.tsx

import React, { memo, useEffect, useRef, useState } from 'react';
import { ChevronLeft, Clock, User, Volume2 } from 'lucide-react';

interface TestHeaderProps {
  title: string;
  currentSection: string;
  questionNumber: number;
  totalQuestions: number;
  initialTimeRemaining: number;
  autoSpeaking: boolean;
  hasQuestionSpoken: boolean;
  onBack: () => void;
  formatTime: (seconds: number) => string;
  onTimeUp?: () => void;
}

const TestHeader: React.FC<TestHeaderProps> = memo(({
  title,
  currentSection,
  questionNumber,
  totalQuestions,
  initialTimeRemaining,
  autoSpeaking,
  hasQuestionSpoken,
  onBack,
  formatTime,
  onTimeUp
}) => {
  
  const timeRemainingRef = useRef(initialTimeRemaining);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeDisplayRef = useRef<HTMLDivElement>(null);
  
  
  const [displayText, setDisplayText] = useState(() => formatTime(initialTimeRemaining));

  // ✅ Timer logic - NO RE-RENDER
  useEffect(() => {
    // Reset time
    timeRemainingRef.current = initialTimeRemaining;
    setDisplayText(formatTime(initialTimeRemaining));
    
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Start new timer if time > 0
    if (initialTimeRemaining > 0) {
      timerRef.current = setInterval(() => {
        // Directly update ref (no re-render)
        timeRemainingRef.current -= 1;
        
        // Update display ONLY (no component re-render)
        if (timeDisplayRef.current) {
          timeDisplayRef.current.textContent = formatTime(timeRemainingRef.current);
        }
        
        // Also update state for display text (minimal re-render)
        setDisplayText(formatTime(timeRemainingRef.current));
        
        // Check if time's up
        if (timeRemainingRef.current <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          if (onTimeUp) {
            onTimeUp();
          }
        }
      }, 1000);
    }

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [initialTimeRemaining, formatTime, onTimeUp]);

  return (
    <div className="bg-white border-b shadow-sm sticky top-0 z-10">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onBack} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
              title="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-semibold text-sm text-gray-900">{title}</h1>
              <div className="text-xs text-gray-500">
                {currentSection} • Question {questionNumber} of {totalQuestions}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
              <Clock className="h-4 w-4 text-blue-600" />
              <div className="text-center">
                <div className="text-xs text-blue-500">Section Time</div>
                <div 
                  ref={timeDisplayRef}
                  className={`font-bold text-sm ${
                    timeRemainingRef.current < 60 ? 'text-red-600' : 'text-blue-700'
                  }`}
                >
                  {displayText}
                </div>
              </div>
            </div>
            
            {autoSpeaking && (
              <div className="flex items-center space-x-1 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                <div className="h-2 w-2 bg-purple-600 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-purple-700">Speaking...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // ✅ Shallow comparison
  return (
    prevProps.title === nextProps.title &&
    prevProps.currentSection === nextProps.currentSection &&
    prevProps.questionNumber === nextProps.questionNumber &&
    prevProps.totalQuestions === nextProps.totalQuestions &&
    prevProps.initialTimeRemaining === nextProps.initialTimeRemaining &&
    prevProps.autoSpeaking === nextProps.autoSpeaking &&
    prevProps.hasQuestionSpoken === nextProps.hasQuestionSpoken
  );
});

TestHeader.displayName = 'TestHeader';
export default TestHeader;