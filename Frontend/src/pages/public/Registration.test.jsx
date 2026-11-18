import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Registration from './Registration';
import { registerStudent } from '../../auth/authService';

vi.mock('../../auth/authService', () => ({
  registerStudent: vi.fn(),
  saveAuthToken: vi.fn()
}));

describe('Registration Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders registration form fields', () => {
    render(<Registration onNavigate={() => {}} />);
    expect(screen.getByText(/Launch Your Career from Campus/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Priya Sharma/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/priya@college.edu.in/i)).toBeInTheDocument();
  });

  it('allows filling out registration form fields', () => {
    render(<Registration onNavigate={() => {}} />);
    const nameInput = screen.getByPlaceholderText(/Priya Sharma/i);
    const emailInput = screen.getByPlaceholderText(/priya@college.edu.in/i);

    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(emailInput, { target: { value: 'jane@college.edu' } });

    expect(nameInput.value).toBe('Jane Doe');
    expect(emailInput.value).toBe('jane@college.edu');
  });

  it('navigates back to landing page on back button click', () => {
    const onNavigateMock = vi.fn();
    render(<Registration onNavigate={onNavigateMock} />);
    const backBtn = screen.getByText(/Back to Home/i);
    fireEvent.click(backBtn);
    expect(onNavigateMock).toHaveBeenCalledWith('landing');
  });

  it('shows error toast when email is already registered locally', () => {
    localStorage.setItem("registered_profiles", JSON.stringify([
      { email: "existing@college.edu", phone: "9876543210" }
    ]));

    render(<Registration onNavigate={() => {}} />);

    act(() => {
      fireEvent.change(screen.getByPlaceholderText(/Priya Sharma/i), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByPlaceholderText(/priya@college.edu.in/i), { target: { value: 'existing@college.edu' } });
      fireEvent.change(screen.getByPlaceholderText(/8765443789/i), { target: { value: '9123456789' } });
      fireEvent.change(document.getElementById('dobInput'), { target: { value: '2004-01-15' } });
      fireEvent.change(screen.getByLabelText(/Department/i), { target: { value: 'Computer Science' } });
      fireEvent.change(screen.getByLabelText(/Course/i), { target: { value: 'BCA' } });
      fireEvent.change(screen.getByLabelText(/Current Year/i), { target: { value: '4' } });
      fireEvent.change(screen.getByLabelText(/^CGPA/i), { target: { value: '8.5' } });
      fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), { target: { value: 'Password@123' } });
      fireEvent.change(screen.getByPlaceholderText("Re-enter password"), { target: { value: 'Password@123' } });
    });

    const submitBtn = screen.getByRole('button', { name: /Create Account/i });
    act(() => {
      fireEvent.submit(submitBtn.closest('form'));
    });

    const matches = screen.getAllByText(/Email address is already registered/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('shows error toast when phone number is already registered locally', () => {
    localStorage.setItem("registered_profiles", JSON.stringify([
      { email: "other@college.edu", phone: "9876543210" }
    ]));

    render(<Registration onNavigate={() => {}} />);

    act(() => {
      fireEvent.change(screen.getByPlaceholderText(/Priya Sharma/i), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByPlaceholderText(/priya@college.edu.in/i), { target: { value: 'new@college.edu' } });
      fireEvent.change(screen.getByPlaceholderText(/8765443789/i), { target: { value: '9876543210' } });
      fireEvent.change(document.getElementById('dobInput'), { target: { value: '2004-01-15' } });
      fireEvent.change(screen.getByLabelText(/Department/i), { target: { value: 'Computer Science' } });
      fireEvent.change(screen.getByLabelText(/Course/i), { target: { value: 'BCA' } });
      fireEvent.change(screen.getByLabelText(/Current Year/i), { target: { value: '4' } });
      fireEvent.change(screen.getByLabelText(/^CGPA/i), { target: { value: '8.5' } });
      fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), { target: { value: 'Password@123' } });
      fireEvent.change(screen.getByPlaceholderText("Re-enter password"), { target: { value: 'Password@123' } });
    });

    const submitBtn = screen.getByRole('button', { name: /Create Account/i });
    act(() => {
      fireEvent.submit(submitBtn.closest('form'));
    });

    const matches = screen.getAllByText(/Phone number is already registered/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('shows error toast when server returns duplicate email error', async () => {
    registerStudent.mockRejectedValueOnce({
      response: { data: { message: "Email is already in use" } }
    });

    render(<Registration onNavigate={() => {}} />);

    act(() => {
      fireEvent.change(screen.getByPlaceholderText(/Priya Sharma/i), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByPlaceholderText(/priya@college.edu.in/i), { target: { value: 'unique@college.edu' } });
      fireEvent.change(screen.getByPlaceholderText(/8765443789/i), { target: { value: '9123456780' } });
      fireEvent.change(document.getElementById('dobInput'), { target: { value: '2004-01-15' } });
      fireEvent.change(screen.getByLabelText(/Department/i), { target: { value: 'Computer Science' } });
      fireEvent.change(screen.getByLabelText(/Course/i), { target: { value: 'BCA' } });
      fireEvent.change(screen.getByLabelText(/Current Year/i), { target: { value: '4' } });
      fireEvent.change(screen.getByLabelText(/^CGPA/i), { target: { value: '8.5' } });
      fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), { target: { value: 'Password@123' } });
      fireEvent.change(screen.getByPlaceholderText("Re-enter password"), { target: { value: 'Password@123' } });
    });

    const submitBtn = screen.getByRole('button', { name: /Create Account/i });
    await act(async () => {
      fireEvent.submit(submitBtn.closest('form'));
    });

    const matches = await screen.findAllByText(/Email address is already registered/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});

