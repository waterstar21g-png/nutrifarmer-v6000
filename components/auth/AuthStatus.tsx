'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { navigateAfterWriteLogout, openAuthFromWritePopup } from '@/lib/auth-navigation';
import {
  userMemberGrade,
  userMemberGradeLabel,
  type MemberGrade,
} from '@/lib/v5000-auth/config';

const AUTH_API = '/api/v5000/auth';

const GRADE_CLASS: Record<MemberGrade, string> = {
  admin: 'nf-auth-chip__role--admin',
  regular: 'nf-auth-chip__role--regular',
  star: 'nf-auth-chip__role--star',
};

export function AuthStatus() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch(`${AUTH_API}/me`)
      .then(r => r.json())
      .then(data => {
        if (data.loggedIn) {
          setName(data.user?.name ?? '회원');
          setRole(data.user?.role ?? 'author');
          setPostCount(data.user?.publishedPostCount ?? 0);
          return;
        }
        setName(null);
        setRole(null);
        setPostCount(0);
      })
      .catch(() => {
        setName(null);
        setRole(null);
        setPostCount(0);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function logout() {
    await fetch(`${AUTH_API}/logout`, { method: 'POST' });
    setName(null);
    setRole(null);
    setPostCount(0);
    if (window.location.pathname.startsWith('/write')) {
      navigateAfterWriteLogout();
      return;
    }
    router.refresh();
    router.push('/');
  }

  if (loading) return <span className="nf-auth-chip nf-auth-chip--muted">…</span>;

  if (!name) {
    return (
      <button
        type="button"
        className="nf-auth-chip nf-auth-chip--login"
        onClick={() => openAuthFromWritePopup('/login?redirect_to=/write')}
      >
        로그인
      </button>
    );
  }

  const grade = userMemberGrade(role, postCount);
  const gradeLabel = userMemberGradeLabel(role, postCount);

  return (
    <div className="nf-auth-chip-group">
      <span className="nf-auth-chip nf-auth-chip--user">
        {name}님
        <span className={`nf-auth-chip__role ${GRADE_CLASS[grade]}`}>({gradeLabel})</span>
      </span>
      <button type="button" className="nf-auth-chip nf-auth-chip--logout" onClick={logout}>
        로그아웃
      </button>
    </div>
  );
}
