'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProductScoutResult } from '@/lib/itemscout/types';
import { ViewTrendChart } from './ViewTrendChart';

type Step = 'capture' | 'analyzing' | 'result';

interface AnalyzeResponse {
  ok: boolean;
  code?: string;
  message?: string;
  scout?: ProductScoutResult;
  vision?: { confidence: number; keyword: string; productName: string; category?: string };
}

export function ProductScoutFlow() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('capture');
  const [preview, setPreview] = useState<string | null>(null);
  const [hint, setHint] = useState('');
  const [manualKeyword, setManualKeyword] = useState('');
  const [result, setResult] = useState<ProductScoutResult | null>(null);
  const [visionInfo, setVisionInfo] = useState<AnalyzeResponse['vision'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const revokePreview = useCallback((url: string | null) => {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    return () => revokePreview(preview);
  }, [preview, revokePreview]);

  function onPickFile(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) {
      setError('이미지 파일만 선택할 수 있습니다.');
      return;
    }
    revokePreview(preview);
    setPreview(URL.createObjectURL(file));
    setError(null);
    setResult(null);
    setVisionInfo(null);
  }

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('read_failed'));
      reader.readAsDataURL(file);
    });
  }

  async function analyze() {
    setError(null);
    setBusy(true);
    setStep('analyzing');

    try {
      let body: Record<string, unknown> = {};

      if (manualKeyword.trim()) {
        body = {
          keyword: manualKeyword.trim(),
          productName: manualKeyword.trim(),
          skipVision: true,
        };
      } else if (preview) {
        const input = cameraRef.current?.files?.[0] ?? galleryRef.current?.files?.[0];
        let dataUrl = preview;
        if (input && input.size > 0) {
          dataUrl = await readFileAsDataUrl(input);
        } else if (preview.startsWith('blob:')) {
          const blob = await fetch(preview).then(r => r.blob());
          dataUrl = await readFileAsDataUrl(new File([blob], 'capture.jpg', { type: blob.type || 'image/jpeg' }));
        }
        body = { imageDataUrl: dataUrl, hint: hint.trim() || undefined };
      } else {
        throw new Error('사진을 촬영하거나 키워드를 입력해 주세요.');
      }

      const res = await fetch('/api/scout/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as AnalyzeResponse;
      if (!res.ok || !data.ok || !data.scout) {
        throw new Error(data.message ?? '분석에 실패했습니다.');
      }

      setResult(data.scout);
      setVisionInfo(data.vision ?? null);
      setStep('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : '분석에 실패했습니다.');
      setStep('capture');
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    revokePreview(preview);
    setPreview(null);
    setHint('');
    setManualKeyword('');
    setResult(null);
    setVisionInfo(null);
    setError(null);
    setStep('capture');
    if (cameraRef.current) cameraRef.current.value = '';
    if (galleryRef.current) galleryRef.current.value = '';
  }

  return (
    <div className="scout-flow">
      <header className="scout-flow__header">
        <h1 className="scout-flow__title">상품 스카우트</h1>
        <p className="scout-flow__desc">
          사진으로 상품을 인식하고 아이템스카우트 데이터로 시장성을 분석합니다.
        </p>
      </header>

      {step === 'capture' && (
        <section className="scout-panel">
          <div className="scout-capture">
            {preview ? (
              <img src={preview} alt="선택한 상품" className="scout-capture__preview" />
            ) : (
              <div className="scout-capture__placeholder">
                <span aria-hidden>📦</span>
                <p>상품 사진을 촬영하거나<br />갤러리에서 선택하세요</p>
              </div>
            )}
          </div>

          <div className="scout-actions">
            <button type="button" className="scout-btn scout-btn--primary" onClick={() => cameraRef.current?.click()}>
              카메라 촬영
            </button>
            <button type="button" className="scout-btn" onClick={() => galleryRef.current?.click()}>
              갤러리 선택
            </button>
          </div>

          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="scout-hidden"
            onChange={e => onPickFile(e.target.files?.[0])}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="scout-hidden"
            onChange={e => onPickFile(e.target.files?.[0])}
          />

          <label className="scout-field">
            <span>상품 힌트 (선택)</span>
            <input
              type="text"
              value={hint}
              onChange={e => setHint(e.target.value)}
              placeholder="예: 유기농 현미 2kg"
              disabled={busy}
            />
          </label>

          <div className="scout-divider">
            <span>또는</span>
          </div>

          <label className="scout-field">
            <span>키워드 직접 입력</span>
            <input
              type="text"
              value={manualKeyword}
              onChange={e => setManualKeyword(e.target.value)}
              placeholder="예: 보온병 1리터"
              disabled={busy}
            />
          </label>

          {error && <p className="scout-error" role="alert">{error}</p>}

          <button
            type="button"
            className="scout-btn scout-btn--accent scout-btn--block"
            onClick={analyze}
            disabled={busy || (!preview && !manualKeyword.trim())}
          >
            시장 분석 시작
          </button>
        </section>
      )}

      {step === 'analyzing' && (
        <section className="scout-panel scout-panel--center">
          <div className="scout-spinner" aria-hidden />
          <p className="scout-loading__title">분석 중…</p>
          <p className="scout-loading__sub">상품 인식 → 아이템스카우트 데이터 조회</p>
        </section>
      )}

      {step === 'result' && result && (
        <section className="scout-result">
          <div className="scout-result__badge">
            <span className={`scout-source scout-source--${result.source}`}>
              {result.source === 'itemscout' ? '아이템스카우트' : '데모 데이터'}
            </span>
            {visionInfo && (
              <span className="scout-confidence">
                인식 신뢰도 {Math.round(visionInfo.confidence * 100)}%
              </span>
            )}
          </div>

          <h2 className="scout-result__product">{result.productName}</h2>
          <p className="scout-result__keyword">
            키워드: <strong>{result.keyword}</strong>
            {result.category && <span className="scout-result__cat"> · {result.category}</span>}
          </p>

          <div className="scout-metrics">
            <div className="scout-metric">
              <span className="scout-metric__label">1주 조회수</span>
              <span className="scout-metric__value">{formatNum(result.weeklyViews)}</span>
            </div>
            <div className="scout-metric">
              <span className="scout-metric__label">경쟁 상품수</span>
              <span className="scout-metric__value">{formatNum(result.competingProducts)}</span>
            </div>
            <div className="scout-metric">
              <span className="scout-metric__label">1주 판매량</span>
              <span className="scout-metric__value">{formatNum(result.weeklySales)}</span>
            </div>
            <div className="scout-metric scout-metric--wide">
              <span className="scout-metric__label">경쟁 강도</span>
              <div className="scout-competition">
                <div className="scout-competition__bar">
                  <div
                    className="scout-competition__fill"
                    style={{ width: `${result.competitionIntensity}%` }}
                  />
                </div>
                <span className="scout-competition__label">
                  {result.competitionLabel} ({result.competitionIntensity})
                </span>
              </div>
            </div>
          </div>

          <article className="scout-card">
            <h3 className="scout-card__title">조회 추세 (최근 1주)</h3>
            <ViewTrendChart data={result.viewTrend} />
          </article>

          <article className="scout-card">
            <h3 className="scout-card__title">시중판매 최저가격</h3>
            {result.lowestPrices.length ? (
              <ol className="scout-price-list">
                {result.lowestPrices.map(item => (
                  <li key={`${item.rank}-${item.mallName}`} className="scout-price-item">
                    <span className="scout-price-item__rank">{item.rank}</span>
                    <div className="scout-price-item__body">
                      <span className="scout-price-item__name">{item.productName}</span>
                      <span className="scout-price-item__mall">{item.mallName}</span>
                    </div>
                    <span className="scout-price-item__price">{formatPrice(item.price)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="scout-empty">최저가 데이터가 없습니다.</p>
            )}
          </article>

          {result.source === 'demo' && (
            <p className="scout-notice">
              ITEMSCOUT_API_KEY가 설정되지 않아 데모 데이터를 표시합니다.
              B2B API 키 발급 후 실제 아이템스카우트 데이터가 연동됩니다.
            </p>
          )}

          <div className="scout-actions">
            <button type="button" className="scout-btn scout-btn--primary" onClick={reset}>
              새 상품 분석
            </button>
            <a
              href={`https://itemscout.io/keyword/${encodeURIComponent(result.keyword)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="scout-btn scout-btn--link"
            >
              아이템스카우트에서 보기 ↗
            </a>
          </div>
        </section>
      )}
    </div>
  );
}

function formatNum(n: number): string {
  return n.toLocaleString('ko-KR');
}

function formatPrice(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}
