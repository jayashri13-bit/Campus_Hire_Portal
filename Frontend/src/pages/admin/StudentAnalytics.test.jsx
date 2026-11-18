import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StudentAnalytics from './StudentAnalytics';

vi.mock('../../auth/authService', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getAdminStudentAnalyticsDashboard: vi.fn().mockResolvedValue({ data: {} }),
    getTopSkillsAnalytics: vi.fn().mockResolvedValue({ data: [] }),
    getPlacementCgpaAnalytics: vi.fn().mockResolvedValue({ data: [] }),
    getDepartmentAnalytics: vi.fn().mockResolvedValue({ data: [] }),
    getAllTopPlacedStudents: vi.fn().mockResolvedValue({ data: [] }),
    addTopPlacedStudent: vi.fn().mockResolvedValue({ data: {} }),
    deleteTopPlacedStudent: vi.fn().mockResolvedValue({ data: {} })
  };
});

describe('StudentAnalytics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders analytics title and metrics cards', async () => {
    render(<StudentAnalytics onNavigate={() => {}} />);
    expect(screen.getByText(/System Insights/i)).toBeInTheDocument();
  });
});
