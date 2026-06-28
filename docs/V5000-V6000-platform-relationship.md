# V5000 · V6000 플랫폼 관계 및 요구사항 수용 규칙

> **확정일:** 2026-06-29  
> **목적:** V5000(데스크톱)과 V6000(모바일)의 **분리·공유 범위**와 **요구사항 반영 방식** 고정  
> **동일본:** `nutrifarmer-v5000/docs/V5000-V6000-platform-relationship.md`

---

## 1. 한 줄 요약

- **프론트(화면·배포·Git)** → **분리**
- **글·회원·미디어·API·DB** → **통합(공유)**
- 요구사항은 **내용에 따라** 통합 수용 또는 개별 수용

---

## 2. 프로그램 관계 — 완전 독립인가?

**아니요.** “앱 2개 + 백엔드 1세트”로 본다.

| 구분 | V5000 | V6000 |
|------|--------|--------|
| 로컬 경로 | `nutrifarmer-v5000` | `nutrifarmer-v6000` |
| GitHub | `nutrifarmer-v5000` | `nutrifarmer-v6000` |
| Vercel | `nutrifarmer-v5000` | `nutrifarmer-v6000` |
| URL | https://www.nutrifarmer.kr | https://m.nutrifarmer.kr |
| UI | 데스크톱 · 히어로 · 8칸 · 글쓰기 에디터 | 모바일 · 하단 네비 · 카드 목록 |
| **공유** | Postgres · R2 · `/api/v5000/*` · `nf-v5000-session` | ↑ 동일 |

V5000에서 게시한 글은 V6000에도 보인다. 로그인·DB·미디어는 같다.

---

## 3. 요구사항 수용 — 통합 vs 개별

### 3.1 통합 수용 (한쪽 수정 → 양쪽 영향)

| 영역 | 예 |
|------|-----|
| 글·게시·카테고리 | 게시 API, slug, pid, 카테고리 8개 |
| 회원·인증 | 로그인, 가입, 세션, 비밀번호 찾기 |
| 미디어 | R2 업로드, CDN URL, 본문 이미지 |
| AI·글쓰기 백엔드 | `/api/v5000/ai/*`, OpenAI 키 |
| DB 스키마 | `v5000_posts`, users 등 |

**SR·CHANGELOG 표기:** `통합` 또는 `V5000+V6000`

### 3.2 개별 수용 (해당 플랫폼 UI만)

| 영역 | V5000 | V6000 |
|------|--------|--------|
| 레이아웃·CSS | `app/globals.css`, 데스크톱 컴포넌트 | `app/globals.css`, `components/m6/*` |
| 네비·히어로·8칸 | SiteHeader, HeroSlider 등 | MobileShell, BottomNav |
| 글쓰기 UI | `/write` WriteEditor | `/write` → www 링크 (현재) |
| 배포·도메인 | www | m |

**SR·CHANGELOG 표기:** `V5000만` 또는 `V6000만`

### 3.3 판단 기준

```
글·회원·API·DB·env  → 통합
화면·버튼·색·배치만 → 개별 (대상 명시)
불명확            → SR에 「V5000 / V6000 / 통합」 사용자 확인
```

---

## 4. 코드 동기화

- `lib/`, `app/api/`는 V5000 **복사본** — 통합 변경 시 양쪽 repo 반영.
- UI만 바꿀 때는 **해당 repo만** 수정.

---

## 5. 관련 URL

- V5000 www: https://www.nutrifarmer.kr
- V6000 mobile: https://m.nutrifarmer.kr
- V5000 write: https://www.nutrifarmer.kr/write
