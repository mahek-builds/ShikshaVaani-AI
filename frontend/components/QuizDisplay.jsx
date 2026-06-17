'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * QuizDisplay — Fullscreen MCQ quiz with timer, voice navigation, and answer reveal.
 *
 * @param {Object} props
 * @param {Object} props.data - Quiz data from the API
 * @param {string} props.data.quiz_title
 * @param {Array} props.data.questions
 * @param {string|null} props.voiceCommand - Current voice command ('answer', 'next', 'repeat')
 * @param {function} props.onVoiceCommandHandled - Call after handling a voice command
 * @param {boolean} props.enableTTS - Auto-read questions via TTS
 * @param {number} props.timerDuration - Seconds per question (default: 30)
 */
export default function QuizDisplay({
  data,
  voiceCommand = null,
  onVoiceCommandHandled = () => {},
  enableTTS = true,
  timerDuration = 30,
  isTeacher = false,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null); // letter: 'A', 'B', 'C', 'D'
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);

  // Load initial quiz state on client mount to avoid SSR hydration mismatch
  useEffect(() => {
    if (!isTeacher && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('shikshaVaani-quizState');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.currentIndex !== undefined) setCurrentIndex(parsed.currentIndex);
          if (parsed.showAnswer !== undefined) setShowAnswer(parsed.showAnswer);
          if (parsed.selectedOption !== undefined) setSelectedOption(parsed.selectedOption);
          if (parsed.score !== undefined) setScore(parsed.score);
          if (parsed.isComplete !== undefined) setIsComplete(parsed.isComplete);
        }
      } catch (e) {}
    }
  }, [isTeacher]);

  const timerRef = useRef(null);
  const hasSpokenRef = useRef(false);

  const questions = data?.questions || [];
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  // ── BroadcastChannel for Teacher sync ──
  const [syncChannel, setSyncChannel] = useState(null);

  useEffect(() => {
    if (!isTeacher || typeof window === 'undefined') return;
    const bc = new BroadcastChannel('shikshaVaani-board');
    setSyncChannel(bc);
    return () => bc.close();
  }, [isTeacher]);

  const broadcastAction = useCallback((cmd) => {
    if (syncChannel) {
      syncChannel.postMessage({ type: 'quizCommand', payload: cmd });
    }
  }, [syncChannel]);

  useEffect(() => {
    if (isTeacher && typeof window !== 'undefined') {
      localStorage.setItem(
        'shikshaVaani-quizState',
        JSON.stringify({ currentIndex, showAnswer, selectedOption, score, isComplete })
      );
    }
  }, [isTeacher, currentIndex, showAnswer, selectedOption, score, isComplete]);

  // ── Timer Logic ──
  useEffect(() => {
    if (!currentQuestion || showAnswer || isComplete) {
      clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(timerDuration);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, showAnswer, isComplete, timerDuration]);

  // Auto-reveal when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && !showAnswer && !isComplete) {
      handleRevealAnswer();
    }
  }, [timeLeft]);

  // ── TTS: Read question aloud ──
  const speakQuestion = useCallback(() => {
    if (!currentQuestion || !enableTTS) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    if (window) window.shikshaVaaniTTSActive = true;

    const questionText = currentQuestion.question;
    const utterance = new SpeechSynthesisUtterance(questionText);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.9;

    // Read options after question
    utterance.onend = () => {
      let optionsPlayed = 0;
      if (currentQuestion.options.length === 0) {
        if (window) window.shikshaVaaniTTSActive = false;
      }
      currentQuestion.options.forEach((opt, i) => {
        const optUtterance = new SpeechSynthesisUtterance(opt);
        optUtterance.lang = 'hi-IN';
        optUtterance.rate = 0.9;
        optUtterance.onend = () => {
          optionsPlayed++;
          if (optionsPlayed === currentQuestion.options.length) {
            if (window) window.shikshaVaaniTTSActive = false;
          }
        };
        optUtterance.onerror = () => {
          optionsPlayed++;
          if (optionsPlayed === currentQuestion.options.length) {
            if (window) window.shikshaVaaniTTSActive = false;
          }
        };
        window.speechSynthesis.speak(optUtterance);
      });
    };

    utterance.onerror = () => {
      if (window) window.shikshaVaaniTTSActive = false;
    };

    window.speechSynthesis.speak(utterance);
  }, [currentQuestion, enableTTS]);

  // Auto-read when question changes
  useEffect(() => {
    if (!currentQuestion || isComplete) return;
    hasSpokenRef.current = false;

    const timer = setTimeout(() => {
      if (!hasSpokenRef.current) {
        hasSpokenRef.current = true;
        speakQuestion();
      }
    }, 600);

    return () => {
      clearTimeout(timer);
      window.speechSynthesis?.cancel();
      if (typeof window !== 'undefined') {
        window.shikshaVaaniTTSActive = false;
      }
    };
  }, [currentIndex, speakQuestion, isComplete]);

  // ── Voice Command Handling ──
  const handleRevealAnswerRef = useRef(null);
  const handleNextQuestionRef = useRef(null);
  const speakQuestionRef = useRef(speakQuestion);
  const handleOptionClickRef = useRef(null);

  // Keep refs in sync
  useEffect(() => {
    handleRevealAnswerRef.current = handleRevealAnswer;
    handleNextQuestionRef.current = handleNextQuestion;
    speakQuestionRef.current = speakQuestion;
    handleOptionClickRef.current = handleOptionClick;
  });

  useEffect(() => {
    if (!voiceCommand || isComplete) return;

    switch (voiceCommand) {
      case 'answer':
        handleRevealAnswerRef.current?.();
        break;
      case 'next':
        handleNextQuestionRef.current?.();
        break;
      case 'repeat':
        speakQuestionRef.current?.();
        break;
      case 'option_a':
        handleOptionClickRef.current?.('A');
        break;
      case 'option_b':
        handleOptionClickRef.current?.('B');
        break;
      case 'option_c':
        handleOptionClickRef.current?.('C');
        break;
      case 'option_d':
        handleOptionClickRef.current?.('D');
        break;
    }

    onVoiceCommandHandled();
  }, [voiceCommand, isComplete, onVoiceCommandHandled]);

  // ── Manual option click ──
  const handleOptionClick = (letter) => {
    if (showAnswer || isComplete) return;

    setSelectedOption(letter);
    setShowAnswer(true);
    clearInterval(timerRef.current);

    // Track score
    if (letter === currentQuestion.answer) {
      setScore((prev) => prev + 1);
    }

    if (isTeacher) {
      broadcastAction('option_' + letter.toLowerCase());
    }

    // TTS: read the answer
    if (enableTTS && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.shikshaVaaniTTSActive = true;
      const isCorrect = letter === currentQuestion.answer;
      const answerText = isCorrect
        ? `Correct! ${currentQuestion.explanation}`
        : `Wrong! Correct answer is ${currentQuestion.answer}. ${currentQuestion.explanation}`;
      const utterance = new SpeechSynthesisUtterance(answerText);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.9;
      utterance.onend = () => { if (window) window.shikshaVaaniTTSActive = false; };
      utterance.onerror = () => { if (window) window.shikshaVaaniTTSActive = false; };
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRevealAnswer = () => {
    if (showAnswer || isComplete) return;
    setShowAnswer(true);
    clearInterval(timerRef.current);

    if (isTeacher) {
      broadcastAction('answer');
    }

    // TTS: read the answer
    if (enableTTS && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.shikshaVaaniTTSActive = true;
      const answerText = `Correct answer: ${currentQuestion.answer}. ${currentQuestion.explanation}`;
      const utterance = new SpeechSynthesisUtterance(answerText);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.9;
      utterance.onend = () => { if (window) window.shikshaVaaniTTSActive = false; };
      utterance.onerror = () => { if (window) window.shikshaVaaniTTSActive = false; };
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNextQuestion = () => {
    if (!showAnswer) {
      // Reveal answer first if not shown
      handleRevealAnswer();
      return;
    }

    window.speechSynthesis?.cancel();

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowAnswer(false);
      setSelectedOption(null);
      hasSpokenRef.current = false;
    } else {
      setIsComplete(true);
    }

    if (isTeacher) {
      broadcastAction('next');
    }
  };

  // ── Timer display class ──
  const timerClass =
    timeLeft <= 5
      ? 'quiz-timer danger'
      : timeLeft <= 10
      ? 'quiz-timer warning'
      : 'quiz-timer';

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!data || !questions.length) return null;

  // ── Quiz Complete Screen ──
  if (isComplete) {
    const percentage = Math.round((score / totalQuestions) * 100);
    const emoji = percentage >= 80 ? '🏆' : percentage >= 50 ? '👍' : '📚';

    return (
      <div className="quiz-container" id="quiz-display">
        <div className="quiz-complete">
          <div className="quiz-complete-icon">{emoji}</div>
          <h2>Quiz Complete!</h2>
          <p>{data.quiz_title}</p>
          <div className="quiz-score-card">
            <span className="quiz-score-number">{score}/{totalQuestions}</span>
            <span className="quiz-score-label">Score: {percentage}%</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-lg)' }}>
            Say a new command to continue teaching
          </p>
        </div>
      </div>
    );
  }

  // ── Get the answer letter from option string ──
  const getOptionLetter = (option) => {
    const match = option.match(/^([A-D])\./);
    return match ? match[1] : '';
  };

  return (
    <div className="quiz-container" id="quiz-display">
      {/* Header: Progress + Timer */}
      <div className="quiz-header">
        <div className="quiz-progress">
          <span className="quiz-progress-label">
            Q{currentIndex + 1} / {totalQuestions}
          </span>
          <div className="quiz-progress-bar">
            <div
              className="quiz-progress-fill"
              style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>
          {/* Score tracker */}
          <span className="quiz-score-inline">✅ {score}</span>
        </div>
        <div className={timerClass}>
          <span>⏱️</span>
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Question */}
      <div className="quiz-question" key={currentIndex}>
        <p className="quiz-question-text">{currentQuestion.question}</p>

        {/* Options Grid — clickable */}
        <div className="quiz-options">
          {currentQuestion.options.map((option, i) => {
            const letter = getOptionLetter(option);
            const isCorrectAnswer = letter === currentQuestion.answer;
            const isSelected = selectedOption === letter;

            let optionClass = 'quiz-option';
            if (showAnswer) {
              if (isCorrectAnswer) {
                optionClass += ' correct';
              } else if (isSelected && !isCorrectAnswer) {
                optionClass += ' wrong';
              } else {
                optionClass += ' dimmed';
              }
            }

            return (
              <button
                key={i}
                className={optionClass}
                id={`quiz-option-${letter}`}
                onClick={() => handleOptionClick(letter)}
                disabled={showAnswer}
              >
                <span className="quiz-option-letter">{letter}</span>
                <span>{option.replace(/^[A-D]\.\s*/, '')}</span>
              </button>
            );
          })}
        </div>

        {/* Answer Explanation (shown after reveal) */}
        {showAnswer && (
          <div className="quiz-explanation">
            <span className="quiz-explanation-icon">
              {selectedOption === currentQuestion.answer ? '✅' : selectedOption ? '❌' : '💡'}
            </span>
            <span>
              <strong>Answer: {currentQuestion.answer}</strong> —{' '}
              {currentQuestion.explanation}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="quiz-actions">
        {!showAnswer ? (
          <button
            className="quiz-action-btn reveal-btn"
            onClick={handleRevealAnswer}
            id="reveal-answer-btn"
          >
            💡 Show Answer
          </button>
        ) : (
          <button
            className="quiz-action-btn next-btn"
            onClick={handleNextQuestion}
            id="next-question-btn"
          >
            {currentIndex < totalQuestions - 1 ? '➡️ Next Question' : '🏁 Finish Quiz'}
          </button>
        )}
      </div>

      {/* Voice Hint */}
      <div className="voice-hint">
        🎙️ Say{' '}
        {!showAnswer ? (
          <>
            <code>answer</code> to reveal • click an option to choose
          </>
        ) : (
          <>
            <code>next</code> to continue
          </>
        )}
      </div>
    </div>
  );
}
