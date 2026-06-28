# nutrifarmer-v6000

**탁월한 찬사 — V6000 모바일 전용**

V5000과 동일 DB·API를 쓰는 모바일 우선 블로그 UI입니다.

## 빠른 시작

```powershell
cd "D:/함께온라인/My_BLOG/nutrifarmer-v6000"
copy ..\nutrifarmer-v5000\.env.local .env.local
npm install
npm run dev
```

브라우저: http://localhost:6000

## Vercel 배포 (완료)

- **URL:** https://nutrifarmer-v6000.vercel.app
- **프로젝트:** `nutrifarmer-front/nutrifarmer-v6000`
- **배포 ID:** `dpl_9DNPg2Kwcg96PZpFRtJaCM9pqYU4`

### ⚠️ DB 연결 (필수 1회)

V6000 Vercel 프로젝트에 **v5000과 동일한 환경 변수**를 복사해야 글이 표시됩니다.

Vercel 대시보드 → `nutrifarmer-v6000` → Settings → Environment Variables

| 변수 | 비고 |
|------|------|
| `DATABASE_URL` | v5000과 동일 |
| `AUTH_SESSION_SECRET` | v5000과 동일 (로그인 SSO) |
| `R2_*` | 미디어 |
| `NEXT_PUBLIC_SITE_URL` | `https://nutrifarmer-v6000.vercel.app` |
| `NEXT_PUBLIC_V5000_WRITE_URL` | `https://www.nutrifarmer.kr/write` |

복사 후 **Redeploy** 하세요.

## GitHub (수동)

```powershell
cd "D:/함께온라인/My_BLOG/nutrifarmer-v6000"
git branch -M main
gh repo create nutrifarmer-v6000 --public --source=. --remote=origin --push
```
