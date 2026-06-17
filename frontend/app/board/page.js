'use client';

import { useState, useEffect, useCallback } from 'react';
import SmartBoardDisplay from '../../components/SmartBoardDisplay';
import useVoiceCommand from '../../hooks/useVoiceCommand';

/**
 * Smart Board Projection Page — Fullscreen display for the classroom smart board.
 * Receives content from the teacher dashboard via BroadcastChannel.
 * Also has its own voice command listener for quiz navigation (answer/next/repeat).
 */
export default function BoardPage() {
  const [content, setContent] = useState(null);
  const [quizCommand, setQuizCommand] = useState(null);

  // Load initial content on client mount to avoid SSR hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('shikshaVaani-content');
        if (saved) {
          setContent(JSON.parse(saved));
        }
      } catch (e) {}
    }
  }, []);

  // ── Voice commands for quiz navigation ──
  const { startListening } = useVoiceCommand({
    lang: 'hi-IN',
    continuous: true,
    onResult: () => {
      // Full commands are handled by the dashboard tab — ignore here
    },
    onQuizCommand: (cmd) => {
      setQuizCommand(cmd);
    },
  });

  useEffect(() => {
    startListening();
  }, [startListening]);

  // ── BroadcastChannel: receive content from dashboard ──
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const bc = new BroadcastChannel('shikshaVaani-board');

    bc.onmessage = (event) => {
      const { type, payload } = event.data;

      if (type === 'content') {
        setContent(payload);
        setQuizCommand(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('shikshaVaani-quizState');
        }
      } else if (type === 'quizCommand') {
        setQuizCommand(payload);
      }
    };

    return () => bc.close();
  }, []);

  const handleQuizCommandHandled = useCallback(() => {
    setQuizCommand(null);
  }, []);

  // ── Back to dashboard ──
  const goBack = () => {
    window.close();
    // Fallback if window.close() is blocked
    window.location.href = '/';
  };

  return (
    <>
      <button className="back-link" onClick={goBack} id="back-to-dashboard">
        ← Dashboard
      </button>

      <SmartBoardDisplay
        content={content}
        quizCommand={quizCommand}
        onQuizCommandHandled={handleQuizCommandHandled}
        showIdleScreen={true}
        fullscreen={true}
      />
    </>
  );
}
