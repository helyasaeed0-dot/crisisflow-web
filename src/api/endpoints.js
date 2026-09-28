import api from './client';

// Every backend response looks like { success, data }; return only data
const unwrap = (promise) => promise.then((res) => res.data.data);

export const authApi = {
  login: (body) => unwrap(api.post('/auth/login', body)),
  register: (body) => unwrap(api.post('/auth/register', body)),
  me: () => unwrap(api.get('/auth/me')),
  logout: () => unwrap(api.post('/auth/logout')),
};

export const incidentApi = {
  create: (formData) => unwrap(api.post('/incidents', formData)),
  list: (params) => unwrap(api.get('/incidents', { params })),
  get: (id) => unwrap(api.get(`/incidents/${id}`)),
  track: (referenceId) => unwrap(api.get(`/incidents/track/${referenceId}`)),
  analyze: (id) => unwrap(api.post(`/incidents/${id}/analyze`)),
  verify: (id, body) => unwrap(api.patch(`/incidents/${id}/verify`, body)),
  recommendations: (id, params) => unwrap(api.get(`/incidents/${id}/recommendations`, { params })),
  assign: (id, responderIds) => unwrap(api.post(`/incidents/${id}/assign`, { responderIds })),
  accept: (id) => unwrap(api.post(`/incidents/${id}/accept`)),
  decline: (id) => unwrap(api.post(`/incidents/${id}/decline`)),
  updateStatus: (id, body) => unwrap(api.patch(`/incidents/${id}/status`, body)),
};

export const responderApi = {
  me: () => unwrap(api.get('/responders/me')),
  myAssignments: (params) => unwrap(api.get('/responders/me/assignments', { params })),
  updateStatus: (body) => unwrap(api.patch('/responders/status', body)),
  list: (params) => unwrap(api.get('/responders', { params })),
  nearby: (params) => unwrap(api.get('/responders/nearby', { params })),
  verify: (id, verificationStatus) => unwrap(api.patch(`/responders/${id}/verify`, { verificationStatus })),
};

export const notificationApi = {
  list: (params) => unwrap(api.get('/notifications', { params })),
  unreadCount: () => unwrap(api.get('/notifications/unread-count')),
  markRead: (id) => unwrap(api.patch(`/notifications/${id}/read`)),
  markAllRead: () => unwrap(api.patch('/notifications/read-all')),
};

export const dashboardApi = {
  statistics: () => unwrap(api.get('/dashboard/statistics')),
  analytics: (days = 7) => unwrap(api.get('/dashboard/analytics', { params: { days } })),
  hotspots: (days = 30) => unwrap(api.get('/dashboard/hotspots', { params: { days } })),
  liveMap: () => unwrap(api.get('/dashboard/live-map')),
  aiInsights: (days = 7) => unwrap(api.get('/dashboard/ai-insights', { params: { days } })),
};

export const demoApi = {
  status: () => unwrap(api.get('/demo/status')),
  generate: (body) => unwrap(api.post('/demo/emergencies', body)),
  run: (body) => unwrap(api.post('/demo/run', body)),
  simulate: (id, speed) => unwrap(api.post(`/demo/incidents/${id}/simulate`, { speed })),
  stop: (id) => unwrap(api.post(`/demo/incidents/${id}/stop`)),
  reset: (all = false) => unwrap(api.post('/demo/reset', { all })),
};

export const userApi = {
  list: (params) => unwrap(api.get('/users', { params })),
  update: (id, body) => unwrap(api.patch(`/users/${id}`, body)),
};

export const auditApi = {
  list: (params) => unwrap(api.get('/audit-logs', { params })),
};