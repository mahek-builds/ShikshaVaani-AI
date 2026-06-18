'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import VoiceCapture from '../components/VoiceCapture';
import SmartBoardDisplay from '../components/SmartBoardDisplay';

// ── Preset Data ──

const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const EXPLAIN_SUGGESTIONS = [
  { topic: 'Photosynthesis', label: 'Photosynthesis ☀️' },
  { topic: 'Solar System', label: 'Solar System 🌌' },
  { topic: 'Water Cycle', label: 'Water Cycle 💧' },
  { topic: 'Fractions', label: 'Fractions 🍕' }
];

const QUIZ_SUGGESTIONS = [
  { topic: 'Photosynthesis', label: 'Photosynthesis Quiz 📝' },
  { topic: 'Solar System', label: 'Solar System Quiz 📝' },
  { topic: 'Water Cycle', label: 'Water Cycle Quiz 📝' },
  { topic: 'Fractions', label: 'Fractions Quiz 📝' }
];

/**
 * Teacher Dashboard — Main control panel for Shiksha AI.
 */
export default function DashboardPage() {
  const [content, setContent] = useState(null);
  const [quizCommand, setQuizCommand] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [backendOnline, setBackendOnline] = useState(null);

  const [selectedGrade, setSelectedGrade] = useState('6');
  const [selectedLanguage, setSelectedLanguage] = useState('Hinglish');
  const [activeMode, setActiveMode] = useState('explain');
  const [isListening, setIsListening] = useState(false);

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



  // ── BroadcastChannel ──
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bc = new BroadcastChannel('shikshaVaani-board');
    setChannel(bc);
    return () => bc.close();
  }, []);

  // ── Backend Health Check ──
  useEffect(() => {
    let cancelled = false;
    async function ping() {
      try {
        const { checkHealth } = await import('../utils/api');
        const ok = await checkHealth();
        if (!cancelled) setBackendOnline(ok);
      } catch {
        if (!cancelled) setBackendOnline(false);
      }
    }
    ping();
    const interval = setInterval(ping, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const { getHistory } = await import('../utils/api');
      const data = await getHistory();
      setRecentActivity(data);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }, []);

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleLoadHistoryItem = useCallback((item) => {
    const formattedContent = {
      type: 'explain',
      data: {
        title: item.title,
        explanation: item.explanation,
        analogy: item.analogy,
        visual_points: item.visual_points,
        key_terms: item.key_terms,
        fun_fact: item.fun_fact
      },
      meta: {
        topic: item.topic,
        grade: item.grade,
        language: item.language
      }
    };
    setContent(formattedContent);
    if (channel) channel.postMessage({ type: 'content', payload: formattedContent });
    if (typeof window !== 'undefined') {
      localStorage.setItem('shikshaVaani-content', JSON.stringify(formattedContent));
      localStorage.removeItem('shikshaVaani-quizState');
    }
  }, [channel]);

  const broadcastContent = useCallback((newContent) => {
    if (channel) channel.postMessage({ type: 'content', payload: newContent });
  }, [channel]);

  const broadcastQuizCommand = useCallback((cmd) => {
    if (channel) channel.postMessage({ type: 'quizCommand', payload: cmd });
  }, [channel]);

  // ── Handle command result ──
  const handleCommand = useCallback((result) => {
    setContent(result);
    broadcastContent(result);

    if (typeof window !== 'undefined') {
      if (result) {
        localStorage.setItem('shikshaVaani-content', JSON.stringify(result));
      } else {
        localStorage.removeItem('shikshaVaani-content');
      }
      localStorage.removeItem('shikshaVaani-quizState');
    }

    if (result && result.type === 'explain') {
      fetchHistory();
    }
  }, [broadcastContent, fetchHistory]);

  const handleClearContent = useCallback(() => {
    setContent(null);
    broadcastContent(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shikshaVaani-content');
      localStorage.removeItem('shikshaVaani-quizState');
    }
  }, [broadcastContent]);

  const handleQuizCommand = useCallback((cmd) => {
    setQuizCommand(cmd);
    broadcastQuizCommand(cmd);
  }, [broadcastQuizCommand]);

  const handleQuizCommandHandled = useCallback(() => {
    setQuizCommand(null);
  }, []);

  const openBoard = () => {
    window.open('/board', '_blank', 'noopener');
  };

  // ── Quick topic action ──
  const handleTopicAction = async (topic, mode) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (mode === 'explain') {
        const { getExplanation } = await import('../utils/api');
        const data = await getExplanation(topic, selectedGrade, selectedLanguage);
        handleCommand({ type: 'explain', data, meta: { topic, grade: selectedGrade, language: selectedLanguage } });
      } else {
        const { getQuiz } = await import('../utils/api');
        const data = await getQuiz(topic, selectedGrade, 5);
        handleCommand({ type: 'quiz', data, meta: { topic, grade: selectedGrade } });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };



  // Get active status state
  let statusClass = 'off';
  let statusText = 'Off';

  if (backendOnline === false) {
    statusClass = 'offline';
    statusText = 'Offline';
  } else if (isProcessing) {
    statusClass = 'processing';
    statusText = 'Processing';
  } else if (isListening) {
    statusClass = 'listening';
    statusText = 'Listening';
  }

  const suggestions = activeMode === 'explain' ? EXPLAIN_SUGGESTIONS : QUIZ_SUGGESTIONS;

  return (
    <div className="animated-bg">
      <div className="dashboard">
        {/* ── Header ── */}
        <header className="dashboard-header">
          <div className="dashboard-logo">
            <div className="logo-shield">
              <span className="logo-emoji">🎓</span>
            </div>
            <div>
              <h1 className="logo-title">ShikshaVaani AI</h1>
              <span className="logo-subtitle">VOICE TEACHING ASSISTANT</span>
            </div>
          </div>

          <div className="header-controls">
            {/* Mode Toggle pills */}
            <div className="mode-toggle">
              <button
                className={`mode-btn ${activeMode === 'explain' ? 'active' : ''}`}
                onClick={() => setActiveMode('explain')}
                type="button"
                id="mode-explain-pill"
              >
                Explain
              </button>
              <button
                className={`mode-btn ${activeMode === 'quiz' ? 'active' : ''}`}
                onClick={() => setActiveMode('quiz')}
                type="button"
                id="mode-quiz-pill"
              >
                Quiz
              </button>
            </div>

            {/* Language Selector */}
            <div className="header-dropdown-container">
              <select
                className="header-dropdown"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                id="lang-selector"
              >
                <option value="Hinglish">Language: Hinglish</option>
                <option value="Hindi">Language: Hindi</option>
                <option value="English">Language: English</option>
              </select>
            </div>

            {/* Grade Selector */}
            <div className="header-dropdown-container">
              <select
                className="header-dropdown"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                id="grade-selector"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    Class: {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Status dot */}
            <div className={`status-pill ${statusClass}`}>
              <span className="status-dot-core"></span>
              <span className="status-label">{statusText}</span>
            </div>

            <button className="board-link" onClick={openBoard} id="open-board-btn">
              📺 Smart Board ↗
            </button>
          </div>
        </header>

        {/* ── Main ── */}
        <main className="dashboard-main">
          {/* ── Voice / Text Command ── */}
          <section className="section-block">
            <VoiceCapture
              onCommand={handleCommand}
              onQuizCommand={handleQuizCommand}
              onProcessing={setIsProcessing}
              onListeningChange={setIsListening}
              isProcessing={isProcessing}
              activeMode={activeMode}
              selectedGrade={selectedGrade}
              selectedLanguage={selectedLanguage}
              onError={(err) => console.error('Voice error:', err)}
            />
          </section>

          {/* Suggestions */}
          <section className="section-block suggestions-block">
            <div className="trending-suggestions">
              <span className="suggestions-title">Quick Topics:</span>
              <div className="suggestions-list">
                {suggestions.map((item) => (
                  <button
                    key={item.topic}
                    className="suggestion-chip"
                    onClick={() => handleTopicAction(item.topic, activeMode)}
                    disabled={isProcessing}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </section>


          {/* ── Content Preview ── */}
          {content && (
            <section className="section-block content-section">
              <div className="content-header">
                <h2 className="section-title">
                  {content.type === 'explain' ? '📖 Explanation' : '📝 Quiz'}
                  {content.meta?.topic ? ` — ${content.meta.topic}` : ''}
                </h2>
                <button
                  className="clear-content-btn"
                  onClick={handleClearContent}
                >
                  ✕ Clear
                </button>
              </div>
              <div className="content-preview-box">
                <SmartBoardDisplay
                  content={content}
                  quizCommand={quizCommand}
                  onQuizCommandHandled={handleQuizCommandHandled}
                  showIdleScreen={false}
                  isTeacher={true}
                />
              </div>
            </section>
          )}

          {/* ── Recent Activity (Database Cache) ── */}
          {recentActivity.length > 0 && (
            <div className="recent-activity">
              <h3>Saved Explanations (DB Cache)</h3>
              <div className="activity-list">
                {recentActivity.map((item) => (
                  <div
                    className="activity-item clickable"
                    key={item.id}
                    onClick={() => handleLoadHistoryItem(item)}
                    title="Click to load onto Smart Board"
                  >
                    <span className="activity-icon">📖</span>
                    <div className="activity-text">
                      <strong>{item.topic}</strong> — Class {item.grade} ({item.language})
                      <br />
                      <span className="activity-title-sub">{item.title || 'Untitled'}</span>
                    </div>
                    <span className="activity-badge explain">
                      Load to Board 📺
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
