import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (username, password) => {
    const response = await api.post('/api/auth/login', { username, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },
  signup: async (username, email, password) => {
    const response = await api.post('/api/auth/signup', { username, email, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
  },
};

// Analysis & Dataset services
export const dataService = {
  uploadDataset: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },
  getSession: async (sessionId) => {
    const response = await api.get(`/api/session/${sessionId}`);
    return response.data;
  },
  getSessions: async () => {
    const response = await api.get('/api/sessions');
    return response.data.sessions;
  },
  deleteSession: async (sessionId) => {
    const response = await api.delete(`/api/session/${sessionId}`);
    return response.data;
  },
  chatWithData: async (sessionId, question) => {
    const response = await api.post('/api/chat', { session_id: sessionId, question });
    return response.data;
  },
  refreshStory: async (sessionId) => {
    const response = await api.post(`/api/story/refresh/${sessionId}`);
    return response.data;
  },
  getPdfUrl: (sessionId) => {
    return `${API_BASE_URL}/api/export/pdf/${sessionId}`;
  },
  downloadPdf: async (sessionId, reportTitle) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/api/export/pdf/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'blob',
    });
    
    // Create a download link and trigger it
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportTitle.replace(/\s+/g, '_')}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  }
};

export default api;
