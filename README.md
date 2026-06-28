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

## Vercel 배포

- **모바일 URL (목표):** https://m.nutrifarmer.kr *(DNS A 레코드 후)*
- **즉시 접속:** https://nutrifarmer-v6000.vercel.app
- **배포 ID:** `dpl_2KcQw7Q2qFGZNYbdXqpDEtvJkQkv`

### DNS (Cloudflare 1회)

| 유형 | 이름 | 값 | 프록시 |
|------|------|-----|--------|
| A | `m` | `76.76.21.21` | DNS 전용 (회색) |

또는: `node scripts/add-m-subdomain-dns.mjs --apply` (토큰에 Zone.DNS Edit 필요)

## GitHub (수동)

```powershell
cd "D:/함께온라인/My_BLOG/nutrifarmer-v6000"
git branch -M main
gh repo create nutrifarmer-v6000 --public --source=. --remote=origin --push
```
