import React from 'react';

interface Summary {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  totalScore: number;
  accuracy: number;
  timeSpent: number;
  averageTimePerQuestion: number;
}

interface SectionAnalysis {
  sectionType: string;
  sectionId: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  score: number;
}

interface Results {
  summary: Summary;
  sectionWiseAnalysis?: SectionAnalysis[];
  questionAnalysis?: any[];
}

interface ResultsSummaryProps {
  results: Results | null;
  onClose: () => void;
  darkMode?: boolean;
}

const ResultsSummary: React.FC<ResultsSummaryProps> = ({ results, onClose, darkMode = true }) => {
  if (!results) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-2xl w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">No Results Available</h2>
          <p className="text-gray-400 mb-6">Unable to load test results.</p>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  
  const { summary, sectionWiseAnalysis } = results;
  const accuracyPercentage = (summary.accuracy).toFixed(1);
  
  // Calculate performance metrics
  const getPerformanceInsights = () => {
    const insights = [];
    
    if (summary.accuracy === 0) {
      insights.push("Focus on understanding question patterns and practice more");
    } else if (summary.accuracy < 0.5) {
      insights.push("Good attempt! Review answers to identify improvement areas");
    } else if (summary.accuracy < 0.8) {
      insights.push("Great job! You're on the right track");
    } else {
      insights.push("Excellent performance! Keep up the good work");
    }
    
    if (summary.skippedQuestions > summary.totalQuestions * 0.3) {
      insights.push("Try to attempt all questions to maximize your score");
    }
    
    if (summary.averageTimePerQuestion > 120) {
      insights.push("Practice time management for better efficiency");
    }
    
    return insights;
  };

  const performanceInsights = getPerformanceInsights();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className={`bg-gray-800 rounded-3xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        
        {/* Header Section */}
        <div className="flex-shrink-0 p-6 lg:p-8 border-b border-gray-700">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 lg:w-20 lg:h-20 ${
                summary.accuracy >= 0.8 ? 'bg-green-500' : 
                summary.accuracy >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
              } rounded-full flex items-center justify-center`}>
                <span className="text-2xl lg:text-3xl">
                  {summary.accuracy >= 0.8 ? '🏆' : 
                   summary.accuracy >= 0.5 ? '📊' : '🎯'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                  Test Results
                </h1>
                <p className="text-gray-400 text-sm lg:text-base">Detailed performance analysis</p>
              </div>
            </div>
            
           
          </div>
        </div>

        {/* Main Content - Grid Layout */}
        <div className="flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 overflow-y-auto lg:overflow-hidden">
          
          {/* Left Column - Performance Overview */}
          <div className="space-y-4 lg:space-y-6">
            {/* Performance Progress */}
            <div className="bg-gray-700 rounded-2xl p-4 lg:p-6">
              <h3 className="text-lg lg:text-xl font-semibold mb-4">Performance Overview</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm lg:text-base mb-2">
                    <span className="text-gray-300">Your Progress</span>
                    <span className="font-semibold">{accuracyPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-4 lg:h-5">
                    <div 
                      className="h-4 lg:h-5 rounded-full bg-gradient-to-r from-green-400 via-blue-400 to-purple-500 transition-all duration-1000"
                      style={{ width: `${accuracyPercentage}%` }}
                    />
                  </div>
                </div>
                
               
              </div>
            </div>

            {/* Time Analysis */}
            <div className="bg-gray-700 rounded-2xl p-4 lg:p-6">
              <h3 className="text-lg lg:text-xl font-semibold mb-4">Time Analysis</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Time</span>
                  <span className="font-semibold">{Math.floor(summary.timeSpent / 60)}m {summary.timeSpent % 60}s</span>
                </div>
            
              </div>
            </div>
             {/* Action Buttons */}
            <div className="bg-gray-700 rounded-2xl p-4 lg:p-6">
              <h3 className="text-lg lg:text-xl font-semibold mb-4">Next Steps</h3>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/tests'}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 lg:py-4 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center text-base lg:text-lg"
                >
                  <span className="mr-3">📚</span>
                  Practice More Tests
                </button>
                <button
                  onClick={() => window.location.href = '/mock-tests'}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 lg:py-4 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center text-base lg:text-lg"
                >
                  <span className="mr-3">🏠</span>
                  Back to Mocktest
                </button>
              </div>
            </div>
          </div>

          {/* Middle Column - Detailed Breakdown */}
          <div className="space-y-4 lg:space-y-6">
            {/* Score Distribution */}
            <div className="bg-gray-700 rounded-2xl p-4 lg:p-6">
              <h3 className="text-lg lg:text-xl font-semibold mb-4">Score Distribution</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Questions</span>
                  <span className="font-semibold">{40}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-400">Correct Answers</span>
                  <span className="font-semibold text-green-400">{summary.totalScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-400">Incorrect Answers</span>
                  <span className="font-semibold text-red-400">{40-summary.totalScore}</span>
                </div>
               
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-gray-700 rounded-2xl p-4 lg:p-6">
              <h3 className="text-lg lg:text-xl font-semibold mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-blue-400">{summary.totalScore}</div>
                  <div className="text-gray-400 text-sm">Total Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-purple-400">{accuracyPercentage}%</div>
                  <div className="text-gray-400 text-sm">Accuracy Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Insights & Actions */}
          <div className="space-y-4 lg:space-y-6">
            {/* Performance Insights */}
            <div className="bg-gray-700 rounded-2xl p-4 lg:p-6">
              <h3 className="text-lg lg:text-xl font-semibold mb-4 flex items-center">
                <span className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
                Performance Insights
              </h3>
              <div className="space-y-3">
                {performanceInsights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3 bg-gray-600 rounded-xl p-3 lg:p-4">
                    <span className="text-yellow-400 text-lg mt-0.5">💡</span>
                    <p className="text-gray-200 text-sm lg:text-base leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

           
          </div>
        </div>

      </div>
    </div>
  );
};

export default ResultsSummary;