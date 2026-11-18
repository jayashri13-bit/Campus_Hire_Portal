import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from './Login';

vi.mock('../../auth/authService', () => ({
  loginStudent: vi.fn().mockResolvedValue({ data: { token: 'mock-token', role: 'ROLE_STUDENT' } }),
  loginAdmin: vi.fn().mockResolvedValue({ data: { token: 'admin-token', role: 'ROLE_ADMIN' } }),
  forgotPassword: vi.fn().mockResolvedValue({ data: { message: 'sent' } }),
  resetPassword: vi.fn().mockResolvedValue({ data: { success: true } })
}));

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form headings and submit button', () => {
    render(<Login onNavigate={() => {}} />);
    expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('allows filling out email input', () => {
    render(<Login onNavigate={() => {}} />);
    const emailInput = screen.getByPlaceholderText('priya@college.edu.in');
    fireEvent.change(emailInput, { target: { value: 'student@test.com' } });
    expect(emailInput.value).toBe('student@test.com');
  });

  it('navigates back to home on back button click', () => {
    const onNavigateMock = vi.fn();
    render(<Login onNavigate={onNavigateMock} />);
    const backBtn = screen.getByText(/Back to Home/i);
    fireEvent.click(backBtn);
    expect(onNavigateMock).toHaveBeenCalledWith('landing');
  });
});
