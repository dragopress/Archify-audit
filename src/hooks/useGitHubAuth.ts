import { useState, useEffect, useCallback } from 'react';
import { GitHubUser, GitHubUserRepo } from '../types/audit';

export function useGitHubAuth() {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('github_access_token');
  });
  const [user, setUser] = useState<GitHubUser | null>(() => {
    try {
      const cached = localStorage.getItem('github_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [repos, setRepos] = useState<GitHubUserRepo[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [oauthConfig, setOAuthConfig] = useState<{
    configured: boolean;
    redirectUri: string;
    appUrl: string;
    url?: string;
    devCallback?: string;
    sharedCallback?: string;
  } | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check OAuth configuration status on mount
  useEffect(() => {
    const origin = window.location.origin;
    fetch(`/api/auth/github/url?origin=${encodeURIComponent(origin)}`)
      .then((res) => res.json())
      .then((data) => {
        setOAuthConfig({
          configured: data.configured,
          redirectUri: data.redirectUri,
          appUrl: data.appUrl,
          url: data.url,
          devCallback: data.devCallback,
          sharedCallback: data.sharedCallback,
        });
      })
      .catch((err) => console.warn('Failed to check OAuth status:', err));
  }, []);

  // Fetch user profile when token changes
  const fetchUserProfile = useCallback(async (authToken: string) => {
    setIsLoadingUser(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/github/user', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Authentication token invalid or expired (${res.status})`);
      }

      const userData = await res.json();
      setUser(userData);
      localStorage.setItem('github_access_token', authToken);
      localStorage.setItem('github_user', JSON.stringify(userData));
      setToken(authToken);
      return userData;
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setAuthError(err.message);
      // Clean up invalid token
      setUser(null);
      setToken(null);
      localStorage.removeItem('github_access_token');
      localStorage.removeItem('github_user');
      throw err;
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  // Fetch user repositories
  const fetchUserRepos = useCallback(async (authToken?: string) => {
    const activeToken = authToken || token;
    if (!activeToken) return;

    setIsLoadingRepos(true);
    try {
      const res = await fetch('/api/github/user/repos', {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load repositories (${res.status})`);
      }

      const reposData: GitHubUserRepo[] = await res.json();
      setRepos(reposData);
    } catch (err: any) {
      console.error('Error fetching repos:', err);
      setAuthError(err.message);
    } finally {
      setIsLoadingRepos(false);
    }
  }, [token]);

  // Load user profile on startup if token is cached
  useEffect(() => {
    if (token) {
      fetchUserProfile(token)
        .then(() => fetchUserRepos(token))
        .catch(() => {});
    }
  }, [token, fetchUserProfile, fetchUserRepos]);

  // Listen for OAuth postMessage and storage events from callback
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const receivedToken = event.data.token;
        const receivedUser = event.data.user;
        if (receivedToken) {
          setIsConnecting(false);
          setAuthError(null);
          localStorage.setItem('github_access_token', receivedToken);
          setToken(receivedToken);
          if (receivedUser) {
            setUser(receivedUser);
            localStorage.setItem('github_user', JSON.stringify(receivedUser));
          }
          try {
            await fetchUserProfile(receivedToken);
            await fetchUserRepos(receivedToken);
          } catch (e) {
            console.error('Error post-auth fetch:', e);
          }
        }
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setIsConnecting(false);
        setAuthError(event.data.error || 'GitHub authentication was declined or failed.');
      }
    };

    const handleStorage = (event: StorageEvent) => {
      const newToken = event.newValue;
      if (event.key === 'github_access_token' && newToken) {
        setIsConnecting(false);
        setAuthError(null);
        setToken(newToken);
        fetchUserProfile(newToken).then(() => fetchUserRepos(newToken));
      }
    };

    const handleFocus = () => {
      const stored = localStorage.getItem('github_access_token');
      if (stored && stored !== token) {
        const validToken = stored;
        setToken(validToken);
        fetchUserProfile(validToken).then(() => fetchUserRepos(validToken));
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, [token, fetchUserProfile, fetchUserRepos]);

  // Connect via standard GitHub OAuth
  const connectWithOAuth = useCallback(async (mode?: 'default' | 'omit' | 'dev' | 'shared') => {
    setIsConnecting(true);
    setAuthError(null);

    // Open popup window immediately on user gesture to avoid browser popup blockers
    const width = 600;
    const height = 750;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    let popup: Window | null = null;
    try {
      popup = window.open(
        'about:blank',
        'github_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
      );
      if (popup) {
        popup.document.write(`
          <!DOCTYPE html>
          <html>
            <head><title>Connecting to GitHub...</title></head>
            <body style="background:#020617;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:24px;box-sizing:border-box;">
              <div style="font-size:32px;margin-bottom:16px;">🐙</div>
              <div style="font-size:16px;font-weight:600;color:#f8fafc;margin-bottom:8px;">Connecting to GitHub...</div>
              <div style="font-size:12px;color:#64748b;max-width:280px;line-height:1.5;">Redirecting to standard GitHub Authorization window.</div>
            </body>
          </html>
        `);
      }
    } catch (e) {
      console.warn('Initial popup window creation note:', e);
    }

    try {
      const origin = window.location.origin;
      const queryParams = new URLSearchParams({ origin });
      if (mode && mode !== 'default') {
        queryParams.set('mode', mode);
      }

      const res = await fetch(`/api/auth/github/url?${queryParams.toString()}`);
      const data = await res.json();
      if (!data.configured || !data.url) {
        if (popup) popup.close();
        setIsConnecting(false);
        throw new Error('GitHub OAuth is not configured on this server.');
      }
      const targetUrl = data.url;

      if (targetUrl) {
        if (popup && !popup.closed) {
          popup.location.href = targetUrl;
          popup.focus();
        } else {
          // Fallback: If popup was blocked or closed, open in new window
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
        }
      }
    } catch (err: any) {
      if (popup && !popup.closed) popup.close();
      setIsConnecting(false);
      setAuthError(err.message);
      throw err;
    }
  }, []);

  // Connect via Personal Access Token (PAT)
  const connectWithToken = async (pat: string) => {
    const cleanToken = pat.trim();
    if (!cleanToken) {
      throw new Error('Please provide a valid GitHub token.');
    }
    setAuthError(null);
    const userData = await fetchUserProfile(cleanToken);
    await fetchUserRepos(cleanToken);
    return userData;
  };

  // Disconnect / Log out
  const disconnect = () => {
    setToken(null);
    setUser(null);
    setRepos([]);
    localStorage.removeItem('github_access_token');
    localStorage.removeItem('github_user');
  };

  return {
    token,
    user,
    repos,
    isLoadingUser,
    isLoadingRepos,
    isConnecting,
    oauthConfig,
    authError,
    connectWithOAuth,
    connectWithToken,
    disconnect,
    refreshRepos: () => fetchUserRepos(token || undefined),
  };
}
