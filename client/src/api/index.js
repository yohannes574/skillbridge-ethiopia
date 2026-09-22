import axios from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || '/api';

const API = axios.create({
  baseURL: API_BASE_URL,
});

// Inject token from localStorage on every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('sb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ───────── Auth ─────────
export const apiRegister = (data) => API.post('/auth/register', data);
export const apiLogin = (data) => API.post('/auth/login', data);
export const apiLoginWithGoogle = (data) => API.post('/auth/google', data);
export const apiForgotPassword = (data) => API.post('/auth/forgot-password', data);
export const apiResetPassword = (data) => API.post('/auth/reset-password', data);
export const apiGetMe = () => API.get('/auth/me');
export const apiUpdateProfile = (data) => API.put('/auth/profile', data);

// ───────── Users ─────────
export const apiGetUsers = (params) => API.get('/users', { params });
export const apiGetUser = (id) => API.get(`/users/${id}`);
export const apiSubmitProfile = (data) => API.post('/users/submit-profile', data);
export const apiApproveUser = (id) => API.patch(`/users/${id}/approve`);
export const apiRejectUser = (id, reason) => API.patch(`/users/${id}/reject`, { reason });
export const apiToggleBlock = (id) => API.patch(`/users/${id}/block`);
export const apiDeleteUser = (id) => API.delete(`/users/${id}`);
export const apiGetMentors = () => API.get('/users/mentors');

// ───────── Courses ─────────
export const apiGetCourses = (params) => API.get('/courses', { params });
export const apiGetCourse = (id) => API.get(`/courses/${id}`);
export const apiCreateCourse = (data) => API.post('/courses', data);
export const apiUpdateCourse = (id, data) => API.put(`/courses/${id}`, data);
export const apiDeleteCourse = (id) => API.delete(`/courses/${id}`);
export const apiApproveCourse = (id) => API.patch(`/courses/${id}/approve`);
export const apiRejectCourse = (id) => API.patch(`/courses/${id}/reject`);
export const apiGetEnrolledCourses = () => API.get('/courses/enrolled');

// ───────── Modules ─────────
export const apiGetModules = (courseId) => API.get(`/modules/course/${courseId}`);
export const apiCreateModule = (data) => API.post('/modules', data);
export const apiUpdateModule = (id, data) => API.put(`/modules/${id}`, data);
export const apiDeleteModule = (id) => API.delete(`/modules/${id}`);

// ───────── Lessons ─────────
export const apiGetLessons = (moduleId) => API.get(`/lessons/module/${moduleId}`);
export const apiCreateLesson = (data) => API.post('/lessons', data);
export const apiUpdateLesson = (id, data) => API.put(`/lessons/${id}`, data);
export const apiDeleteLesson = (id) => API.delete(`/lessons/${id}`);

// ───────── Tests ─────────
export const apiGetTests = (courseId) => API.get(`/tests/course/${courseId}`);
export const apiGetTest = (id) => API.get(`/tests/${id}`);
export const apiCreateTest = (data) => API.post('/tests', data);
export const apiUpdateTest = (id, data) => API.put(`/tests/${id}`, data);
export const apiSubmitTest = (id, data) => API.post(`/tests/${id}/submit`, data);
export const apiGetResults = (courseId) => API.get(`/tests/results/${courseId}`);

// ───────── Enrollments ─────────
export const apiRequestEnrollment = (data) => API.post('/enrollments/request', data);
export const apiGetEnrollmentRequests = () => API.get('/enrollments/requests');
export const apiRespondToRequest = (id, data) => API.patch(`/enrollments/requests/${id}`, data);
export const apiGetMentorStudents = () => API.get('/enrollments/students');
export const apiCheckEnrollment = (courseId) => API.get(`/enrollments/check/${courseId}`);

// ───────── Progress ─────────
export const apiGetProgress = (courseId) => API.get(`/progress/${courseId}`);
export const apiMarkLesson = (courseId, lessonId) => API.post(`/progress/${courseId}/lesson/${lessonId}`);
export const apiMarkModule = (courseId, moduleId) => API.post(`/progress/${courseId}/module/${moduleId}`);
export const apiGetStudentsProgress = (params) => API.get('/progress/mentor/students', { params });

