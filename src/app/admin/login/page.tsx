'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (data.success) {
                router.push('/admin');
                router.refresh();
            } else {
                setError(data.error || 'Invalid credentials');
            }
        } catch (err) {
            setError('Failed to login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <style jsx>{`
        .login-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .login-card {
          background: #1a1a2e;
          border: 1px solid #2d2d44;
          border-radius: 12px;
          padding: 40px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        .login-title {
          font-size: 24px;
          font-weight: 600;
          color: #ffffff;
          text-align: center;
          margin: 0 0 8px 0;
        }
        .login-subtitle {
          color: #8888a0;
          text-align: center;
          font-size: 14px;
          margin: 0 0 32px 0;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #8888a0;
          margin-bottom: 8px;
        }
        .form-input {
          width: 100%;
          padding: 12px 16px;
          background: #0f0f1a;
          border: 1px solid #4a4a68;
          border-radius: 6px;
          color: #ffffff;
          font-size: 14px;
          transition: border-color 0.15s;
        }
        .form-input:focus {
          outline: none;
          border-color: #4dabf7;
        }
        .form-input::placeholder {
          color: #6a6a80;
        }
        .login-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #e94560 0%, #f39c12 100%);
          border: none;
          border-radius: 6px;
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(233, 69, 96, 0.3);
        }
        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .error-msg {
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid #ff6b6b;
          color: #ff6b6b;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 13px;
          text-align: center;
        }
        .logo {
          text-align: center;
          margin-bottom: 24px;
        }
        .logo-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #e94560 0%, #f39c12 100%);
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }
      `}</style>

            <div className="login-card">
                <div className="logo">
                    <div className="logo-icon">🔐</div>
                </div>
                <h1 className="login-title">Admin Login</h1>
                <p className="login-subtitle">Enter your credentials to access the admin panel</p>

                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="admin@admin.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
