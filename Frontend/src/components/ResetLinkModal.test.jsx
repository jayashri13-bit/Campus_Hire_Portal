import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResetLinkModal from './ResetLinkModal';

describe('ResetLinkModal Component', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ResetLinkModal isOpen={false} onClose={() => {}} onSimulateClick={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal content when isOpen is true', () => {
    render(<ResetLinkModal isOpen={true} onClose={() => {}} onSimulateClick={() => {}} email="student@test.com" />);
    expect(screen.getByText(/Inbox Preview — Password Reset Request/i)).toBeInTheDocument();
    expect(screen.getByText('Close Email Preview')).toBeInTheDocument();
    expect(screen.getByText(/Open Reset Password Page/i)).toBeInTheDocument();
  });

  it('triggers onClose when Close button is clicked', () => {
    const onCloseMock = vi.fn();
    render(<ResetLinkModal isOpen={true} onClose={onCloseMock} onSimulateClick={() => {}} />);
    fireEvent.click(screen.getByText('Close Email Preview'));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('triggers onSimulateClick when Reset Password button is clicked', () => {
    const onSimulateMock = vi.fn();
    render(<ResetLinkModal isOpen={true} onClose={() => {}} onSimulateClick={onSimulateMock} />);
    fireEvent.click(screen.getByText('Open Reset Password Page'));
    expect(onSimulateMock).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when clicking modal-overlay backdrop', () => {
    const onCloseMock = vi.fn();
    render(<ResetLinkModal isOpen={true} onClose={onCloseMock} onSimulateClick={() => {}} />);
    const overlay = screen.getByLabelText('Close reset link modal backdrop');
    fireEvent.click(overlay);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
