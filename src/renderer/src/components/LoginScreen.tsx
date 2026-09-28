import { useEffect, useState } from 'react';
import { PixelPanel } from './PixelPanel';
import { PixelButton } from './PixelButton';
import { Icon } from './Icon';
import brandLogo from '../logo.png?url';

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [setupRequired, setSetupRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) onLogin();
        else {
          setSetupRequired(data.setupRequired);
          setLoading(false);
        }
      })
      .catch(e => {
        console.error('Auth check failed:', e);
        setLoading(false);
      });
  }, [onLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = setupRequired ? '/api/auth/setup' : '/api/auth/login';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.ok) onLogin();
      else setError(data.error || 'Authentication failed');
    } catch (err) {
      setError(String(err));
    }
  };

  if (loading) return null;

  return (
    <div style={{
      width: '100vw', height: '100vh', 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--cth-bg)',
      color: 'var(--cth-fg)',
      fontFamily: 'var(--cth-font-sans)'
    }}>
      <PixelPanel style={{ width: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={brandLogo} width={32} height={32} alt="Logo" />
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
            {setupRequired ? 'Welcome to MSPC' : 'Login to MSPC'}
          </h2>
        </div>
        
        {setupRequired && (
          <p style={{ margin: 0, color: 'var(--cth-fg-muted)', fontSize: '0.9rem' }}>
            This is your first time starting the server. Please set an admin password to secure your workspace.
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input 
            type="password" 
            placeholder={setupRequired ? 'Set admin password' : 'Admin password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'var(--cth-well)',
              border: '1px solid var(--cth-border)',
              borderRadius: 4,
              color: 'var(--cth-fg)',
              fontFamily: 'inherit'
            }}
            autoFocus
          />
          {error && <div style={{ color: 'var(--cth-error)', fontSize: '0.9rem' }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <PixelButton type="submit">
              {setupRequired ? 'Set Password' : 'Login'} <Icon name="arrow-right" />
            </PixelButton>
          </div>
        </form>
      </PixelPanel>
    </div>
  );
}
