import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QueriesStories from './QueriesStories';

vi.mock('../../auth/authService', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getAllQueries: vi.fn().mockResolvedValue({ data: [] }),
    getAllPlacementStories: vi.fn().mockResolvedValue({ data: [] }),
    getAllPlacementDrives: vi.fn().mockResolvedValue({ data: [] }),
    getAllStudentsForDrive: vi.fn().mockResolvedValue({ data: [] }),
    replyToQuery: vi.fn().mockResolvedValue({ data: {} }),
    publishPlacementStory: vi.fn().mockResolvedValue({ data: {} }),
    updatePlacementStory: vi.fn().mockResolvedValue({ data: {} }),
    deletePlacementStory: vi.fn().mockResolvedValue({ data: {} })
  };
});

describe('QueriesStories Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Queries and Stories panel titles', async () => {
    render(<QueriesStories onNavigate={() => {}} />);
    expect(screen.getAllByText(/Student Queries/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Create Placement Story/i)).toBeInTheDocument();
  });

  it('formats student query date from LocalDateTime array without shifting timezone', async () => {
    const { getAllQueries } = await import('../../auth/authService');
    vi.mocked(getAllQueries).mockResolvedValueOnce({
      data: [
        {
          id: 1,
          studentName: 'Jayram Ganguli',
          department: 'Computer Applications',
          subject: 'Nykaa Eligibility',
          description: 'Facing issues with being eligible for nykaa',
          status: 'pending',
          createdAt: [2026, 8, 12, 19, 4]
        }
      ]
    });

    render(<QueriesStories onNavigate={() => {}} />);
    expect(await screen.findByText('Jayram Ganguli')).toBeInTheDocument();
    expect(screen.getByText('12/08/2026 19:04')).toBeInTheDocument();
  });
});

