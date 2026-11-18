import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Placeview from './Placeview';

vi.mock('../../auth/authService', () => ({
    getStudentPlaceviewDashboard: vi.fn().mockResolvedValue({
        data: {
            placedStudents: 14,
            placementRate: 58.33,
            highestPackage: 98,
            averagePackage: 60.57
        }
    }),
    getStudentPlaceviewDepartment: vi.fn().mockResolvedValue({
        data: {
            totalStudents: 24,
            departments: [
                { department: 'Computer Science', count: 11 }
            ]
        }
    }),
    getStudentPlaceviewPlacementCgpa: vi.fn().mockResolvedValue({
        data: [
            { range: '9-10', count: 10 }
        ]
    }),
    getStudentPlaceviewTopSkills: vi.fn().mockResolvedValue({
        data: [
            { skill: 'Java', count: 21 }
        ]
    }),
    getStudentPlaceviewTopPlaced: vi.fn().mockResolvedValue({
        data: [
            { id: '1', studentName: 'Shreyas Iyer', branch: 'CS', passingYear: '2028', cgpa: '9.9', packageLpa: 98, skill: 'Software Engineer', companyName: 'Instagram' }
        ]
    })
}));

describe('Placeview Component', () => {
    it('renders Students Placeview heading, banner, and leaderboard table', () => {
        render(<Placeview />);
        expect(screen.getByText('Students Placeview')).toBeInTheDocument();
        expect(screen.getByText('Placed Students')).toBeInTheDocument();
        expect(screen.getByText('Department Wise Distribution')).toBeInTheDocument();
        expect(screen.getByText('All Placed Students')).toBeInTheDocument();
        expect(screen.queryByText('Add Top Placed Student')).not.toBeInTheDocument();
    });
});
