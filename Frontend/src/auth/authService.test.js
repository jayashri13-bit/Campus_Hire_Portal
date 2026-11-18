import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../api/axios';
import {
  registerStudent,
  loginStudent,
  loginAdmin,
  saveAuthToken,
  forgotPassword,
  resetPassword,
  createJobPosting,
  getDrafts,
  getDraftById,
  publishDraft,
  getAdminProfile,
  getStudentProfile,
  updateAdminProfile,
  uploadAdminProfilePhoto,
  deleteAdminProfilePhoto,
  updateStudentProfile,
  uploadStudentProfilePhoto,
  deleteStudentProfilePhoto,
  getStudentDashboardStats,
  getAdminStudentAnalyticsDashboard,
  getAdminRecentPosts,
  getAllPlacementDrives,
  addPlacementDrive,
  getAllStudentsForDrive,
  updatePlacementDrive,
  deletePlacementDrive,
  getAllTopPlacedStudents,
  addTopPlacedStudent,
  getAllQueries,
  replyToQuery,
  publishPlacementStory,
  getAllPlacementStories,
  updatePlacementStory,
  deletePlacementStory,
  changePassword,
  getLatestJobs,
  getJobDetails,
  applyForJob,
  getStudentQueries,
  submitStudentQuery,
  resolveStudentQuery,
  getTopSkillsAnalytics,
  getPlacementCgpaAnalytics,
  getDepartmentAnalytics,
  getStudentResumeMatch,
  getAdminApplicantsMatching,
  getStudentPlacementStories,
  getStudentPlacementDrives,
  getStudentNotifications,
  markAllStudentNotificationsAsRead,
  getStudentUnreadCount,
  getAdminNotifications,
  markAllAdminNotificationsAsRead,
  getAdminUnreadCount,
  getAdminDashboardStats
} from './authService';

vi.mock('../api/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: 'http://localhost' }
  }
}));

