import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important: sends cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for token refresh (cookie-based)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If we get a 401 and haven't retried yet, try to refresh tokens
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh tokens using cookies (no need to pass refreshToken in body)
        await axios.post(
          `${API_BASE_URL}/api/auth/refresh-tokens`,
          {},
          { withCredentials: true }
        );
        // Retry the original request with new cookies
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login unless specifically skipped (e.g. for initial auth check)
        // @ts-ignore
        if (!originalRequest.skipAuthRedirect) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; name: string }) =>
    apiClient.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post('/api/auth/login', data),
  logout: () => apiClient.post('/api/auth/logout'),
  refreshTokens: () =>
    apiClient.post('/api/auth/refresh-tokens', {}),
  verifyEmail: (token: string) =>
    apiClient.get('/api/auth/verify-email', { params: { token } }),
  forgotPassword: (email: string) =>
    apiClient.post('/api/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) =>
    apiClient.post('/api/auth/reset-password', { token: data.token, newPassword: data.password }),
  reqVerifyEmail: (email: string) =>
    apiClient.post('/api/auth/req-verify-email', { email }),
};

// User API
export const userAPI = {
  // @ts-ignore
  getMe: () => apiClient.get('/api/user/me', { skipAuthRedirect: true }),
  getUserById: (id: number) => apiClient.get(`/api/user/${id}`),
  followUser: (accountId: number) => apiClient.post('/api/user/follow', { accountId }),
  unfollowUser: (accountId: number) => apiClient.post('/api/user/unfollow', { accountId }),
  getFollowers: (userId: number, limit?: number, cursor?: number | null) => 
    apiClient.get(`/api/user/${userId}/followers`, { params: { limit, cursor } }),
  getFollowing: (userId: number, limit?: number, cursor?: number | null) => 
    apiClient.get(`/api/user/${userId}/following`, { params: { limit, cursor } }),
  checkIfFollowing: (accountId: number) => 
    apiClient.post('/api/user/check-following', { accountId }),
  getFollowerCount: () => apiClient.get('/api/user/follower-count'),
  getFollowingCount: () => apiClient.get('/api/user/following-count'),
};

// Todo API
export const todoAPI = {
  addTask: (data: { content: string }) =>
    apiClient.post('/api/todo/add-task', data),
  updateTask: (data: { taskId: number; content?: string; status?: number }) =>
    apiClient.put('/api/todo/update-task', data),
  getAllTasks: () => apiClient.get('/api/todo/query-all-tasks'),
  deleteTask: (taskId: number) =>
    apiClient.delete('/api/todo/delete-task', {
      data: { taskId },
      headers: { 'Content-Type': 'application/json' }
    }),
};

// Blog API
export const blogAPI = {
  create: (data: { title: string; content: string }) =>
    apiClient.post('/api/blog/create', data),
  update: (data: { postId: number; newTitle: string; newContent: string }) =>
    apiClient.put('/api/blog/update', data),
  getById: (postId: number) => apiClient.get(`/api/blog/get/${postId}`),
  getPublicById: (postId: number) => apiClient.get(`/api/blog/get-public/${postId}`),
  getPopular: (pageNum: number) => apiClient.get(`/api/blog/popular/${pageNum}`),
  checkLike: (blogId: number) => apiClient.get(`/api/blog/check-like/${blogId}`),
  countByAuthor: (authorId: number) => apiClient.get(`/api/blog/count-author/${authorId}`),
  getRecent: (pageNum: number) => apiClient.get(`/api/blog/recent/${pageNum}`),
  like: (blogId: number) => apiClient.post('/api/blog/like', { blogId }),
  comment: (data: { blogId: number; content: string }) =>
    apiClient.post('/api/blog/comment', data),
  getMyBlogs: () => apiClient.get('/api/blog/my-blogs'),
  delete: (blogId: number) =>
    apiClient.delete('/api/blog/delete', {
      data: { blogId },
      headers: { 'Content-Type': 'application/json' },
    }),
  getComments: (blogId: number) => apiClient.get(`/api/blog/comments/${blogId}`),
  getAuthorBlogs: (authorId: number) => apiClient.get(`/api/blog/author/${authorId}`),
};

export default apiClient;
