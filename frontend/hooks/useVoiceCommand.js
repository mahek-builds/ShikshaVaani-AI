'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Quiz navigation command patterns (module-level constant — never changes)
// Includes common Hinglish, Hindi, and short-form variations
const QUIZ_COMMANDS = {
  answer: /\b(ans|answer|jawab|jawaab|jawab|batao|bata|dikhao|show|उत्तर|जवाब|बताओ|दिखाओ)\b/i,
  next: /\b(next|agle|agla|aage|age|skip|nxt|अगला|नेक्स्ट|आगे|अगले)\b/i,
  repeat: /\b(repeat|dobara|phir\s*se|wapas|fir\s*se|दोबारा|फिर\s*से|वापस|रिपीट)\b/i,
  option_a: /\b(option\s*a|option\s*eh|option\s*1|first\s*option|pehla\s*option)\b|^(a|eh|ए|पहला|pehla|one|1)$/i,
  option_b: /\b(option\s*b|option\s*bee|option\s*2|second\s*option|doosra\s*option)\b|^(b|bee|बी|दूसरा|doosra|two|2)$/i,
  option_c: /\b(option\s*c|option\s*see|option\s*3|third\s*option|teesra\s*option)\b|^(c|see|सी|तीसरा|teesra|three|3)$/i,
  option_d: /\b(option\s*d|option\s*dee|option\s*4|fourth\s*option|chautha\s*option)\b|^(d|dee|डी|चौथा|chautha|four|4)$/i,
};

/**
 * Custom hook for Web Speech API — voice recognition in Hinglish (hi-IN).
 *
 * @param {Object} options
 * @param {string} options.lang - Recognition language (default: 'hi-IN')
 * @param {boolean} options.continuous - Keep listening after speech ends
 * @param {function} options.onResult - Callback with final transcript
 * @param {function} options.onInterim - Callback with interim transcript
 * @param {function} options.onQuizCommand - Callback for quiz navigation commands (answer, next, repeat)
 */
export default function useVoiceCommand({
  lang = 'hi-IN',
  continuous = true,
  onResult = () => {},
  onInterim = () => {},
  onQuizCommand = () => {},
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const shouldRestartRef = useRef(false);

  // Keep callback refs up-to-date so event handlers never use stale closures
  const onResultRef = useRef(onResult);
  const onInterimRef = useRef(onInterim);
  const onQuizCommandRef = useRef(onQuizCommand);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onInterimRef.current = onInterim; }, [onInterim]);
  useEffect(() => { onQuizCommandRef.current = onQuizCommand; }, [onQuizCommand]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      // If TTS is currently speaking, ignore the results to prevent echo/feedback loop
      if (typeof window !== 'undefined' && (window.shikshaVaaniTTSActive || window.speechSynthesis?.speaking)) {
        return;
      }

      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (interimText) {
        setInterimTranscript(interimText);
        onInterimRef.current(interimText);
      }

      if (finalText) {
        const trimmed = finalText.trim();
        setTranscript(trimmed);
        setInterimTranscript('');

        // Stop TTS immediately so it doesn't fight the mic
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }

        // Check if it's a quiz navigation command
        let isQuizCmd = false;
        for (const [cmd, pattern] of Object.entries(QUIZ_COMMANDS)) {
          if (pattern.test(trimmed)) {
            onQuizCommandRef.current(cmd);
            isQuizCmd = true;
            break;
          }
        }

        // If not a quiz command, treat as a full voice command
        if (!isQuizCmd) {
          onResultRef.current(trimmed);
        }
      }
    };

    recognition.onerror = (event) => {
      // 'no-speech' and 'aborted' are expected when stopping — don't treat as errors
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }

      // 'not-allowed' means mic permission was denied — stop completely
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone permission in your browser settings.');
        setIsListening(false);
        isListeningRef.current = false;
        shouldRestartRef.current = false;
        return;
      }

      // For other errors (audio-capture, network, etc.), just log but allow restart
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      isListeningRef.current = false;
      // Don't set shouldRestartRef to false — let onend restart it
    };

    recognition.onend = () => {
      setIsListening(false);
      isListeningRef.current = false;

      // Always auto-restart if we should still be listening
      if (shouldRestartRef.current) {
        setTimeout(() => {
          if (shouldRestartRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // Silently handle — might already be started
            }
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Already stopped
        }
      }
    };
  }, [lang, continuous]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    // Stop TTS if playing — prevents mic from picking up speaker audio
    // and avoids conflicts between audio output and input
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    shouldRestartRef.current = true;

    // Small delay to ensure mic is available after TTS stop
    setTimeout(() => {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already started — stop and restart
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (err) {
                setError('Failed to start speech recognition. Please try again.');
              }
            }
          }, 200);
        } catch (err) {
          setError('Failed to start speech recognition. Please try again.');
        }
      }
    }, 100);
  }, []);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
    }
    setIsListening(false);
    isListeningRef.current = false;
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
  };
}
