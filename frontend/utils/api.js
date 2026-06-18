import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Extract a human-readable error message from an Axios error.
 * Handles 422 validation errors (Pydantic), generic HTTP errors, and network failures.
 * Always returns a string.
 */
function extractErrorMessage(error, fallback = 'Something went wrong') {
  if (!error) return fallback;

  // Axios response error
  if (error.response?.data) {
    const detail = error.response.data.detail;

    // Pydantic 422 returns detail as an array of validation errors
    if (Array.isArray(detail)) {
      return detail
        .map((d) => `${d.loc?.join('.') || 'field'}: ${d.msg}`)
        .join('; ');
    }

    // Simple string detail
    if (typeof detail === 'string') {
      return detail;
    }

    // Object detail — try to stringify
    if (detail && typeof detail === 'object') {
      return JSON.stringify(detail);
    }
  }

  // Network or timeout error
  if (error.message && typeof error.message === 'string') {
    return error.message;
  }

  // If error itself is a string
  if (typeof error === 'string') {
    return error;
  }

  return fallback;
}

/**
 * Check backend health status.
 * GET /health
 * @returns {Promise<boolean>} true if backend is reachable
 */
export async function checkHealth() {
  try {
    const response = await api.get('/health', { timeout: 5000 });
    return response.data?.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Send a voice command to the backend for intent detection.
 * POST /command
 * @param {string} text - The voice transcript in Hinglish
 * @returns {{ intent: string, topic: string, grade: string, language: string }}
 */
export async function sendCommand(text) {
  try {
    const response = await api.post('/command', { text });
    return response.data.data || response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Command detection failed'));
  }
}

/**
 * Get a simplified Hinglish explanation for a topic.
 * POST /explain
 * @param {string} topic
 * @param {string} grade
 * @param {string} language
 * @returns {{ title: string, explanation: string, visual_points: string[], fun_fact: string }}
 */
export async function getExplanation(topic, grade, language) {
  try {
    const response = await api.post('/explain', {
      topic,
      grade,
      language: language || 'Hinglish',
    });
    return response.data.data || response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Explanation generation failed'));
  }
}

/**
 * Generate MCQ quiz questions for a topic.
 * POST /quiz
 * @param {string} topic
 * @param {string} grade
 * @param {number} numQuestions
 * @returns {{ quiz_title: string, questions: Array<{ id: number, question: string, options: string[], answer: string, explanation: string }> }}
 */
export async function getQuiz(topic, grade, numQuestions = 5) {
  try {
    const response = await api.post('/quiz', {
      topic,
      grade,
      num_questions: numQuestions,
    });
    return response.data.data || response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Quiz generation failed'));
  }
}

/**
 * Fetch explanation history from the database cache.
 * GET /history
 * @returns {Promise<Array>} List of cached explanations
 */
export async function getHistory() {
  try {
    const response = await api.get('/history');
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return [];
  }
}

export default api;

