/**
 * API Service
 * Handles all communication with the FastAPI backend.
 */

import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 300000, // 5 min timeout for large file processing
});

/**
 * Upload a file and run the full analysis pipeline.
 * @param {File} file - The CSV or Excel file to upload
 * @param {function} onProgress - Progress callback
 */
export async function uploadAndAnalyze(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  return response.data;
}

/**
 * Get session data by session ID.
 */
export async function getSession(sessionId) {
  const response = await api.get(`/session/${sessionId}`);
  return response.data;
}

/**
 * List all sessions.
 */
export async function listSessions() {
  const response = await api.get('/sessions');
  return response.data;
}

/**
 * Send a chat message about the data.
 */
export async function chatWithData(sessionId, question) {
  const response = await api.post('/chat', {
    session_id: sessionId,
    question,
  });
  return response.data;
}

/**
 * Export analysis as PDF.
 */
export async function exportPDF(sessionId) {
  const response = await api.get(`/export/pdf/${sessionId}`, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Refresh the data story (re-generate with LLM).
 */
export async function refreshStory(sessionId) {
  const response = await api.post(`/story/refresh/${sessionId}`);
  return response.data;
}

export default api;
