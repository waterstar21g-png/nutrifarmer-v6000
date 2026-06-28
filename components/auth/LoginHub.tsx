'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { navigateAfterLogin, navigateToHomeFromLogin } from '@/lib/auth-navigation';
import {
  AUTH_ID_LABEL,
  FIND_HEADING,
  FIND_LEAD,
  LOGIN_HEADING,
  LOGIN_LEAD,
  LOST_HEADING,
  LOST_LEAD,
  RESET_HEADING,
  RESET_LEAD,
  REGISTER_HEADING,
  REGISTER_LEAD,
  VERIFY_HEADING,
  VERIFY_LEAD,
  loginErrorMessage,
  resolveRedirectPath,
} from '@/lib/auth-config';

const AUTH_API = '/api/v5000/auth';

type Panel = 'login' | 'find' | 'lost' | 'verify' | 'reset' | 'register';

interface PickUser {
  id: number;
  login_id: string;
  email_masked: string;
}

function usePanel(): Panel {
  const searchParams = useSearchParams();
  const p = searchParams.get('panel');
  if (p === 'find' || p === 'lost' || p === 'verify' || p === 'reset' || p === 'register') return p;
  return 'login';
}

export function LoginHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const panel = usePanel();
  const redirectTo = resolveRedirectPath(searchParams.get('redirect_to'));
  const resetToken = searchParams.get('token') ?? '';

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [pickUser, setPickUser] = useState<number | null>(null);
  const [pickUsers, setPickUsers] = useState<PickUser[]>([]);

  const [findEmail, setFindEmail] = useState('');
  const [lostLogin, setLostLogin] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [maskedEmail, setMaskedEmail] = useState(searchParams.get('email') ?? '');

  const [regLoginId, setRegLoginId] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');

  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState<'error' | 'info' | 'success'>('error');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const showNotice = useCallback((msg: string, type: 'error' | 'info' | 'success' = 'error') => {
    setNotice(msg);
    setNoticeType(type);
  }, []);

  const goPanel = useCallback((next: Panel, extra?: Record<string, string>) => {
    const params = new URLSearchParams();
    params.set('redirect_to', redirectTo);
    if (next !== 'login') params.set('panel', next);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) params.set(k, v);
    }
    router.push(`/login?${params.toString()}`);
  }, [router, redirectTo]);

  useEffect(() => {
    if (searchParams.get('reset_success') === '1') {
      showNotice('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.', 'success');
    }
  }, [searchParams, showNotice]);

  useEffect(() => {
    fetch(`${AUTH_API}/me`)
      .then(r => r.json())
      .then(data => {
        if (data.loggedIn) {
          navigateAfterLogin(redirectTo);
          return;
        }
      })
      .finally(() => setChecking(false));
  }, [redirectTo]);

  useEffect(() => {
    setNotice('');
  }, [panel]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${AUTH_API}/logout`, { method: 'POST' });

      const res = await fetch(`${AUTH_API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login, password, remember,
          pick_user: pickUser ?? 0,
          redirect_to: redirectTo,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        navigateAfterLogin(redirectTo);
        return;
      }
      if (data.code === 'must_reset_password') {
        showNotice(data.message ?? loginErrorMessage(data.code), 'error');
        goPanel('lost');
        return;
      }
      if (data.code === 'ambiguous' && data.pick_users?.length) {
        setPickUsers(data.pick_users);
        setLogin(data.attempt || login);
        return;
      }
      showNotice(data.message ?? loginErrorMessage(data.code), 'error');
    } catch {
      showNotice('네트워크 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleFind(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_API}/find`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: findEmail }),
      });
      const data = await res.json();
      if (data.ok) {
        showNotice(data.message, 'success');
        return;
      }
      showNotice(data.message ?? loginErrorMessage(data.code), 'error');
    } catch {
      showNotice('네트워크 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleLost(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_API}/lost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: lostLogin }),
      });
      const data = await res.json();
      if (data.ok && data.token) {
        goPanel('verify', { token: data.token, email: data.maskedEmail ?? '' });
        return;
      }
      if (data.ok && data.sent) {
        showNotice(data.message, 'success');
        return;
      }
      showNotice(data.message ?? loginErrorMessage(data.code), 'error');
    } catch {
      showNotice('네트워크 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_API}/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, code: verifyCode }),
      });
      const data = await res.json();
      if (data.ok && data.token) {
        goPanel('reset', { token: data.token });
        return;
      }
      showNotice(data.message ?? loginErrorMessage(data.code), 'error');
    } catch {
      showNotice('네트워크 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_API}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          password: newPassword,
          password_confirm: newPasswordConfirm,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        router.push(`/login?redirect_to=${encodeURIComponent(redirectTo)}&reset_success=1`);
        return;
      }
      showNotice(data.message ?? loginErrorMessage(data.code), 'error');
    } catch {
      showNotice('네트워크 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regLoginId,
          display_name: regDisplayName,
          email: regEmail,
          password: regPassword,
          password_confirm: regPasswordConfirm,
          redirect_to: redirectTo,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        navigateAfterLogin(redirectTo);
        return;
      }
      showNotice(data.message ?? loginErrorMessage(data.code), 'error');
    } catch {
      showNotice('네트워크 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="nf-auth-scene">
        <div className="nf-auth-card"><p className="nf-auth-lead">로그인 확인 중…</p></div>
      </div>
    );
  }

  const panelOpen = panel !== 'login';

  return (
    <div className="nf-auth-scene">
      <div className={`nf-auth-dual-shell${panelOpen ? ' is-panel-open' : ''}`}>
        {/* ── 로그인 카드 ── */}
        {panel === 'login' && (
          <div className="nf-auth-card nf-auth-card--login">
            <div className="nf-auth-card-header">
              <span className="nf-auth-badge">✨ 개인홈페이지형 블로그</span>
              <h1>{LOGIN_HEADING}</h1>
              <p className="nf-auth-lead">{LOGIN_LEAD}</p>
            </div>

            <form className={`nf-auth-form${pickUsers.length ? ' nf-auth-form--pick-id' : ''}`} onSubmit={handleLogin} noValidate>
              {notice && <div className={`nf-auth-notice nf-auth-notice--${noticeType}`} role="alert">{notice}</div>}
              {pickUsers.length > 0 && (
                <div className="nf-auth-notice nf-auth-notice--info" role="status">
                  별명 <strong>{login}</strong>에 해당하는 계정이 여러 개 있습니다. 로그인할 ID를 선택해 주세요.
                </div>
              )}
              <div id="nf_login_identity">
                {pickUsers.length > 0 ? (
                  <>
                    <fieldset className="nf-auth-id-pick">
                      <legend className="nf-auth-id-pick-legend">로그인 ID 선택</legend>
                      <ul className="nf-auth-id-pick-list" role="list">
                        {pickUsers.map(u => (
                          <li key={u.id}>
                            <label className="nf-auth-id-pick-option">
                              <input type="radio" name="nf_pick_user" value={u.id} required
                                checked={pickUser === u.id} onChange={() => setPickUser(u.id)} />
                              <span className="nf-auth-id-pick-label">
                                <strong>{u.login_id}</strong><small>{u.email_masked}</small>
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </fieldset>
                    <p className="nf-auth-id-pick-back">
                      <button type="button" className="nf-auth-link-btn" onClick={() => { setPickUsers([]); setPickUser(null); }}>다른 이름·별명·이메일으로 로그인</button>
                    </p>
                  </>
                ) : (
                  <label className="nf-auth-field">
                    <span>{AUTH_ID_LABEL}</span>
                    <input type="text" required autoComplete="username" placeholder="예: 홍길동, myuser123, name@email.com"
                      value={login} onChange={e => setLogin(e.target.value)} />
                  </label>
                )}
              </div>
              <label className="nf-auth-field">
                <span>비밀번호</span>
                <input type="password" required autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)} />
              </label>
              <label className="nf-auth-remember">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                로그인 상태 유지
              </label>
              <button type="submit" className="nf-auth-submit" disabled={loading}>
                {loading ? '확인 중…' : '로그인'}
              </button>
            </form>

            <div className="nf-auth-links nf-auth-links--inline">
              <button type="button" className="nf-auth-link-btn" onClick={() => goPanel('lost')}>비밀번호를 잊으셨나요?</button>
              <button type="button" className="nf-auth-link-btn" onClick={() => goPanel('find')}>계정(아이디) 찾기</button>
            </div>
            <p className="nf-auth-hint nf-auth-hint--register">
              아직 계정이 없으신가요?{' '}
              <button type="button" className="nf-auth-link-btn" onClick={() => goPanel('register')}>회원가입</button>
            </p>
            <div className="nf-auth-links">
              <button type="button" className="nf-auth-link-btn" onClick={() => navigateToHomeFromLogin()}>
                ← 홈으로
              </button>
            </div>
          </div>
        )}

        {panel === 'register' && (
          <aside className="nf-auth-side-panel nf-auth-side-panel--register">
            <div className="nf-auth-card nf-auth-card--register">
              <div className="nf-auth-screen-label">회원가입</div>
              <h1>{REGISTER_HEADING}</h1>
              <p className="nf-auth-lead">{REGISTER_LEAD}</p>
              {notice && <div className={`nf-auth-notice nf-auth-notice--${noticeType}`} role="alert">{notice}</div>}
              <form className="nf-auth-form" onSubmit={handleRegister} noValidate>
                <label className="nf-auth-field">
                  <span>로그인 ID (별명)</span>
                  <input type="text" required autoComplete="username" placeholder="예: 홍길동, myuser123"
                    value={regLoginId} onChange={e => setRegLoginId(e.target.value)} />
                </label>
                <p className="nf-auth-hint">한글 2자+ · 영문·숫자 ID 6자+</p>
                <label className="nf-auth-field">
                  <span>이름·별명 (표시 이름)</span>
                  <input type="text" required autoComplete="name" placeholder="화면에 표시되는 이름"
                    value={regDisplayName} onChange={e => setRegDisplayName(e.target.value)} />
                </label>
                <label className="nf-auth-field">
                  <span>이메일</span>
                  <input type="email" required autoComplete="email" placeholder="name@email.com"
                    value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                </label>
                <label className="nf-auth-field">
                  <span>비밀번호</span>
                  <input type="password" required autoComplete="new-password" minLength={4}
                    value={regPassword} onChange={e => setRegPassword(e.target.value)} />
                </label>
                <label className="nf-auth-field">
                  <span>비밀번호 확인</span>
                  <input type="password" required autoComplete="new-password" minLength={4}
                    value={regPasswordConfirm} onChange={e => setRegPasswordConfirm(e.target.value)} />
                </label>
                <button type="submit" className="nf-auth-submit" disabled={loading}>
                  {loading ? '가입 처리 중…' : '가입하기'}
                </button>
              </form>
              <p className="nf-auth-hint nf-auth-hint--panel-back">
                <button type="button" className="nf-auth-link-btn" onClick={() => goPanel('login')}>← 로그인으로</button>
              </p>
            </div>
          </aside>
        )}

        {/* ── 계정찾기 ── */}
        {panel === 'find' && (
          <aside className="nf-auth-side-panel nf-auth-side-panel--find">
            <div className="nf-auth-card nf-auth-card--find">
              <div className="nf-auth-screen-label">계정찾기</div>
              <h1>{FIND_HEADING}</h1>
              <p className="nf-auth-lead">{FIND_LEAD}</p>
              {notice && <div className={`nf-auth-notice nf-auth-notice--${noticeType}`} role="alert">{notice}</div>}
              <form className="nf-auth-form" onSubmit={handleFind} noValidate>
                <label className="nf-auth-field">
                  <span>계정 입력</span>
                  <input type="email" required autoComplete="email" placeholder="가입 이메일 주소"
                    value={findEmail} onChange={e => setFindEmail(e.target.value)} />
                </label>
                <button type="submit" className="nf-auth-submit" disabled={loading}>
                  {loading ? '보내는 중…' : '이메일 보내기'}
                </button>
              </form>
              <p className="nf-auth-hint nf-auth-hint--panel-back">
                <button type="button" className="nf-auth-link-btn" onClick={() => goPanel('login')}>← 로그인으로</button>
              </p>
            </div>
          </aside>
        )}

        {/* ── 비밀번호 찾기 ── */}
        {panel === 'lost' && (
          <aside className="nf-auth-side-panel nf-auth-side-panel--lost">
            <div className="nf-auth-card nf-auth-card--lost">
              <div className="nf-auth-screen-label">비밀번호 찾기</div>
              <h1>{LOST_HEADING}</h1>
              <p className="nf-auth-lead">{LOST_LEAD}</p>
              {notice && <div className={`nf-auth-notice nf-auth-notice--${noticeType}`} role="alert">{notice}</div>}
              <form className="nf-auth-form" onSubmit={handleLost} noValidate>
                <label className="nf-auth-field">
                  <span>{AUTH_ID_LABEL}</span>
                  <input type="text" required autoComplete="username" placeholder="이름 · 별명 · 이메일 중 하나"
                    value={lostLogin} onChange={e => setLostLogin(e.target.value)} />
                </label>
                <button type="submit" className="nf-auth-submit" disabled={loading}>
                  {loading ? '보내는 중…' : '재설정 메일 보내기'}
                </button>
              </form>
              <p className="nf-auth-hint nf-auth-hint--panel-back">
                <button type="button" className="nf-auth-link-btn" onClick={() => goPanel('login')}>← 로그인으로</button>
              </p>
            </div>
          </aside>
        )}

        {/* ── 인증코드 확인 ── */}
        {panel === 'verify' && (
          <aside className="nf-auth-side-panel nf-auth-side-panel--verify">
            <div className="nf-auth-card nf-auth-card--lost">
              <div className="nf-auth-screen-label">확인 코드 입력</div>
              <h1>{VERIFY_HEADING}</h1>
              <p className="nf-auth-lead">{VERIFY_LEAD}</p>
              {maskedEmail && (
                <div className="nf-auth-notice nf-auth-notice--info" role="status">
                  <strong>{maskedEmail}</strong>(으)로 확인 코드 메일을 보냈습니다.
                </div>
              )}
              {notice && <div className={`nf-auth-notice nf-auth-notice--${noticeType}`} role="alert">{notice}</div>}
              <form className="nf-auth-form" onSubmit={handleVerify} noValidate>
                <label className="nf-auth-field">
                  <span>확인 코드 (6자리)</span>
                  <input className="nf-auth-code-input" type="text" required inputMode="numeric"
                    pattern="[0-9]{6}" maxLength={6} minLength={6} autoComplete="one-time-code"
                    placeholder="000000" value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                </label>
                <button type="submit" className="nf-auth-submit" disabled={loading}>
                  {loading ? '확인 중…' : '확인하고 비밀번호 재설정하기'}
                </button>
              </form>
              <p className="nf-auth-hint">코드를 받지 못했으면 <button type="button" className="nf-auth-link-btn" onClick={() => goPanel('lost')}>비밀번호 찾기</button>에서 다시 요청해 주세요.</p>
              <p className="nf-auth-hint nf-auth-hint--panel-back">
                <button type="button" className="nf-auth-link-btn" onClick={() => goPanel('login')}>← 로그인으로</button>
              </p>
            </div>
          </aside>
        )}

        {/* ── 비밀번호 재설정 ── */}
        {panel === 'reset' && (
          <aside className="nf-auth-side-panel nf-auth-side-panel--reset">
            <div className="nf-auth-card nf-auth-card--lost">
              <div className="nf-auth-screen-label">비밀번호 재설정</div>
              <h1>{RESET_HEADING}</h1>
              <p className="nf-auth-lead">{RESET_LEAD}</p>
              {notice && <div className={`nf-auth-notice nf-auth-notice--${noticeType}`} role="alert">{notice}</div>}
              <form className="nf-auth-form" onSubmit={handleReset} noValidate>
                <label className="nf-auth-field">
                  <span>새 비밀번호</span>
                  <input type="password" required autoComplete="new-password" minLength={4}
                    value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </label>
                <p className="nf-auth-hint">비밀번호는 4자 이상.</p>
                <label className="nf-auth-field">
                  <span>새 비밀번호 확인</span>
                  <input type="password" required autoComplete="new-password" minLength={4}
                    value={newPasswordConfirm} onChange={e => setNewPasswordConfirm(e.target.value)} />
                </label>
                <button type="submit" className="nf-auth-submit" disabled={loading}>
                  {loading ? '저장 중…' : '비밀번호 저장'}
                </button>
              </form>
              <p className="nf-auth-hint nf-auth-hint--panel-back">
                <button type="button" className="nf-auth-link-btn" onClick={() => goPanel('login')}>← 로그인으로</button>
              </p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
