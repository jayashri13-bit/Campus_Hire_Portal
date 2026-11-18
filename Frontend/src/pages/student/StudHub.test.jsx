import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StudHub from './StudHub';

vi.mock('../../auth/authService', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getStudentQueries: vi.fn().mockResolvedValue({ data: [] }),
    submitStudentQuery: vi.fn().mockResolvedValue({ data: {} }),
    resolveStudentQuery: vi.fn().mockResolvedValue({ data: {} }),
    getStudentPlacementStories: vi.fn().mockResolvedValue({ data: [] }),
    getStudentPlacementDrives: vi.fn().mockResolvedValue({ data: [] })
  };
});

describe('StudHub Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders student hub panel headings', async () => {
    render(<StudHub onNavigate={() => {}} />);
    expect(screen.getByText(/Raise a Query/i)).toBeInTheDocument();
  });

  it('formats student query date from LocalDateTime array without shifting timezone', async () => {
    const { getStudentQueries } = await import('../../auth/authService');
    vi.mocked(getStudentQueries).mockResolvedValueOnce({
      data: [
        {
          id: 1,
          subject: 'Nykaa Eligibility',
          description: 'Facing issues with being eligible for nykaa',
          status: 'pending',
          createdAt: [2026, 8, 12, 19, 4]
        }
      ]
    });

    render(<StudHub onNavigate={() => {}} />);
    expect(await screen.findByText('Nykaa Eligibility')).toBeInTheDocument();
    expect(screen.getByText('12/08/2026 19:04')).toBeInTheDocument();
  });
});

