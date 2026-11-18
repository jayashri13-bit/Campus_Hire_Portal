import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LandingPage from './LandingPage';

describe('LandingPage Component', () => {
  it('renders brand name and navigation items', () => {
    render(<LandingPage onNavigate={() => {}} />);
    expect(screen.getByText('Campus_Hire')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('triggers onNavigate when login button is clicked', () => {
    const onNavigateMock = vi.fn();
    render(<LandingPage onNavigate={onNavigateMock} />);
    const loginBtn = screen.getByText(/Login/i);
    fireEvent.click(loginBtn);
    expect(onNavigateMock).toHaveBeenCalledWith('login');
  });

  it('triggers onNavigate when register button is clicked', () => {
    const onNavigateMock = vi.fn();
    render(<LandingPage onNavigate={onNavigateMock} />);
    const regBtn = screen.getAllByText(/Register Now/i)[0];
    fireEvent.click(regBtn);
    expect(onNavigateMock).toHaveBeenCalledWith('register');
  });
});
