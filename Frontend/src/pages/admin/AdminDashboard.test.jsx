import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminDashboard from './AdminDashboard';

vi.mock('../../auth/authService', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getAdminProfile: vi.fn().mockResolvedValue({ data: { fullName: 'Admin User' } }),
    getAdminDashboardStats: vi.fn().mockResolvedValue({ data: {} }),
    getAdminRecentPosts: vi.fn().mockResolvedValue({ data: [] }),
    getAllPlacementDrives: vi.fn().mockResolvedValue({ data: [] }),
    getAdminNotifications: vi.fn().mockResolvedValue({ data: [] }),
    getAdminUnreadCount: vi.fn().mockResolvedValue({ data: { count: 0 } }),
    getAdminApplicantsMatching: vi.fn().mockResolvedValue({ data: [] }),
    getDrafts: vi.fn().mockResolvedValue({ data: [] }),
    getAdminStudentAnalyticsDashboard: vi.fn().mockResolvedValue({ data: {} }),
    markAllAdminNotificationsAsRead: vi.fn().mockResolvedValue({ data: {} }),
    addPlacementDrive: vi.fn().mockResolvedValue({ data: {} }),
    updatePlacementDrive: vi.fn().mockResolvedValue({ data: {} }),
    deletePlacementDrive: vi.fn().mockResolvedValue({ data: {} }),
    updateAdminProfile: vi.fn().mockResolvedValue({ data: {} }),
    changePassword: vi.fn().mockResolvedValue({ data: {} })
  };
});

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('admin_user', JSON.stringify({ fullName: 'Admin User', email: 'admin@college.edu' }));
  });

  it('renders admin dashboard heading and tabs', async () => {
    render(<AdminDashboard onNavigate={() => {}} />);
    expect(screen.getByText(/Welcome,/i)).toBeInTheDocument();
  });

  it('renders notifications with correct formatted timestamp without timezone shifting', async () => {
    const { getAdminNotifications } = await import('../../auth/authService');
    vi.mocked(getAdminNotifications).mockResolvedValueOnce({
      data: [
        {
          id: 1,
          message: 'Test notification message',
          createdDate: '12/08/2026',
          createdTime: '06:40 PM',
          read: false
        }
      ]
    });

    render(<AdminDashboard onNavigate={() => {}} />);
    const bellButton = await screen.findByRole('button', { name: /notifications/i });
    bellButton.click();
    expect(await screen.findByText('Test notification message')).toBeInTheDocument();
    expect(screen.getByText('12/08/2026 at 06:40 PM')).toBeInTheDocument();
  });
});

