import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation } from "react-router";
import { get, useForm } from "react-hook-form";
import api from "../axiosInstance";
import ResultsSummary from "./resultSummary";
import { Timer } from "./Timer"
import WritingSection from "./WritingSection";
import WritingSummary from "./WritingSummary";

const TestQuestionPage = () => {
  const { testId } = useParams();
  const location = useLocation();
  const { register, watch, setValue, handleSubmit, formState: { errors } } = useForm();
  const [timeLeft, setTimeLeft] = useState(0);
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [totalQuestionsFromPrevious, setTotalQuestionsFromPrevious] = useState(0);
  const [startingQuestionNumber, setStartingQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);


  // Theme classes
  const theme = {
    background: darkMode ? 'bg-gray-900' : 'bg-gray-100',
    surface: darkMode ? 'bg-gray-800' : 'bg-white',
    surfaceLight: darkMode ? 'bg-gray-700' : 'bg-gray-50',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textSecondary: darkMode ? 'text-gray-300' : 'text-gray-600',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-500',
    border: darkMode ? 'border-gray-700' : 'border-gray-300',
    accent: darkMode ? 'bg-blue-600' : 'bg-blue-500',
    accentHover: darkMode ? 'hover:bg-blue-700' : 'hover:bg-blue-600',
    success: darkMode ? 'bg-green-600' : 'bg-green-500',
    successHover: darkMode ? 'hover:bg-green-700' : 'hover:bg-green-600',
    danger: darkMode ? 'bg-red-600' : 'bg-red-500',
    input: darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900',
    inputFocus: darkMode ? 'focus:border-blue-500 focus:ring-blue-500' : 'focus:border-blue-500 focus:ring-blue-500',
  };

  // Audio Player Component for Listening
  const AudioPlayer = ({ audioUrl, darkMode }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef(null);

  const togglePlayPause = async () => {
  if (!audioRef.current) return;

  try {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      await audioRef.current.play(); // WAIT FOR PLAY
      setIsPlaying(true);
    }
  } catch (error) {
    console.log("Play error:", error);
  }
};

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(progress);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded-lg p-4 mb-6`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Listening Audio</h3>
          <span className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-purple-600' : 'bg-purple-500'} text-white`}>
            Click to play
          </span>
        </div>
        
        <audio
         ref={audioRef}
  onTimeUpdate={handleTimeUpdate}
  onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={audioUrl} type="audio/mp3" />
          Your browser does not support the audio element.
        </audio>

        <div className="flex items-center space-x-4">
          <button
            onClick={togglePlayPause}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'
            } text-white transition-colors`}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <div className="flex-1">
            <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded-full h-2`}>
              <div
                className={`h-2 rounded-full ${darkMode ? 'bg-purple-500' : 'bg-purple-600'} transition-all duration-300`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {isPlaying ? 'Playing...' : 'Click to play'}
          </span>
        </div>
      </div>
    );
  };

  // Helper functions
  const hasPlaceholders = (questionText) => {
    return questionText?.includes('{{') || false;
  };

  const renderPlaceholderQuestion = (questionText, questionId, startingNumber) => {
    if (!questionText) return null;
    const parts = [];
    const regex = /\{\{(\d+)\}\}/g;
    let lastIndex = 0;
    let match;
    let index = 0;
    let currentQuestionNumber = startingNumber;
    while ((match = regex.exec(questionText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${index}`} className={theme.text}>
            {questionText.slice(lastIndex, match.index)}
          </span>
        );
        index++;
      }
      const placeholderIndex = match[1];
      const subQuestionId = `${questionId}_${placeholderIndex}`;
      parts.push(
        <span key={`input-${index}`} className="inline-flex items-center mx-1">
          <input
            type="text"
            {...register(subQuestionId)}
            placeholder={`Answer ${currentQuestionNumber}`}
            className={`border-b-2 ${darkMode ? 'border-gray-400 focus:border-blue-500' : 'border-gray-600 focus:border-blue-600'} focus:outline-none px-2 py-1 w-32 bg-transparent ${theme.text} inline-block align-middle`}
          />
        </span>
      );
      index++;
      currentQuestionNumber++;
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < questionText.length) {
      parts.push(
        <span key={`text-${index}`} className={theme.text}>
          {questionText.slice(lastIndex)}
        </span>
      );
    }
    return parts;
  };

  // Fixed function to handle multiple choice selection
  const handleMultipleChoiceChange = (questionId, optionLabel, isChecked) => {
    const currentAnswers = watch(questionId) ? JSON.parse(watch(questionId)) : [];
    let newAnswers;
    if (isChecked) {
      newAnswers = [...currentAnswers, optionLabel];
    } else {
      newAnswers = currentAnswers.filter(label => label !== optionLabel);
    }
    setValue(questionId, JSON.stringify(newAnswers));
  };

  // Fixed function to check if an option is selected
  const isOptionSelected = (questionId, optionLabel) => {
    try {
      const currentValue = watch(questionId);
      if (!currentValue) return false;
      const currentAnswers = JSON.parse(currentValue);
      return Array.isArray(currentAnswers) && currentAnswers.includes(optionLabel);
    } catch (error) {
      return false;
    }
  };

  // Fixed function to get selected count
  const getSelectedCount = (questionId) => {
    try {
      const currentValue = watch(questionId);
      if (!currentValue) return 0;
      const currentAnswers = JSON.parse(currentValue);
      return Array.isArray(currentAnswers) ? currentAnswers.length : 0;
    } catch (error) {
      return 0;
    }
  };

  // Get options for dropdown questions from commonOptions - DIRECT FROM API
  const getCommonOptions = (questionGroups, questionIndex) => {
    const allQuestions = getAllQuestions();
    const currentQuestion = allQuestions?.[questionIndex];
    for (const group of questionGroups) {
      if (group?.questions?.some(q =>
        q?._id === currentQuestion?._id ||
        q?.id === currentQuestion?.id ||
        q?.text === currentQuestion?.text ||
        q?.question === currentQuestion?.question
      )) {
        if (group.commonOptions) {
          if (typeof group.commonOptions === 'string') {
            return group.commonOptions.split(',').map(opt => opt.trim());
          } else if (Array.isArray(group.commonOptions)) {
            return group.commonOptions;
          }
        }
        return [];
      }
    }
    return [];
  };

  // Add debug to findQuestionGroupType to see what types are detected
  const findQuestionGroupType = (questionIndex) => {
    const questionGroups = extractQuestionGroups();
    let currentIndex = 0;
    for (const group of questionGroups) {
      const groupQuestionCount = group?.questions?.length || 0;
      if (questionIndex >= currentIndex && questionIndex < currentIndex + groupQuestionCount) {
        // Handle listening question types
        if (group?.type) {
          return group.type; // 'note_completion', 'form_completion', etc.
        }
        return group?.type || 'default';
      }
      currentIndex += groupQuestionCount;
    }
    return 'default';
  };

  const SafeQuestionRenderer = (props) => {
    const { question, questionId, index, groupType } = props;

    let content = null;

    try {
      if (!question || typeof question !== "object") {
        content = <div className="text-red-500">Invalid question data</div>;
      } else {
        const questionText = getSafeQuestionText(question);
        const safeQuestion = {
          ...question,
          text: questionText,
          question: questionText,
        };

        content = renderQuestionByType(
          safeQuestion,
          questionId,
          index,
          groupType
        );
      }
    } catch (error) {
      console.error("Error rendering question:", error);
      content = <div className="text-red-500">Error rendering question</div>;
    }

    return content;
  };

  // Listening Question Renderers
  const renderNoteCompletion = (question, questionId, questionIndex) => {
    const questionText = getSafeQuestionText(question);
    const startingNumber = calculateQuestionStartingNumber(questionIndex);
    
    return (
      <div className="flex-1">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-gray-200 text-lg leading-relaxed">
            {renderPlaceholderQuestion(questionText, questionId, startingNumber)}
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          Write ONE WORD AND/OR A NUMBER for each answer.
        </p>
      </div>
    );
  };

  const renderFormCompletion = (question, questionId, questionIndex) => {
    const questionText = getSafeQuestionText(question);
    const startingNumber = calculateQuestionStartingNumber(questionIndex);
    
    return (
      <div className="flex-1">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-gray-200 text-lg leading-relaxed">
            {renderPlaceholderQuestion(questionText, questionId, startingNumber)}
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          Complete the form below.
        </p>
      </div>
    );
  };

  // Main function to render questions based on group type using switch-case
  const renderQuestionByType = (question, questionId, questionIndex, groupType) => {
    const questionText = getSafeQuestionText(question);
    
    // Handle listening question types
    if (groupType === 'note_completion' || groupType === 'form_completion' || 
        groupType === 'sentence_completion' || groupType === 'table_completion') {
      return renderNoteCompletion(question, questionId, questionIndex);
    }
    
    if (hasPlaceholders(questionText)) {
      return renderSummaryCompletion(question, questionId, questionIndex);
    }
    
    switch (groupType) {
      case 'matching_information':
        return renderMatchingInformation(question, questionId, questionIndex);
      case 'multiple_choice_multiple':
        return renderMultipleChoiceMultiple(question, questionId, questionIndex);
      case 'multiple_choice_single':
        return renderMultipleChoiceSingle(question, questionId, questionIndex);
      case "yes_no_not_given":
      case "true_false_not_given":
      case "matching_features":
        return renderYes_No_Not_Given(question, questionId, questionIndex);
      default:
        return renderDefaultQuestion(question, questionId, questionIndex);
    }
  };

  const renderYes_No_Not_Given = (question, questionId, questionIndex) => {
    const questionText = getSafeQuestionText(question);
    const questionGroups = extractQuestionGroups();
    let options = [];
    let currentIndex = 0;
    for (const group of questionGroups) {
      const groupQuestionCount = group?.questions?.length || 0;
      if (questionIndex >= currentIndex && questionIndex < currentIndex + groupQuestionCount) {
        if (group.commonOptions) {
          if (typeof group.commonOptions === 'string') {
            options = group.commonOptions.split(',').map(opt => opt.trim());
          } else if (Array.isArray(group.commonOptions)) {
            options = group.commonOptions;
          }
        }
        break;
      }
      currentIndex += groupQuestionCount;
    }
    return (
      <div className="flex-1">
        <label className="block text-lg font-medium text-white mb-3">
          {questionText || `Question ${questionIndex + 1}`}
        </label>
        <select
          {...register(questionId)}
          className="w-full px-4 py-3 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
        >
          <option value="">Select an option</option>
          {options?.map((option, optIndex) => (
            <option key={optIndex} value={option}>{option}</option>
          ))}
        </select>
      </div>
    );
  };

  const renderMatchingFeatures = (question, questionId, questionIndex) => {
    const questionText = getSafeQuestionText(question);
    const options = getCommonOptions(extractQuestionGroups(), questionIndex);
    return (
      <div className="flex-1">
        <label className="block text-lg font-medium text-white mb-3">
          {questionText || `Question ${questionIndex + 1}`}
        </label>
        <select
          {...register(questionId)}
          className="w-full px-4 py-3 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
        >
          <option value="">Select an option</option>
          {options?.map((option, optIndex) => (
            <option key={optIndex} value={option}>{option}</option>
          ))}
        </select>
      </div>
    );
  };

  const renderMultipleChoiceSingle = (question, questionId, questionIndex) => {
    const questionText = getSafeQuestionText(question);
    const options = question?.options || [];
    return (
      <div className="flex-1">
        <label className="block text-lg font-medium text-white mb-3">
          {questionText || `Question ${questionIndex + 1}`}
        </label>
        <div className="space-y-3">
          {options?.map((option, optIndex) => (
            <label key={option?._id || optIndex} className="flex items-start space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-700">
              <input
                type="radio"
                value={option?.label}
                {...register(questionId)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-1 flex-shrink-0"
              />
              <div className="flex-1">
                <span className="text-white font-medium">{option?.label}. </span>
                <span className="text-gray-300">{option?.text}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const renderMatchingInformation = (question, questionId, questionIndex) => {
    const questionText = getSafeQuestionText(question);
    const questionGroups = extractQuestionGroups();
    const options = getCommonOptions(questionGroups, questionIndex);
    return (
      <div className="flex-1">
        <label className="block text-lg font-medium text-white mb-3">
          {questionText || `Question ${questionIndex + 1}`}
        </label>
        <select
          {...register(questionId)}
          className="w-full px-4 py-3 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
        >
          <option value="">Select an option</option>
          {options?.map((option, optIndex) => (
            <option key={optIndex} value={option}>{option}</option>
          ))}
        </select>
      </div>
    );
  };

  const getSafeQuestionText = (question) => {
    if (!question) return '';
    if (typeof question.text === 'string') return question.text;
    if (typeof question.question === 'string') return question.question;
    if (typeof question.content === 'string') return question.content;
    if (question.text && typeof question.text === 'object') {
      return question.text.content || question.text.text || '';
    }
    if (question.question && typeof question.question === 'object') {
      return question.question.content || question.question.text || '';
    }
    if (question.content && typeof question.content === 'object') {
      return question.content.text || question.content.content || '';
    }
    return '';
  };

  const renderSummaryCompletion = (question, questionId, questionIndex) => {
    const questionText = getSafeQuestionText(question);
    const startingNumber = calculateQuestionStartingNumber(questionIndex);
    return (
      <div className="flex-1">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-gray-200 text-lg leading-relaxed">
            {renderPlaceholderQuestion(questionText, questionId, startingNumber)}
          </div>
        </div>
      </div>
    );
  };

  const renderMultipleChoiceMultiple = (question, questionId, questionIndex) => {
    const questionText = getSafeQuestionText(question);
    const options = question?.options || [];
    const startingNumber = calculateQuestionStartingNumber(questionIndex);
    const isTwoAnswersQuestion = questionText?.includes('TWO') ||
      questionText?.includes('10-11') ||
      questionText?.includes('12-13');
    let questionNumberDisplay;
    if (isTwoAnswersQuestion) {
      questionNumberDisplay = `${startingNumber}-${startingNumber + 1}`;
    } else {
      questionNumberDisplay = startingNumber.toString();
    }
    return (
      <div className="flex-1">
        <label className="block text-lg font-medium text-white mb-3">
          {isTwoAnswersQuestion ? `Questions ${questionNumberDisplay}: ${questionText}` : (questionText || `Question ${questionIndex + 1}`)}
        </label>
        <div className="text-sm text-gray-400 mb-3">
          {isTwoAnswersQuestion ? 'Choose TWO letters' : 'Choose all that apply'} ({getSelectedCount(questionId)} selected)
        </div>
        <div className="space-y-3">
          {options?.map((option, optIndex) => (
            <label key={option?._id || optIndex} className="flex items-start space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-700">
              <input
                type="checkbox"
                checked={isOptionSelected(questionId, option?.label)}
                onChange={(e) => handleMultipleChoiceChange(questionId, option?.label, e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-1 flex-shrink-0"
              />
              <div className="flex-1">
                <span className="text-white font-medium">{option?.label}. </span>
                <span className="text-gray-300">{option?.text}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const renderDefaultQuestion = (question, questionId, questionIndex) => {
    const questionText = getSafeQuestionText(question);
    return (
      <div className="flex-1">
        <label className="block text-lg font-medium text-white mb-3">
          {questionText || `Question ${questionIndex + 1}`}
        </label>
        <input
          type="text"
          {...register(questionId)}
          placeholder="Enter your answer..."
          className="w-full px-4 py-3 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
        />
      </div>
    );
  };

  const getProgressInfo = () => {
    if (!testData) return { current: 0, total: 0 };
    return {
      current: testData?.currentQuestion ?? testData?.progress?.currentQuestion ?? 1,
      total: testData?.totalQuestions ?? testData?.progress?.totalQuestions ?? 3
    };
  };

  const formatAnswersForSubmission = (formData) => {
    const answers = [];
    const allQuestions = getAllQuestions();
    allQuestions?.forEach((question, index) => {
      const questionId = question?._id || question?.id;
      const questionText = getSafeQuestionText(question);
      const groupType = findQuestionGroupType(index);
      if (!questionId) return;

      // Handle listening completion types (same as summary completion)
      if ((groupType === 'note_completion' || groupType === 'form_completion' || 
           groupType === 'sentence_completion' || groupType === 'table_completion' ||
           groupType === 'summary_completion') && hasPlaceholders(questionText)) {
        const placeholderCount = (questionText.match(/\{\{\d+\}\}/g) || []).length;
        const completionAnswers = [];
        for (let i = 1; i <= placeholderCount; i++) {
          const subQuestionId = `${questionId}_${i}`;
          completionAnswers.push(formData[subQuestionId] || '');
        }
        if (completionAnswers.some(answer => answer !== '')) {
          answers.push({
            questionGroupId: findQuestionGroupId(index),
            questionId: questionId,
            answer: completionAnswers
          });
        }
      }
      else if (groupType === 'multiple_choice_multiple') {
        try {
          const selectedOptions = formData[questionId] ? JSON.parse(formData[questionId]) : [];
          if (Array.isArray(selectedOptions) && selectedOptions.length > 0) {
            answers.push({
              questionGroupId: findQuestionGroupId(index),
              questionId: questionId,
              answer: selectedOptions
            });
          }
        } catch (error) { }
      }
      else if (groupType === 'matching_information' || groupType === 'matching_features' ||
        groupType === 'yes_no_not_given' || groupType === 'true_false_not_given' ||
        groupType === 'multiple_choice_single') {
        if (formData[questionId]) {
          answers.push({
            questionGroupId: findQuestionGroupId(index),
            questionId: questionId,
            answer: formData[questionId]
          });
        }
      }
      else {
        if (formData[questionId]) {
          answers.push({
            questionGroupId: findQuestionGroupId(index),
            questionId: questionId,
            answer: formData[questionId]
          });
        }
      }
    });

    return answers;
  };

  const findQuestionGroupId = (questionIndex) => {
    const questionGroups = extractQuestionGroups();
    let currentIndex = 0;
    for (const group of questionGroups) {
      const groupQuestionCount = group?.questions?.length || 0;
      if (questionIndex >= currentIndex && questionIndex < currentIndex + groupQuestionCount) {
        return group.id || group._id || "default-group";
      }
      currentIndex += groupQuestionCount;
    }
    return "default-group";
  };

  const debugObjectRendering = () => {
    if (!testData) return;
    const allQuestions = getAllQuestions();
    allQuestions?.forEach((q, index) => {
      const propsToCheck = ['text', 'question', 'content', 'title', 'instruction'];
      propsToCheck.forEach(prop => {
        if (q && q[prop] && typeof q[prop] === 'object') {
          // Debug removed - no console.log
        }
      });
    });
  };

  useEffect(() => {
    if (testData) {
      debugObjectRendering();
    }
  }, [testData]);

  const getCurrentQuestionData = () => {
    if (!testData) return null;
    if (testData.currentQuestion && typeof testData.currentQuestion === 'object') {
      return testData.currentQuestion;
    }
    if (testData.questions || testData.questionGroup || testData.content) {
      return testData;
    }
    return null;
  };

  const extractQuestions = () => {
    const currentQuestion = getCurrentQuestionData();
    if (!currentQuestion) return [];
    let questions = [];
    if (currentQuestion.questionGroup && Array.isArray(currentQuestion.questionGroup)) {
      questions = currentQuestion.questionGroup.flatMap(group => {
        if (group && Array.isArray(group.questions)) {
          return group.questions.filter(q => q && typeof q === 'object');
        }
        return [];
      });
    } else if (Array.isArray(currentQuestion.questions)) {
      questions = currentQuestion.questions.filter(q => q && typeof q === 'object');
    }
    return questions;
  };

  const extractContent = () => {
    const currentQuestion = getCurrentQuestionData();
    if (!currentQuestion) return "Loading content...";
    if (currentQuestion.content && typeof currentQuestion.content === 'object') {
      return currentQuestion.content.passageText || currentQuestion.content.text || JSON.stringify(currentQuestion.content);
    }
    if (typeof currentQuestion.content === 'string') {
      return currentQuestion.content;
    }
    return "Reading passage content will appear here";
  };

  const extractTitle = () => {
    const currentQuestion = getCurrentQuestionData();
    if (!currentQuestion) return "Test";
    if (currentQuestion.title && typeof currentQuestion.title === 'object') {
      return currentQuestion.title.text || currentQuestion.title.name || "IELTS Reading Test";
    }
    return currentQuestion.title || "IELTS Reading Test";
  };

  const extractInstruction = () => {
    const currentQuestion = getCurrentQuestionData();
    if (!currentQuestion) return "Answer the following questions.";
    if (currentQuestion.content?.instruction) {
      return currentQuestion.content.instruction;
    }
    return currentQuestion.instruction ||
      testData?.instruction ||
      testData?.data?.instruction ||
      "Read the passage and answer the questions below.";
  };

  const extractQuestionGroups = () => {
    const currentQuestion = getCurrentQuestionData();
    if (!currentQuestion?.questionGroup) return [];
    return currentQuestion.questionGroup.map((group, index) => ({
      id: group?._id || index + 1,
      instruction: group?.instruction,
      questions: group?.questions || [],
      order: group?.order || index + 1,
      commonOptions: group?.commonOptions,
      type: group?.type
    })).filter(group => group);
  };

  const getAllQuestions = () => {
    const questionGroups = extractQuestionGroups();
    if (questionGroups.length === 0) {
      return extractQuestions();
    }
    const allQuestions = questionGroups.flatMap(group => group?.questions || []);
    return allQuestions;
  };

  const calculateTotalQuestions = () => {
    const allQuestions = getAllQuestions();
    let total = 0;
    allQuestions?.forEach((question, index) => {
      const questionText = getSafeQuestionText(question);
      const groupType = findQuestionGroupType(index);
      if (hasPlaceholders(questionText)) {
        const placeholderCount = (questionText.match(/\{\{\d+\}\}/g) || []).length;
        total += placeholderCount;
      } else if (groupType === 'multiple_choice_multiple' &&
        (questionText?.includes('TWO') || questionText?.includes('10-11') || questionText?.includes('12-13'))) {
        total += 2;
      } else {
        total += 1;
      }
    });
    return total;
  };

const calculateQuestionStartingNumber = (questionIndex) => {
  const allQuestions = getAllQuestions();
  let currentNumber = startingQuestionNumber;
  
  // 0 se questionIndex tak ke liye count karein
  for (let i = 0; i < questionIndex; i++) {
    const question = allQuestions?.[i];
    if (!question) continue;
    
    const questionText = getSafeQuestionText(question);
    const groupType = findQuestionGroupType(i);
    
    if (hasPlaceholders(questionText)) {
      const placeholderCount = (questionText.match(/\{\{\d+\}\}/g) || []).length;
      currentNumber += placeholderCount;
    } else if (groupType === 'multiple_choice_multiple' &&
      (questionText?.includes('TWO') || questionText?.includes('10-11') || questionText?.includes('12-13'))) {
      currentNumber += 2;
    } else {
      currentNumber += 1;
    }
  }
  
  return currentNumber;
};

  const goToNextQuestion = () => {
    const allQuestions = getAllQuestions();
    if (currentQuestionIndex < (allQuestions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const autoFillQuestionByIndex = (questionIndex, apiResponse = null) => {
    const allQuestions = getAllQuestions();
    const targetQuestion = allQuestions?.[questionIndex];

    if (!targetQuestion) {
      console.log(`❌ No question found at index: ${questionIndex}`);
      return;
    }

    const questionId = targetQuestion._id || targetQuestion.id;
    const groupType = findQuestionGroupType(questionIndex);
    const questionText = getSafeQuestionText(targetQuestion);

    // Extract valid answers from API response
    const userAnswers = (apiResponse?.userAnswer || testData?.userAnswer || [])
      .filter(item => item.questionId && item.answer !== null && item.answer !== '');

    console.log(`🔄 Auto-filling question ${questionIndex}:`, {
      questionId,
      groupType,
      questionText: questionText?.substring(0, 50) + '...',
      totalUserAnswers: userAnswers.length
    });

    // Find answer for this specific question
    const answer = userAnswers.find(ans => ans.questionId === questionId);

    console.log(`🔍 Answer found for question ${questionIndex}:`, {
      hasAnswer: !!answer,
      answerValue: answer?.answer
    });

    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      if (groupType === "multiple_choice_single") {
        if (answer && answer.answer) {
          const stringAnswer = String(answer.answer).trim();
          setValue(questionId, stringAnswer, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
          });
          console.log("✔ Radio autofilled:", stringAnswer);
        } else {
          setValue(questionId, "", {
            shouldValidate: true,
            shouldDirty: false,
            shouldTouch: true
          });
          console.log("🧹 Radio cleared");
        }
      }
      else if (groupType === 'multiple_choice_multiple') {
        if (answer && Array.isArray(answer.answer)) {
          setValue(questionId, JSON.stringify(answer.answer));
          console.log(`✅ Multiple choice multiple filled: ${answer.answer.join(', ')}`);
        } else {
          setValue(questionId, JSON.stringify([]));
        }
      }
      else if ((groupType === 'summary_completion' || groupType === 'note_completion' || 
                groupType === 'form_completion') && hasPlaceholders(questionText)) {
        const placeholderCount = (questionText.match(/\{\{\d+\}\}/g) || []).length;
        if (answer && Array.isArray(answer.answer)) {
          for (let i = 0; i < placeholderCount; i++) {
            const subQuestionId = `${questionId}_${i + 1}`;
            setValue(subQuestionId, answer.answer[i] || '');
          }
        } else {
          for (let i = 1; i <= placeholderCount; i++) {
            const subQuestionId = `${questionId}_${i}`;
            const subAnswer = userAnswers.find(ans => ans.questionId === subQuestionId);
            setValue(subQuestionId, subAnswer?.answer || '');
          }
        }
      }
      else {
        if (answer && answer.answer) {
          setValue(questionId, answer.answer);
        } else {
          setValue(questionId, '');
        }
      }
    }, 100);
  };

  const handleTimeUp = (): void => {
    console.log("Time's up! Auto-submitting...");
    handleSubmit(onSubmit)();
  };

  const handleNextQuestion = async () => {
    try {
      setIsSubmitting(true);
      const currentAnswers = watch();
      const formattedAnswers = formatAnswersForSubmission(currentAnswers);

      const totalAnswerSlots = calculateTotalQuestions();
      const isLastQuestion = currentQuestionIndex >= totalAnswerSlots - 1;

      console.log("🔍 Question Check:", {
        currentQuestionIndex,
        totalAnswerSlots,
        isLastQuestion
      });

      const submissionData = {
        answers: formattedAnswers,
        lastQuestionIndex: currentQuestionIndex,
        timeSpent: 60 * 60 - timeLeft,
        completed: isLastQuestion,
      };

      console.log("➡️ Submitting answers:", submissionData);

      let response;
      try {
        response = await api.post(`/test/session/${sessionId}/submit`, submissionData);
      } catch (submitError) {
        console.error("❌ Submit error:", submitError);
        // fallback: still move to next question if not last
        if (!isLastQuestion) {
          const newIndex = currentQuestionIndex + 1;
          setCurrentQuestionIndex(newIndex);
          setTimeout(() => autoFillQuestionByIndex(newIndex), 100);
        }
        return;
      }

      if (response?.data?.success) {
        if (response.data.isTestCompleted) {
          console.log("🎯 Test marked as completed by API");
          setIsTestCompleted(true);

          if (response.data.analysis) {
            setTestResults(response.data.analysis);
            console.log("✅ Results summary should show now");
          } else {
            console.log("❌ No analysis data in response");
          }
        } else {
          setTestData(prev => ({
            ...prev,
            ...response.data,
            progress: response.data.progress || prev.progress
          }));

          // Update total questions when moving to next section
          if (currentQuestionIndex === totalAnswerSlots - 1) {
            const currentSectionTotal = calculateTotalQuestions();
            setTotalQuestionsFromPrevious(prev => prev + currentSectionTotal);
            console.log("🆕 Updated totalQuestionsFromPrevious:", totalQuestionsFromPrevious + currentSectionTotal);
          }
        }

        if (!isLastQuestion) {
          console.log("➡️ Moving to next question");
          const newIndex = currentQuestionIndex + 1;
          setCurrentQuestionIndex(newIndex);
          setTimeout(() => autoFillQuestionByIndex(newIndex, response.data), 100);
        } else {
          console.log("🎯 LAST QUESTION - Showing results directly");
          if (response.data.isTestCompleted && response.data.analysis) {
            setIsTestCompleted(true);
            setTestResults(response.data.analysis);
            console.log("✅ Results summary should show now");
          } else {
            console.log("❌ No analysis data in response");
          }
        }
      } else {
        console.warn("⚠️ Submit returned success=false", response?.data);
      }

    } catch (err) {
      console.error("❌ handleNextQuestion error:", err);
      alert("Error moving to next question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToPreviousQuestion = async () => {
    try {
      if (currentQuestionIndex > 0) {
        setIsSubmitting(true);
        const currentAnswers = watch();
        const formattedAnswers = formatAnswersForSubmission(currentAnswers);

        const response = await api.get(`/test/session/${sessionId}/previous`);
        if (response.data.success) {
          setTestData(prev => ({
            ...prev,
            ...response.data,
            currentQuestion: response.data.currentQuestion || response.data.data?.currentQuestion,
            progress: response.data.progress || response.data.data?.progress || prev.progress
          }));

          const progress = response.data.progress || response.data.data?.progress;
          const newIndex = progress?.currentQuestion !== undefined ? progress.currentQuestion - 1 : currentQuestionIndex - 1;
          setCurrentQuestionIndex(newIndex);
          setTimeout(() => autoFillQuestionByIndex(newIndex, response.data), 100);
        }
      }
    } catch (err) {
      if (currentQuestionIndex > 0) {
        const newIndex = currentQuestionIndex - 1;
        setCurrentQuestionIndex(newIndex);
        setTimeout(() => autoFillQuestionByIndex(newIndex), 100);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    console.log("🔍 STATE DEBUG:", {
      isTestCompleted,
      testResults: testResults ? "HAS RESULTS" : "NO RESULTS",
      isSubmitting,
      loading
    });
  }, [isTestCompleted, testResults, isSubmitting, loading]);

useEffect(() => {
  if (!testId) return;
  
  const fetchTestData = async () => {
    try {
      setLoading(true);
      const response = await api.post('/test/start', {
        testSeriesId: testId
      });
      setTestData(response.data);
      
      const sessionId = response.data?.sessionId ||
        response.data?.testSessionId ||
        response.data?.data?.sessionId ||
        response.data?.data?.testSessionId;
      setSessionId(sessionId);

      // Save starting question number for numbering
      if (response.data.numbering?.firstSectionQuestionNumber) {
        setStartingQuestionNumber(response.data.numbering.firstSectionQuestionNumber);
      } else {
        
      }

      // Save total questions for display
      if (response.data.numbering?.totalSectionQuestions) {
        setTotalQuestions(response.data.numbering.totalSectionQuestions);
      } else if (response.data.currentQuestion?.totalQuestions) {
        setTotalQuestions(response.data.currentQuestion.totalQuestions);
      } else {
        const calculatedTotal = calculateTotalQuestions();
        setTotalQuestions(calculatedTotal);
      }

      // Set initial time for Timer component
      let initialTime = 60 * 60; // Default fallback
      if (response.data.timeRemaining) {
        initialTime = response.data.timeRemaining;
      } else if (response.data.duration || response.data?.data?.duration) {
        const duration = response.data.duration || response.data?.data?.duration;
        initialTime = duration * 60;
      }
      setTimeLeft(initialTime);

      if (response.data.lastQuestionIndex !== undefined) {
        setCurrentQuestionIndex(response.data.lastQuestionIndex);
      }

      // Auto-fill all saved answers on initial load
      if (response.data.userAnswer) {
        const allQuestions = getAllQuestions();

        // Process all valid answers
        response.data.userAnswer
          .filter(item => item.questionId && item.answer !== null && item.answer !== '')
          .forEach(item => {
            console.log("Setting initial value for:", item.questionId, item.answer);

            // Find the question to determine its type
            const questionIndex = allQuestions?.findIndex(q =>
              q?._id === item.questionId || q?.id === item.questionId
            );

            if (questionIndex !== -1) {
              const question = allQuestions[questionIndex];
              const groupType = findQuestionGroupType(questionIndex);

              if (groupType === 'multiple_choice_multiple') {
                // Multiple Choice Multiple
                if (Array.isArray(item.answer)) {
                  setValue(item.questionId, JSON.stringify(item.answer));
                }
              }
              else if (groupType === 'multiple_choice_single') {
                // Multiple Choice Single
                setValue(item.questionId, item.answer);
              }
              else if (groupType === 'summary_completion' || groupType === 'note_completion') {
                // Summary Completion or Note Completion - handle array format
                if (Array.isArray(item.answer)) {
                  const questionText = getSafeQuestionText(question);
                  const placeholderCount = (questionText.match(/\{\{\d+\}\}/g) || []).length;
                  for (let i = 0; i < placeholderCount; i++) {
                    const subQuestionId = `${item.questionId}_${i + 1}`;
                    setValue(subQuestionId, item.answer[i] || '');
                  }
                }
              }
              else {
                // All other question types
                setValue(item.questionId, item.answer);
              }
            } else {
              // If question not found, set value anyway (fallback)
              if (Array.isArray(item.answer)) {
                setValue(item.questionId, JSON.stringify(item.answer));
              } else {
                setValue(item.questionId, item.answer);
              }
            }
          });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load test");
    } finally {
      setLoading(false);
    }
  };
  
  fetchTestData();
}, [testId]);

  useEffect(() => {
    if (testData && testData.currentQuestion) {
      const questionGroups = extractQuestionGroups();
      const allQuestions = getAllQuestions();
    }
  }, [testData]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const onSubmit = async (data) => {
    await handleFinalSubmission(data);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const progress = getProgressInfo();
  const isLastQuestion = progress.current === progress.total;

  const handleFinalSubmission = async (data) => {
    try {
      setIsSubmitting(true);
      const formattedAnswers = formatAnswersForSubmission(data);
      
      const submissionData = {
        answers: formattedAnswers,
        timeSpent: 60 * 60 - timeLeft,
        completed: true
      };

      const response = await api.post(`/test/session/${sessionId}/submit`, submissionData);
      
      if (response.data.success) {
        setIsTestCompleted(true);
        setTestResults(response.data.analysis);
      }
    } catch (error) {
      console.error("Final submission error:", error);
      alert("Error submitting test. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Section detection functions
  const isWritingSection = () => {
    const currentQuestion = getCurrentQuestionData();
    if (!currentQuestion) return false;
    const questionType = currentQuestion.questionType;
    const questionCategory = currentQuestion.questionCategory;
    const sectionType = currentQuestion.sectionType;
    
    return questionType?.includes('writing') || 
           questionCategory?.includes('writing') || 
           sectionType?.includes('writing');
  };

  const isListeningSection = () => {
    const currentQuestion = getCurrentQuestionData();
    if (!currentQuestion) return false;
    const questionType = currentQuestion.questionType;
    const questionCategory = currentQuestion.questionCategory;
    const sectionType = currentQuestion.sectionType;
    
    return questionType?.includes('listening') || 
           questionCategory?.includes('listening') || 
           sectionType?.includes('listening');
  };

  // Render Listening Section
  const renderListeningSection = () => {
    const currentQuestion = getCurrentQuestionData();
    const audioUrl = currentQuestion?.content?.audioUrl;
    const instruction = extractInstruction();
    const totalQuestionsCount = calculateTotalQuestions();
    
    return (
      <div className="fixed inset-0 bg-gray-900 text-white z-50 overflow-hidden">
        {/* Header - Responsive */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <span className="text-lg sm:text-xl font-semibold">Listening Test</span>
              <span className="px-2 sm:px-3 py-1 bg-purple-600 rounded-full text-xs sm:text-sm">
                Section {extractTitle()}
              </span>
            </div>
            <div className="flex items-center space-x-4 sm:space-x-6">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-700 text-white hover:opacity-80 transition-all"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              <Timer
                initialTime={timeLeft}
                onTimeUp={handleTimeUp}
              />
              {isLastQuestion ? (
                <button
                  onClick={handleSubmit(handleFinalSubmission)}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 px-4 sm:px-6 py-2 rounded-lg font-medium transition-all duration-200 text-white disabled:opacity-50 text-sm sm:text-base"
                >
                  {isSubmitting ? "Submitting..." : "Submit Test"}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 px-4 sm:px-6 py-2 rounded-lg font-medium transition-all duration-200 text-white disabled:opacity-50 text-sm sm:text-base"
                >
                  {isSubmitting ? "Loading..." : "Next Question"}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Content - Responsive */}
        <div className="flex flex-col lg:flex-row w-full" style={{ height: 'calc(100vh - 80px)' }}>
          {/* Left Panel - Audio Player and Instructions */}
          <div className="w-full lg:w-1/2 bg-gray-800 p-4 sm:p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Audio Player */}
              {audioUrl && (
                <AudioPlayer audioUrl={audioUrl} darkMode={darkMode} />
              )}
              
              {/* Instructions */}
              <div className="bg-gray-700 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Instructions</h2>
                <div className="prose prose-invert max-w-none text-gray-200 leading-relaxed text-base sm:text-lg">
                  <p className="whitespace-pre-line">{instruction}</p>
                </div>
              </div>

              {/* Transcript (if available) */}
              {currentQuestion?.content?.transcript && (
                <div className="bg-gray-700 rounded-lg p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Transcript</h2>
                  <div className="prose prose-invert max-w-none text-gray-200 leading-relaxed text-sm sm:text-base">
                    <p className="whitespace-pre-line">{currentQuestion.content.transcript}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Questions */}
          <div className="w-full lg:w-1/2 bg-gray-900 p-4 sm:p-6 overflow-y-auto">
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">{extractTitle()}</h1>
              <p className="text-gray-400 text-base sm:text-lg">Complete the questions below as you listen.</p>
            </div>
            
            <form onSubmit={handleSubmit(handleFinalSubmission)} className="space-y-4 sm:space-y-6">
              {getAllQuestions()?.map((question, index) => {
                if (typeof question !== 'object' || !question) return null;
                const questionId = question?._id || question?.id || `q-${index}`;
                const questionText = getSafeQuestionText(question);
                const startingNumber = calculateQuestionStartingNumber(index);
                const hasPlaceholdersFlag = hasPlaceholders(questionText);
                const groupType = findQuestionGroupType(index);
                
                let displayNumber;
                let showQuestionNumber = true;
                
                if (hasPlaceholdersFlag) {
                  showQuestionNumber = false;
                  displayNumber = startingNumber;
                } else {
                  displayNumber = startingNumber.toString();
                }
                
                return (
                  <div key={questionId} className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      {showQuestionNumber && (
                        <span className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 text-white rounded-full flex items-center justify-center text-base sm:text-lg font-medium">
                          {displayNumber}
                        </span>
                      )}
                      {!showQuestionNumber && (
                        <span className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 rounded-full flex items-center justify-center text-base sm:text-lg font-medium opacity-0">
                          {index + 1}
                        </span>
                      )}
                      <SafeQuestionRenderer
                        question={question}
                        questionId={questionId}
                        index={index}
                        groupType={groupType}
                      />
                    </div>
                  </div>
                );
              })}
              
              <div className="flex justify-between mt-6 pt-6 border-t border-gray-700">
                {currentQuestionIndex > 0 ? (
                  <button
                    type="button"
                    onClick={goToPreviousQuestion}
                    disabled={isSubmitting}
                    className="px-4 sm:px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base"
                  >
                    {isSubmitting ? "Loading..." : "Previous Question"}
                  </button>
                ) : (
                  <div></div>
                )}
                {isLastQuestion ? (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Test"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    disabled={isSubmitting}
                    className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base"
                  >
                    {isSubmitting ? "Loading..." : "Next Question"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Render Reading Section (default)
  const renderReadingSection = () => {
    const totalQuestionsCount = calculateTotalQuestions();
    
    return (
      <div className="fixed inset-0 bg-gray-900 text-white z-50 overflow-hidden">
        <div className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <span className="text-lg sm:text-xl font-semibold">Question {extractTitle()}</span>
            </div>
            <div className="flex items-center space-x-4 sm:space-x-6">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-700 text-white hover:opacity-80 transition-all"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              <Timer
                initialTime={timeLeft}
                onTimeUp={handleTimeUp}
              />
             
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row w-full" style={{ height: 'calc(100vh - 80px)' }}>
          <div className="w-full lg:w-1/2 bg-gray-800 p-4 sm:p-6 overflow-y-auto">
            <div className="bg-gray-700 rounded-lg p-4 sm:p-6 h-full">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Reading Passage</h2>
              <div
                className="prose prose-invert max-w-none text-gray-200 leading-relaxed text-base sm:text-lg"
                dangerouslySetInnerHTML={{ __html: extractContent() }}
              />
            </div>
          </div>
          <div className="w-full lg:w-1/2 bg-gray-900 p-4 sm:p-6 overflow-y-auto">
            <div className="mb-6">
              <h1 className="text-lg sm:text-xl font-semibold">Question {extractTitle()}</h1>
              <p className="text-gray-400 mb-6 text-base sm:text-lg whitespace-pre-line">{extractInstruction()}</p>
            </div>
            <form onSubmit={handleSubmit(handleFinalSubmission)} className="space-y-4 sm:space-y-6">
             {getAllQuestions()?.map((question, index) => {
  if (typeof question !== 'object' || !question) return null;
  
  const questionId = question?._id || question?.id || `q-${index}`;
  const questionText = getSafeQuestionText(question);
  const hasPlaceholdersFlag = hasPlaceholders(questionText);
  const groupType = findQuestionGroupType(index);
  
  // Calculate actual display number based on startingQuestionNumber
  const actualQuestionNumber = startingQuestionNumber + index;
  
  let displayNumber;
  let showQuestionNumber = true;
  
  if (hasPlaceholdersFlag) {
    showQuestionNumber = false;
    displayNumber = actualQuestionNumber; // Starting number for placeholders
  } else if (groupType === 'multiple_choice_multiple' &&
    (questionText?.includes('TWO') || questionText?.includes('10-11') || questionText?.includes('12-13'))) {
    
    // Special case: multiple questions with range
    const nextQuestionNumber = actualQuestionNumber + 1;
    displayNumber = `${actualQuestionNumber}-${nextQuestionNumber}`;
    
    // Skip next question since it's included in range
    // (You might need to handle this differently based on your logic)
    
  } else {
    displayNumber = actualQuestionNumber.toString();
  }
  
  return (
    <div key={questionId} className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
      <div className="flex items-start space-x-3 sm:space-x-4">
        {showQuestionNumber && (
          <span className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-base sm:text-lg font-medium">
            {displayNumber}
          </span>
        )}
        {!showQuestionNumber && (
          <span className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 rounded-full flex items-center justify-center text-base sm:text-lg font-medium opacity-0">
            {index + 1}
          </span>
        )}
        <SafeQuestionRenderer
          question={question}
          questionId={questionId}
          index={index}
          groupType={groupType}
          questionNumber={actualQuestionNumber} // Pass question number as prop
        />
      </div>
    </div>
  );
})}
              <div className="flex justify-between mt-6 pt-6 border-t border-gray-700">
                {currentQuestionIndex > 0 ? (
                  <button
                    type="button"
                    onClick={goToPreviousQuestion}
                    disabled={isSubmitting}
                    className="px-4 sm:px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base"
                  >
                    {isSubmitting ? "Loading..." : "Previous Question"}
                  </button>
                ) : (
                  <div></div>
                )}
                {isLastQuestion ? (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Test"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    disabled={isSubmitting}
                    className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base"
                  >
                    {isSubmitting ? "Loading..." : "Next Question"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

if (isTestCompleted && testResults) {
  console.log("🎯 RENDERING RESULTS SUMMARY - Conditions met!");
  
  // Check if it's a writing test or reading test
  const isWritingTest = () => {
    // Check based on test results structure or current section
    if (testResults.sectionWiseAnalysis) {
      const writingSection = testResults.sectionWiseAnalysis.find(
        (section: any) => section.sectionType === 'writing' || section.sectionType === 'Writing'
      );
      return !!writingSection;
    }
    
    // Alternative check based on question analysis
    if (testResults.questionAnalysis) {
      const writingQuestions = testResults.questionAnalysis.filter(
        (q: any) => q.sectionType === 'writing' || q.sectionType === 'Writing'
      );
      return writingQuestions.length > 0;
    }
    
    // Fallback: check if we're currently in writing section
    return currentSection === 'writing';
  };

  const isWriting = isWritingTest();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {isWriting ? (
        <WritingSummary
          results={testResults} 
          onClose={() => setIsTestCompleted(false)}
          darkMode={darkMode}
        />
      ) : (
        <ResultsSummary 
          results={testResults} 
          onClose={() => setIsTestCompleted(false)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

  if (isTestCompleted && !testResults) {
    console.log("⚠️ isTestCompleted is true but no testResults");
    return (
      <div className="fixed inset-0 bg-black text-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Loading Results...</h2>
          <p className="text-gray-400">Please wait while we process your results.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black text-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl">Loading test questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black text-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Error Loading Test</h2>
          <p className="text-gray-400 mb-2">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const totalQuestionsCount = calculateTotalQuestions();
  
  // Section routing
  if (isWritingSection()) {
    return (
      <WritingSection
        testId={testId}
        onTestComplete={(results) => {
          setTestResults(results);
          setIsTestCompleted(true);
        }}
        darkMode={darkMode}
      />
    );
  }

  if (isListeningSection()) {
    return renderListeningSection();
  }

  // Default to reading section
  return renderReadingSection();
};

export default TestQuestionPage;