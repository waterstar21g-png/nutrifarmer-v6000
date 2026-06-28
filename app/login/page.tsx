import type { Metadata } from 'next';
import './login.css';
import { LoginPageClient } from './LoginPageClient';

export const metadata: Metadata = {
  title: '로그인',
  description: '모바일 로그인',
};

export default function LoginPage() {
  return (
    <div className="m6-login-wrap nf-auth-page-root">
      <LoginPageClient />
    </div>
  );
}