// ───────── Messages ─────────
export const apiSendMessage = (data) => API.post('/messages', data);
export const apiGetConversation = (userId) => API.get(`/messages/${userId}`);
export const apiGetContacts = () => API.get('/messages/contacts');
export const apiGetUnread = () => API.get('/messages/unread');

// ───────── Reports ─────────
export const apiCreateReport = (data) => API.post('/reports', data);
export const apiGetReports = (params) => API.get('/reports', { params });
export const apiUpdateReport = (id, data) => API.patch(`/reports/${id}`, data);

// ───────── Certificates ─────────
export const apiRequestCertificate = (data) => API.post('/certificates/request', data);
export const apiMentorRespondCert  = (id, data) => API.patch(`/certificates/request/${id}/mentor`, data);
export const apiAdminRespondCert   = (id, data) => API.patch(`/certificates/request/${id}/admin`, data);
export const apiGetCertRequests    = () => API.get('/certificates/requests');
export const apiGetMyCertificates  = () => API.get('/certificates/mine');
export const apiGetCertifiedStudents = () => API.get('/certificates/students');

// ───────── Badges ─────────
export const apiGetBadges = () => API.get('/badges');
export const apiCreateBadge = (data) => API.post('/badges', data);
export const apiUpdateBadge = (id, data) => API.put(`/badges/${id}`, data);
export const apiDeleteBadge = (id) => API.delete(`/badges/${id}`);
export const apiGetMyBadges = () => API.get('/badges/mine');
export const apiAssignBadge = (data) => API.post('/badges/assign', data);

// ───────── Notifications ─────────
export const apiGetNotifications = () => API.get('/notifications');
export const apiGetUnreadCount = () => API.get('/notifications/unread-count');
export const apiMarkNotificationRead = (id) => API.patch(`/notifications/${id}/read`);
export const apiMarkAllNotificationsRead = () => API.patch('/notifications/read-all');

// ───────── Reviews ─────────
export const apiCreateReview = (data) => API.post('/reviews', data);
export const apiGetMentorReviews = (mentorId) => API.get(`/reviews/mentor/${mentorId}`);
export const apiCheckReview = (params) => API.get('/reviews/check', { params });

// ───────── Sessions ─────────
export const apiSetAvailability = (data) => API.post('/sessions/availability', data);
export const apiGetAvailability = (mentorId) => API.get(`/sessions/availability/${mentorId}`);
export const apiBookSession = (data) => API.post('/sessions/book', data);
export const apiDirectScheduleSession = (data) => API.post('/sessions/direct', data);
export const apiGetMySessions = () => API.get('/sessions');
export const apiUpdateSession = (id, data) => API.patch(`/sessions/${id}`, data);

// ───────── Jobs & Placements ─────────
export const apiCreateJob = (data) => API.post('/jobs', data);
export const apiGetEmployerJobs = () => API.get('/jobs/employer');
export const apiGetPipelineStats = () => API.get('/jobs/pipeline-stats');
export const apiGetAllJobs = () => API.get('/jobs');
export const apiApplyForJob = (jobId, data) => API.post(`/jobs/${jobId}/apply`, data);
export const apiGetStudentApplications = () => API.get('/jobs/my-applications');
export const apiGetJobApplications = () => API.get('/jobs/applications');
export const apiUpdateApplicationStatus = (id, data) => API.patch(`/jobs/applications/${id}`, data);
export const apiSendJobOffer = (id, data) => API.patch(`/jobs/applications/${id}/offer`, data);
export const apiRespondToOffer = (id, data) => API.patch(`/jobs/applications/${id}/student-response`, data);
export const apiFinalizeHire = (id) => API.patch(`/jobs/applications/${id}/hire`);
export const apiAdvanceApplicationStage = (id, data) => API.patch(`/jobs/applications/${id}/advance`, data);
export const apiMarkInterviewJoined = (id) => API.patch(`/jobs/applications/${id}/interview-join`);
// Upload
export const apiUploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/upload/file', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300000 });
};

export default API;
