
import './ResetLinkModal.css';
import { MailOpen, Check, ArrowRight, ShieldAlert, Clock, ExternalLink, X } from "lucide-react";

function ResetLinkModal({ isOpen, onClose, onSimulateClick, email }) {
    if (!isOpen) return null;

    const targetEmail = email || localStorage.getItem('allowed_reset_email') || 'student@college.edu';
    const mockToken = 'mock_reset_token_' + Math.random().toString(36).substring(2, 9);
    const mockResetUrl = `${window.location.origin}/login?view=reset&token=${mockToken}&email=${encodeURIComponent(targetEmail)}`;

    return (
        <div className="modal-overlay" aria-label="Close reset link modal backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal-container email-ui-modal">

                {/* EMAIL CLIENT HEADER BAR */}
                <div className="email-client-header">
                    <div className="email-client-title">
                        <MailOpen size={18} className="email-icon" />
                        <span>Inbox Preview — Password Reset Request</span>
                    </div>
                    <button className="email-close-btn" onClick={onClose} aria-label="Close Email Preview">
                        <X size={18} />
                    </button>
                </div>

                {/* SENDER & RECIPIENT METADATA */}
                <div className="email-meta-bar">
                    <div className="meta-avatar">CP</div>
                    <div className="meta-info">
                        <div className="meta-subject">Action Required: Reset Your Password</div>
                        <div className="meta-addresses">
                            <strong>From:</strong> Placement Portal &lt;no-reply@collegeplacement.edu&gt;<br />
                            <strong>To:</strong> <span className="target-email">{targetEmail}</span>
                        </div>
                    </div>
                    <div className="meta-time">Just now</div>
                </div>

                {/* RENDERED EMAIL BODY CARD */}
                <div className="email-body-wrapper">
                    <div className="email-card">

                        {/* BRAND HEADER BANNER */}
                        <div className="email-brand-header">
                            <div className="brand-logo-circle">🔐</div>
                            <h2>College Placement Portal</h2>
                            <p>Secure Authentication &amp; Career Access</p>
                        </div>

                        {/* EMAIL TEXT & INSTRUCTIONS */}
                        <div className="email-content-area">
                            <h3>Password Reset Request</h3>
                            <p className="greeting">Hello,</p>
                            <p className="email-text">
                                We received a request to reset the password for your account associated with <strong>{targetEmail}</strong>.
                            </p>

                            {/* PRIMARY CTA BUTTON (SIMULATES CLICK) */}
                            <div className="cta-container">
                                <button type="button" className="btn-email-cta" onClick={() => onSimulateClick(mockToken, targetEmail)}>
                                    Reset Password →
                                </button>
                            </div>

                            {/* EXPIRATION SECURITY NOTICE */}
                            <div className="security-notice-box">
                                <Clock size={16} />
                                <span>Security Notice: This link is valid for <strong>15 minutes</strong> only.</span>
                            </div>

                            {/* FALLBACK RAW LINK DISPLAY */}
                            <p className="fallback-label">If the button above does not work, click below or open this URL:</p>
                            <div className="fallback-url-box" onClick={() => onSimulateClick(mockToken, targetEmail)}>
                                <span>{mockResetUrl}</span>
                                <ExternalLink size={14} className="ext-icon" />
                            </div>
                        </div>

                        {/* EMAIL FOOTER */}
                        <div className="email-card-footer">
                            <p>© 2026 College Placement Portal. All rights reserved.</p>
                            <p>If you did not request a password reset, you can safely ignore this email.</p>
                        </div>
                    </div>
                </div>

                {/* BOTTOM MODAL ACTIONS */}
                <div className="modal-actions-bar">
                    <button type="button" className="btn-close-preview" onClick={onClose}>
                        Close Email Preview
                    </button>
                    <button type="button" className="btn-open-link-action" onClick={() => onSimulateClick(mockToken, targetEmail)}>
                        <span>Open Reset Password Page</span>
                        <ArrowRight size={16} />
                    </button>
                </div>

            </div>
        </div>
    );
}

export default ResetLinkModal;