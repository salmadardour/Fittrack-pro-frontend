import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import '../Auth/Auth.css';

function ForgotPassword() {
    // Removed unused navigate variable
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // In a real application, this would send a password reset email
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

            setIsSubmitted(true);
        } catch (err) {
            setError('Failed to send reset email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="auth-container">
                <div className="auth-wrapper" style={{ maxWidth: '500px' }}>
                    <div className="auth-form-section" style={{ padding: '60px' }}>
                        <div className="auth-header" style={{ textAlign: 'center' }}>
                            <CheckCircle size={48} style={{ color: '#16a34a', marginBottom: '20px' }} />
                            <h2 className="auth-title">Check Your Email</h2>
                            <p className="auth-subtitle">
                                We've sent password reset instructions to {email}
                            </p>
                        </div>

                        <div style={{ marginTop: '40px', textAlign: 'center' }}>
                            <p style={{ color: '#6b5b4f', marginBottom: '20px' }}>
                                Didn't receive the email? Check your spam folder or
                            </p>
                            <button
                                className="submit-button"
                                onClick={() => {
                                    setIsSubmitted(false);
                                    setEmail('');
                                }}
                                style={{ marginBottom: '20px' }}
                            >
                                Try Another Email
                            </button>
                            <Link to="/login" className="link">
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-wrapper" style={{ maxWidth: '500px' }}>
                <div className="auth-form-section" style={{ padding: '60px' }}>
                    <div className="auth-header">
                        <Link to="/login" className="back-link" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '20px',
                            color: '#6b5b4f',
                            textDecoration: 'none'
                        }}>
                            <ArrowLeft size={20} />
                            Back to Login
                        </Link>
                        <h2 className="auth-title">Reset Password</h2>
                        <p className="auth-subtitle">
                            Enter your email address and we'll send you instructions to reset your password
                        </p>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Email Address
                            </label>
                            <div className="input-wrapper">
                                <Mail className="input-icon" size={20} />
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setError('');
                                    }}
                                    className="form-input"
                                    placeholder="Enter your email"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="loading-spinner"></span>
                            ) : (
                                'Send Reset Instructions'
                            )}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Remember your password?{' '}
                            <Link to="/login" className="link">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;