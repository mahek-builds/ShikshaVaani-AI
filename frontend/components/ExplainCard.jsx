'use client';

import { useEffect, useRef } from 'react';

/**
 * ExplainCard — Fullscreen explanation display for smart board projection.
 *
 * @param {Object} props
 * @param {Object} props.data - Explanation data from the API
 * @param {string} props.data.title
 * @param {string} props.data.explanation
 * @param {string} props.data.analogy
 * @param {string[]} props.data.visual_points
 * @param {Object[]} props.data.key_terms
 * @param {string} props.data.key_terms[].term
 * @param {string} props.data.key_terms[].meaning
 * @param {string} props.data.fun_fact
 * @param {boolean} props.enableTTS - Whether to auto-read via TTS
 */
export default function ExplainCard({ data, enableTTS = true }) {
  const hasSpokenRef = useRef(false);

  useEffect(() => {
    if (!data || !enableTTS || hasSpokenRef.current) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    hasSpokenRef.current = true;

    // Build the TTS script
    const speakQueue = [];

    // Title
    speakQueue.push(data.title);

    // Explanation
    speakQueue.push(data.explanation);

    // Analogy
    if (data.analogy) {
      speakQueue.push(`Ek analogy se samajhte hain: ${data.analogy}`);
    }

    // Visual points
    if (data.visual_points?.length) {
      data.visual_points.forEach((point) => {
        // Remove leading emoji for cleaner TTS
        const cleanPoint = point.replace(/^[\p{Emoji}\s]+/u, '').trim();
        speakQueue.push(cleanPoint);
      });
    }

    // Key Terms
    if (data.key_terms?.length) {
      speakQueue.push("Kuch zaroori shabd.");
      data.key_terms.forEach((item) => {
        speakQueue.push(`${item.term}, matlab ${item.meaning}`);
      });
    }

    // Fun fact
    if (data.fun_fact) {
      speakQueue.push(`Fun fact: ${data.fun_fact}`);
    }

    // Speak sequentially
    let index = 0;
    if (window) window.shikshaVaaniTTSActive = true;
    const speakNext = () => {
      if (index >= speakQueue.length) {
        if (window) window.shikshaVaaniTTSActive = false;
        return;
      }

      const utterance = new SpeechSynthesisUtterance(speakQueue[index]);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onend = () => {
        index++;
        speakNext();
      };
      utterance.onerror = () => {
        if (window) window.shikshaVaaniTTSActive = false;
      };
      window.speechSynthesis.speak(utterance);
    };

    // Small delay so animations can play first
    const timer = setTimeout(() => speakNext(), 800);

    return () => {
      clearTimeout(timer);
      window.speechSynthesis?.cancel();
      if (typeof window !== 'undefined') {
        window.shikshaVaaniTTSActive = false;
      }
    };
  }, [data, enableTTS]);

  // Reset spoken flag when data changes
  useEffect(() => {
    hasSpokenRef.current = false;
  }, [data?.title]);

  if (!data) return null;

  // Split emoji from text in visual points
  const parsePoint = (point) => {
    const emojiMatch = point.match(/^([\p{Emoji}\u200d\ufe0f]+)\s*/u);
    if (emojiMatch) {
      return {
        emoji: emojiMatch[1],
        text: point.slice(emojiMatch[0].length),
      };
    }
    return { emoji: '📌', text: point };
  };

  return (
    <div className="explain-card" id="explain-card">
      {/* Title */}
      <h1 className="explain-title">📚 {data.title}</h1>

      {/* Main Content Grid */}
      <div className="explain-grid">
        {/* Left Column: Explanation & Analogy */}
        <div className="explain-left-col">
          <div className="explain-card-block main-exp">
            <h2>💡 Concept Explanation</h2>
            <p className="explain-body">{data.explanation}</p>
          </div>

          {data.analogy && (
            <div className="explain-card-block analogy-block">
              <h2>🧠 Real-life Analogy</h2>
              <blockquote className="analogy-text">
                <span className="quote-mark">“</span>
                {data.analogy}
                <span className="quote-mark">”</span>
              </blockquote>
            </div>
          )}
        </div>

        {/* Right Column: Visual Points */}
        <div className="explain-right-col">
          {data.visual_points?.length > 0 && (
            <div className="explain-card-block points-block">
              <h2>🌿 Key Visual Points</h2>
              <div className="explain-points">
                {data.visual_points.map((point, index) => {
                  const { emoji, text } = parsePoint(point);
                  return (
                    <div className="explain-point" key={index}>
                      <span className="explain-point-emoji">{emoji}</span>
                      <span className="explain-point-text">{text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Area: Key Terms & Fun Fact */}
      <div className="explain-bottom-area">
        {data.key_terms?.length > 0 && (
          <div className="explain-card-block terms-block">
            <h2>📝 Vocabulary Words</h2>
            <div className="explain-terms">
              {data.key_terms.map((item, index) => (
                <div className="explain-term-pill" key={index}>
                  <strong className="term-name">{item.term}</strong>
                  <span className="term-separator">:</span>
                  <span className="term-meaning">{item.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.fun_fact && (
          <div className="explain-fun-fact">
            <span className="explain-fun-fact-icon">🌟</span>
            <div className="fun-fact-content">
              <strong>Fun Fact:</strong> <span>{data.fun_fact}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
