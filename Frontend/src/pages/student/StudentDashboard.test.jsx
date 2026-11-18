import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StudentDashboard from './StudentDashboard';

vi.mock('../../auth/authService', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getStudentProfile: vi.fn().mockResolvedValue({ data: { fullName: 'Student User' } }),
    getStudentDashboardStats: vi.fn().mockResolvedValue({ data: {} }),
    getLatestJobs: vi.fn().mockResolvedValue({ data: [] }),
    getStudentNotifications: vi.fn().mockResolvedValue({ data: [] }),
    getStudentUnreadCount: vi.fn().mockResolvedValue({ data: { count: 0 } }),
    getStudentResumeMatch: vi.fn().mockResolvedValue({ data: [] }),
    markAllStudentNotificationsAsRead: vi.fn().mockResolvedValue({ data: {} }),
    updateStudentProfile: vi.fn().mockResolvedValue({ data: {} }),
    applyForJob: vi.fn().mockResolvedValue({ data: {} }),
    changePassword: vi.fn().mockResolvedValue({ data: {} })
  };
});

describe('StudentDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('user', JSON.stringify({ fullName: 'Student User', email: 'student@college.edu' }));
  });

  it('renders student dashboard header and overview', async () => {
    render(<StudentDashboard onNavigate={() => {}} />);
    expect(screen.getByText('Campus_Hire')).toBeInTheDocument();
  });

  it('renders student notifications with correct formatted timestamp without timezone shifting', async () => {
    const { getStudentNotifications } = await import('../../auth/authService');
    vi.mocked(getStudentNotifications).mockResolvedValueOnce({
      data: [
        {
          id: 1,
          message: 'Student notification test',
          createdDate: '12/08/2026',
          createdTime: '06:40 PM',
          read: false
        }
      ]
    });

    render(<StudentDashboard onNavigate={() => {}} />);
    const bellButton = await screen.findByRole('button', { name: /notifications/i });
    bellButton.click();
    expect(await screen.findByText('Student notification test')).toBeInTheDocument();
    expect(screen.getByText('12/08/2026 at 06:40 PM')).toBeInTheDocument();
  });

  it('renders applied job list correctly without throwing reference errors', async () => {
    render(<StudentDashboard onNavigate={() => {}} />);
    expect(await screen.findByText('Latest Job Opportunities')).toBeInTheDocument();
  });
});

