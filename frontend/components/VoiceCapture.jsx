'use client';

import { useState, useRef, useEffect } from 'react';
import useVoiceCommand from '../hooks/useVoiceCommand';

/**
 * VoiceCapture — Central mic button with live transcript display + text fallback.
 * Redesigned to match the reference landing page with dynamic mode-based text,
 * ripple glows, and fallback integrations for class/language settings.
 *
 * @param {Object} props
 * @param {function} props.onCommand - Called with { type, data, meta } after content generation
 * @param {function} props.onQuizCommand - Called with quiz nav commands ('answer', 'next', 'repeat')
 * @param {function} props.onProcessing - Called with true/false when processing state changes
 * @param {function} props.onListeningChange - Called with true/false when mic listening state changes
 * @param {function} props.onError - Called with error message
 * @param {boolean} props.isProcessing - External processing state
 * @param {string} props.activeMode - Active mode ('explain' | 'quiz')
 * @param {string} props.selectedGrade - Active grade ('1'-'12')
 * @param {string} props.selectedLanguage - Selected language
 */
export default function VoiceCapture({
  onCommand = () => {},
  onQuizCommand = () => {},
  onProcessing = () => {},
  onListeningChange = () => {},
  onError = () => {},
  isProcessing = false,
  activeMode = 'explain',
  selectedGrade = '6',
  selectedLanguage = 'Hinglish',
}) {
  const [displayTranscript, setDisplayTranscript] = useState('');
  const [apiError, setApiError] = useState(null);
  const [textInput, setTextInput] = useState('');
  const inputRef = useRef(null);

  // ── Process a command (shared between voice and text input) ──
  const processCommand = async (text) => {
    if (!text.trim()) return;

    setDisplayTranscript(text);
    setApiError(null);

    try {
      onProcessing(true);
      const { sendCommand, getExplanation, getQuiz } = await import('../utils/api');

      // Step 1: Detect intent
      const command = await sendCommand(text);

      // Extract resolved parameters with fallback to manual controls
      const resolvedIntent = command.intent && command.intent !== 'Unknown' && command.intent !== '' ? command.intent : activeMode;
      const resolvedGrade = command.grade && command.grade !== 'Unknown' && command.grade !== '' ? command.grade : selectedGrade;
      const resolvedLanguage = command.language && command.language !== 'Unknown' && command.language !== '' ? command.language : selectedLanguage;

      // Step 2: Based on intent, fetch content
      if (resolvedIntent === 'explain') {
        const explanation = await getExplanation(
          command.topic || text,
          resolvedGrade,
          resolvedLanguage
        );
        onCommand({
          type: 'explain',
          data: explanation,
          meta: { ...command, intent: 'explain', grade: resolvedGrade, language: resolvedLanguage, topic: command.topic || text }
        });
      } else if (resolvedIntent === 'quiz') {
        const quiz = await getQuiz(command.topic || text, resolvedGrade, 5);
        onCommand({
          type: 'quiz',
          data: quiz,
          meta: { ...command, intent: 'quiz', grade: resolvedGrade, topic: command.topic || text }
        });
      } else {
        setApiError(`Unknown command intent: "${resolvedIntent}". Try saying "Explain..." or "Quiz on..."`);
        onError(`Unknown intent: ${resolvedIntent}`);
      }
    } catch (err) {
      const errorMsg = err.message || 'Something went wrong. Please try again.';
      setApiError(errorMsg);
      onError(errorMsg);
    } finally {
      onProcessing(false);
    }
  };

  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
  } = useVoiceCommand({
    lang: selectedLanguage === 'Hindi' ? 'hi-IN' : 'hi-IN', // Keep hi-IN for Hinglish/Hindi
    continuous: true,
    onResult: (text) => processCommand(text),
    onInterim: (text) => setDisplayTranscript(text),
    onQuizCommand: (cmd) => onQuizCommand(cmd),
  });

  // Notify parent of listening state transitions
  useEffect(() => {
    onListeningChange(isListening);
  }, [isListening, onListeningChange]);

  const handleMicClick = () => {
    if (isProcessing) return;

    if (isListening) {
      stopListening();
    } else {
      setApiError(null);
      setDisplayTranscript('');
      startListening();
    }
  };

  // ── Text input submit ──
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    processCommand(textInput.trim());
    setTextInput('');
  };

  const micStateClass = isProcessing
    ? 'processing'
    : isListening
    ? 'listening'
    : apiError || speechError
    ? 'error'
    : '';

  // Dynamic Content based on selected mode
  const titleText =
    activeMode === 'explain'
      ? 'Bring Lessons to Life with Voice-Powered AI'
      : 'Engage Your Classroom with Interactive Voice Quizzes';

  const subtitleText =
    activeMode === 'explain'
      ? 'Hands-free bilingual co-pilot for classrooms. Speak naturally in Hinglish to explain any topic instantly! 🎙️'
      : 'Trigger a dynamic, real-time assessment on any topic using simple voice commands. Keep students active! 📝';

  const voiceHintText =
    activeMode === 'explain'
      ? 'e.g. "Explain photosynthesis class 6"'
      : 'e.g. "Quiz on water cycle class 7"';

  return (
    <div className="voice-area">
      <h1 className="voice-main-title">{titleText}</h1>
      <p className="voice-subtitle">{subtitleText}</p>

      {/* Mic Button with ripple effects */}
      <div className={`mic-button-wrapper ${isListening ? 'listening' : ''}`}>
        <span className="mic-ripple"></span>
        <span className="mic-ripple"></span>
        <span className="mic-ripple"></span>
        <button
          id="mic-button"
          className={`mic-button ${micStateClass}`}
          onClick={handleMicClick}
          disabled={isProcessing}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isProcessing ? (
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 4 }}></div>
          ) : (
            '🎤'
          )}
        </button>
      </div>

      <div className="mic-tap-label">Tap the mic to start</div>

      {/* Wave Visualizer (visible when listening) */}
      {isListening && (
        <div className="wave-visualizer">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="wave-bar"></div>
          ))}
        </div>
      )}

      {/* Text Input Fallback */}
      <form onSubmit={handleTextSubmit} className="text-input-form" id="text-command-form">
        <input
          ref={inputRef}
          type="text"
          className="text-input"
          placeholder={`Or type a command... ${voiceHintText}`}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          disabled={isProcessing}
          id="text-command-input"
        />
        <button
          type="submit"
          className="text-submit-btn"
          disabled={isProcessing || !textInput.trim()}
          id="text-command-submit"
        >
          Send
        </button>
      </form>

      {/* Live Transcript */}
      {(displayTranscript || interimTranscript) && (
        <div className="transcript-pill">
          <span className="transcript-label">🎙️ Heard:</span>
          <span>{displayTranscript || interimTranscript}</span>
        </div>
      )}

      {/* Status label */}
      {isProcessing && (
        <div className="transcript-pill" style={{ borderColor: 'rgba(255, 195, 18, 0.3)' }}>
          <span className="transcript-label" style={{ color: 'var(--accent-orange)' }}>
            ⚡ Processing:
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>Generating content with AI...</span>
        </div>
      )}

      {/* Error display */}
      {(apiError || speechError) && (
        <div className="error-banner">
          ⚠️ {apiError || speechError}
        </div>
      )}
    </div>
  );
}
