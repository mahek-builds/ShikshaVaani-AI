'use client';

import { useState, useCallback, useEffect } from 'react';
import ExplainCard from './ExplainCard';
import QuizDisplay from './QuizDisplay';

/**
 * SmartBoardDisplay — Wrapper component managing the projection screen state.
 * Conditionally renders ExplainCard or QuizDisplay based on the current content mode.
 * Shows branded idle screen when no content is active.
 *
 * @param {Object} props
 * @param {Object|null} props.content - Current content to display
 * @param {string} props.content.type - 'explain' or 'quiz'
 * @param {Object} props.content.data - Content data from the API
 * @param {string|null} props.quizCommand - Voice command for quiz navigation
 * @param {function} props.onQuizCommandHandled - Called after quiz command is processed
 * @param {boolean} props.showIdleScreen - Whether to show the idle branding screen
 */
export default function SmartBoardDisplay({
  content = null,
  quizCommand = null,
  onQuizCommandHandled = () => {},
  showIdleScreen = true,
  fullscreen = false,
  isTeacher = false,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  // ── Idle Screen ──
  if (!content && showIdleScreen) {
    return (
      <div className={`board-container${fullscreen ? ' board-fullscreen' : ''}`} id="smart-board">
        {!isTeacher && (
          <button
            className="fullscreen-btn"
            onClick={toggleFullscreen}
            id="fullscreen-toggle"
          >
            {isFullscreen ? '⬜ Exit Fullscreen' : '🔲 Enter Fullscreen'}
          </button>
        )}

        <div className="board-idle">
          <div className="board-idle-logo">🎙️</div>
          <h1>ShikshaVaani AI</h1>
          <p>Waiting for teacher&apos;s voice command...</p>
          <div className="waiting-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  // ── Content Display ──
  return (
    <div className={`board-container${fullscreen ? ' board-fullscreen' : ''}`} id="smart-board">
      {!isTeacher && (
        <button
          className="fullscreen-btn"
          onClick={toggleFullscreen}
          id="fullscreen-toggle"
        >
          {isFullscreen ? '⬜ Exit Fullscreen' : '🔲 Enter Fullscreen'}
        </button>
      )}

      {content?.type === 'explain' && (
        <ExplainCard data={content.data} enableTTS={!isTeacher} />
      )}

      {content?.type === 'quiz' && (
        <QuizDisplay
          key={content.data?.quiz_title || 'quiz'}
          data={content.data}
          voiceCommand={quizCommand}
          onVoiceCommandHandled={onQuizCommandHandled}
          enableTTS={!isTeacher}
          timerDuration={30}
          isTeacher={isTeacher}
        />
      )}
    </div>
  );
}