describe('authService API Methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'test-jwt-token');
  });

  it('registerStudent calls api.post with studentData', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    const data = { name: 'John Doe' };
    const res = await registerStudent(data);
    expect(api.post).toHaveBeenCalledWith('/auth/register/student', data);
    expect(res.data.success).toBe(true);
  });

  it('loginStudent calls api.post with loginData', async () => {
    api.post.mockResolvedValue({ data: { token: 'xyz' } });
    await loginStudent({ email: 'a@b.com', password: '123' });
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: '123' });
  });

  it('loginAdmin calls api.post with adminData', async () => {
    api.post.mockResolvedValue({ data: { token: 'admin-token' } });
    await loginAdmin({ email: 'admin@b.com', password: '123' });
    expect(api.post).toHaveBeenCalledWith('/auth/admin/login', { email: 'admin@b.com', password: '123' });
  });

  it('forgotPassword calls api.post', async () => {
    api.post.mockResolvedValue({ data: { message: 'sent' } });
    await forgotPassword('test@test.com');
    expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'test@test.com' });
  });

  it('resetPassword calls api.post', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    await resetPassword({ token: 't', password: 'p' });
    expect(api.post).toHaveBeenCalledWith('/auth/reset-password?token=t', { token: 't', password: 'p' });
  });

  it('createJobPosting attaches Authorization header', async () => {
    api.post.mockResolvedValue({ data: { id: 1 } });
    await createJobPosting({ title: 'Software Engineer' });
    expect(api.post).toHaveBeenCalledWith(
      '/admin/job/add',
      { title: 'Software Engineer' },
      { headers: { Authorization: 'Bearer test-jwt-token' } }
    );
  });

  it('getDrafts calls api.get with token', async () => {
    api.get.mockResolvedValue({ data: [] });
    await getDrafts();
    expect(api.get).toHaveBeenCalledWith('/admin/drafts', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getDraftById validates ID and calls api.get', async () => {
    api.get.mockResolvedValue({ data: {} });
    await getDraftById('123');
    expect(api.get).toHaveBeenCalledWith('/admin/draft/123', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getDraftById throws TypeError on invalid ID', async () => {
    expect(() => getDraftById('<invalid>')).toThrow(TypeError);
    expect(() => getDraftById('')).toThrow(TypeError);
  });

  it('publishDraft calls api.put', async () => {
    api.put.mockResolvedValue({ data: { published: true } });
    await publishDraft('123');
    expect(api.put).toHaveBeenCalledWith('/admin/draft/publish/123', {}, {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getAdminProfile calls api.get', async () => {
    api.get.mockResolvedValue({ data: {} });
    await getAdminProfile();
    expect(api.get).toHaveBeenCalledWith('/admin/profile', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getStudentProfile calls api.get', async () => {
    api.get.mockResolvedValue({ data: {} });
    await getStudentProfile();
    expect(api.get).toHaveBeenCalledWith('/student/profile', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('updateAdminProfile calls api.put', async () => {
    api.put.mockResolvedValue({ data: {} });
    await updateAdminProfile({ name: 'Admin' });
    expect(api.put).toHaveBeenCalledWith('/admin/profile', { name: 'Admin' }, {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('updateStudentProfile calls api.put', async () => {
    api.put.mockResolvedValue({ data: {} });
    await updateStudentProfile({ name: 'Student' });
    expect(api.put).toHaveBeenCalledWith('/student/profile', { name: 'Student' }, {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('uploadStudentProfilePhoto calls api.post with FormData', async () => {
    api.post.mockResolvedValue({ data: { photoUrl: '/uploads/profile/test.png' } });
    const fakeFile = new File(['dummy'], 'photo.png', { type: 'image/png' });
    await uploadStudentProfilePhoto(fakeFile);
    expect(api.post).toHaveBeenCalledWith('/student/profile/photo', expect.any(FormData), {
      headers: {
        Authorization: 'Bearer test-jwt-token',
        'Content-Type': 'multipart/form-data'
      }
    });
  });

  it('deleteStudentProfilePhoto calls api.delete', async () => {
    api.delete.mockResolvedValue({ data: 'Profile photo deleted successfully.' });
    await deleteStudentProfilePhoto();
    expect(api.delete).toHaveBeenCalledWith('/student/profile/photo', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('uploadAdminProfilePhoto calls api.post with FormData', async () => {
    api.post.mockResolvedValue({ data: { photoUrl: '/uploads/profile/admin.png' } });
    const fakeFile = new File(['dummy'], 'photo.png', { type: 'image/png' });
    await uploadAdminProfilePhoto(fakeFile);
    expect(api.post).toHaveBeenCalledWith('/admin/profile/photo', expect.any(FormData), {
      headers: {
        Authorization: 'Bearer test-jwt-token',
        'Content-Type': 'multipart/form-data'
      }
    });
  });

  it('deleteAdminProfilePhoto calls api.delete', async () => {
    api.delete.mockResolvedValue({ data: 'Admin profile photo deleted successfully.' });
    await deleteAdminProfilePhoto();
    expect(api.delete).toHaveBeenCalledWith('/admin/profile/photo', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getStudentDashboardStats calls api.get', async () => {
    api.get.mockResolvedValue({ data: {} });
    await getStudentDashboardStats();
    expect(api.get).toHaveBeenCalledWith('/student/dashboard/stats', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getAdminStudentAnalyticsDashboard calls api.get', async () => {
    api.get.mockResolvedValue({ data: {} });
    await getAdminStudentAnalyticsDashboard();
    expect(api.get).toHaveBeenCalledWith('/admin/student-analytics/dashboard', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getAdminRecentPosts calls api.get', async () => {
    api.get.mockResolvedValue({ data: [] });
    await getAdminRecentPosts();
    expect(api.get).toHaveBeenCalledWith('/admin/dashboard/recent-posts', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getAllPlacementDrives calls api.get', async () => {
    api.get.mockResolvedValue({ data: [] });
    await getAllPlacementDrives();
    expect(api.get).toHaveBeenCalledWith('/admin/placement-drive/all', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('addPlacementDrive calls api.post', async () => {
    api.post.mockResolvedValue({ data: {} });
    await addPlacementDrive({ company: 'Tech' });
    expect(api.post).toHaveBeenCalledWith('/admin/placement-drive/add', { company: 'Tech' }, {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getAllStudentsForDrive calls api.get', async () => {
    api.get.mockResolvedValue({ data: [] });
    await getAllStudentsForDrive();
    expect(api.get).toHaveBeenCalledWith('/admin/placement-drive/specific-students', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('updatePlacementDrive calls api.put', async () => {
    api.put.mockResolvedValue({ data: {} });
    await updatePlacementDrive('1', { company: 'Tech Corp' });
    expect(api.put).toHaveBeenCalledWith('/admin/placement-drive/update/1', { company: 'Tech Corp' }, {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('deletePlacementDrive calls api.delete', async () => {
    api.delete.mockResolvedValue({ data: {} });
    await deletePlacementDrive('1');
    expect(api.delete).toHaveBeenCalledWith('/admin/placement-drive/delete/1', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getAllTopPlacedStudents calls api.get', async () => {
    api.get.mockResolvedValue({ data: [] });
    await getAllTopPlacedStudents();
    expect(api.get).toHaveBeenCalledWith('/admin/top-placed-student/all', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('addTopPlacedStudent calls api.post', async () => {
    api.post.mockResolvedValue({ data: {} });
    await addTopPlacedStudent({ student: 'Jane' });
    expect(api.post).toHaveBeenCalledWith('/admin/top-placed-student/add', { student: 'Jane' }, {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getAllQueries calls api.get', async () => {
    api.get.mockResolvedValue({ data: [] });
    await getAllQueries();
    expect(api.get).toHaveBeenCalledWith('/admin/query/all', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('replyToQuery calls api.put', async () => {
    api.put.mockResolvedValue({ data: {} });
    await replyToQuery('1', 'Answer text');
    expect(api.put).toHaveBeenCalledWith(
      '/admin/query/1/reply',
      { reply: 'Answer text', adminReply: 'Answer text', response: 'Answer text' },
      { headers: { Authorization: 'Bearer test-jwt-token' } }
    );
  });

  it('publishPlacementStory creates FormData and calls api.post', async () => {
    api.post.mockResolvedValue({ data: {} });
    await publishPlacementStory({ studentName: 'Alex', companyName: 'Google', jobRole: 'Dev', package: '12', storyText: 'Great' });
    expect(api.post).toHaveBeenCalled();
  });

  it('getAllPlacementStories calls api.get', async () => {
    api.get.mockResolvedValue({ data: [] });
    await getAllPlacementStories();
    expect(api.get).toHaveBeenCalledWith('/admin/story/all', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('updatePlacementStory calls api.put', async () => {
    api.put.mockResolvedValue({ data: {} });
    await updatePlacementStory('10', { studentName: 'Alex' });
    expect(api.put).toHaveBeenCalled();
  });

  it('deletePlacementStory calls api.delete', async () => {
    api.delete.mockResolvedValue({ data: {} });
    await deletePlacementStory('10');
    expect(api.delete).toHaveBeenCalledWith('/admin/story/delete/10', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('changePassword calls api.put', async () => {
    api.put.mockResolvedValue({ data: {} });
    await changePassword({ oldPass: '1', newPass: '2' });
    expect(api.put).toHaveBeenCalledWith('/auth/change-password', { oldPass: '1', newPass: '2' }, {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getLatestJobs calls api.get', async () => {
    api.get.mockResolvedValue({ data: [] });
    await getLatestJobs();
    expect(api.get).toHaveBeenCalledWith('/student/jobs/latest', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getJobDetails calls api.get', async () => {
    api.get.mockResolvedValue({ data: {} });
    await getJobDetails('5');
    expect(api.get).toHaveBeenCalledWith('/student/jobs/5', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('applyForJob calls api.post', async () => {
    api.post.mockResolvedValue({ data: {} });
    await applyForJob('5', { resume: 'file' });
    expect(api.post).toHaveBeenCalledWith('/student/jobs/5/apply', { resume: 'file' }, {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getStudentQueries calls api.get', async () => {
    api.get.mockResolvedValue({ data: [] });
    await getStudentQueries();
    expect(api.get).toHaveBeenCalledWith('/student/query', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('submitStudentQuery calls api.post', async () => {
    api.post.mockResolvedValue({ data: {} });
    await submitStudentQuery({ query: 'help' });
    expect(api.post).toHaveBeenCalledWith('/student/query', { query: 'help' }, {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('resolveStudentQuery calls api.put', async () => {
    api.put.mockResolvedValue({ data: {} });
    await resolveStudentQuery('3');
    expect(api.put).toHaveBeenCalledWith('/student/query/resolve/3', {}, {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getTopSkillsAnalytics calls api.get', async () => {
    api.get.mockResolvedValue({ data: [] });
    await getTopSkillsAnalytics();
    expect(api.get).toHaveBeenCalledWith('/admin/student-analytics/top-skills', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getPlacementCgpaAnalytics calls api.get', async () => {
    api.get.mockResolvedValue({ data: [] });
    await getPlacementCgpaAnalytics();
    expect(api.get).toHaveBeenCalledWith('/admin/student-analytics/placement-cgpa', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getDepartmentAnalytics calls api.get', async () => {
    api.get.mockResolvedValue({ data: [] });
    await getDepartmentAnalytics();
    expect(api.get).toHaveBeenCalledWith('/admin/student-analytics/department', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getStudentResumeMatch calls api.get', async () => {
    api.get.mockResolvedValue({ data: [] });
    await getStudentResumeMatch();
    expect(api.get).toHaveBeenCalledWith('/student/resume-match', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getAdminApplicantsMatching calls api.get', async () => {
    api.get.mockResolvedValue({ data: [] });
    await getAdminApplicantsMatching();
    expect(api.get).toHaveBeenCalledWith('/admin/applicants/matching', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getStudentPlacementStories calls api.get', async () => {
    api.get.mockResolvedValue({ data: [] });
    await getStudentPlacementStories();
    expect(api.get).toHaveBeenCalledWith('/student/story/all', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getStudentPlacementDrives calls api.get', async () => {
    api.get.mockResolvedValue({ data: [] });
    await getStudentPlacementDrives();
    expect(api.get).toHaveBeenCalledWith('/student/placement-drive/all', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getStudentNotifications calls api.get', async () => {
    api.get.mockResolvedValue({ data: [] });
    await getStudentNotifications();
    expect(api.get).toHaveBeenCalledWith('/api/notification/student', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('markAllStudentNotificationsAsRead calls api.put', async () => {
    api.put.mockResolvedValue({ data: {} });
    await markAllStudentNotificationsAsRead();
    expect(api.put).toHaveBeenCalledWith('/api/notification/student/read-all', {}, {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getStudentUnreadCount calls api.get', async () => {
    api.get.mockResolvedValue({ data: { count: 2 } });
    await getStudentUnreadCount();
    expect(api.get).toHaveBeenCalledWith('/api/notification/student/unread-count', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getAdminNotifications calls api.get', async () => {
    api.get.mockResolvedValue({ data: [] });
    await getAdminNotifications();
    expect(api.get).toHaveBeenCalledWith('/api/notification/admin', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('markAllAdminNotificationsAsRead calls api.put', async () => {
    api.put.mockResolvedValue({ data: {} });
    await markAllAdminNotificationsAsRead();
    expect(api.put).toHaveBeenCalledWith('/api/notification/admin/read-all', {}, {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getAdminUnreadCount calls api.get', async () => {
    api.get.mockResolvedValue({ data: { count: 5 } });
    await getAdminUnreadCount();
    expect(api.get).toHaveBeenCalledWith('/api/notification/admin/unread-count', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('getAdminDashboardStats calls api.get', async () => {
    api.get.mockResolvedValue({ data: {} });
    await getAdminDashboardStats();
    expect(api.get).toHaveBeenCalledWith('/api/admin/student-analytics/dashboard', {
      headers: { Authorization: 'Bearer test-jwt-token' }
    });
  });

  it('saveAuthToken sanitizes and stores token in localStorage', () => {
    saveAuthToken('sample.jwt.token-123_abc');
    expect(localStorage.getItem('token')).toBe('sample.jwt.token-123_abc');
  });
});
