import { useEffect, useRef, useState } from 'react'
import {
  QUALITY_SCORE,
  QUALITY_SCORE_BREAKDOWN,
  QUALITY_SCORE_TREND,
} from './mockDiff'
import { fetchQuality } from './api'
import { track } from './analytics/events'
import './FeedQualityScore.css'

interface Props {
  uploadId?: string
}

function Sparkline({ data, onHover }: { data: number[]; onHover?: () => void }) {
  const width = 120
  const height = 32
  const padding = 6

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((v - min) / range) * (height - padding * 2)
    return { x, y }
  })

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ')
  const last = points[points.length - 1]

  return (
    <svg
      className="quality-score__sparkline"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      onMouseEnter={onHover}
    >
      <polyline
        points={polylinePoints}
        fill="none"
        stroke="#0A5546"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={3} fill="#0A5546" />
    </svg>
  )
}

export default function FeedQualityScore({ uploadId }: Props) {
  const [realData, setRealData] = useState<{
    score: number
    catalogReadyCount: number
    totalCount: number
    notReadyCount: number
    breakdown: { field: string; count: number }[]
    trend: number[]
  } | null>(null)

  const hasTrackedScore = useRef(false)
  const hasTrackedBreakdown = useRef(false)
  const hasTrackedTrend = useRef(false)

  // Fetch real data when uploadId is provided
  useEffect(() => {
    if (!uploadId) {
      setRealData(null)
      return
    }

    let cancelled = false
    fetchQuality().then(result => {
      if (cancelled) return
      const q = result.feedQuality
      if (!q.current) return
      setRealData({
        score: q.current.score,
        catalogReadyCount: q.current.catalogReadyCount,
        totalCount: q.current.totalCount,
        notReadyCount: q.current.notReadyCount,
        breakdown: q.current.breakdown.filter(b => b.field !== 'missing_price'),
        trend: q.trend.map(t => t.score).reverse(),
      })
    }).catch(err => console.error('[FeedQualityScore] fetch error:', err))

    return () => { cancelled = true }
  }, [uploadId])

  const score = realData?.score ?? QUALITY_SCORE.score
  const catalogReadyCount = realData?.catalogReadyCount ?? QUALITY_SCORE.catalogReadyCount
  const totalCount = realData?.totalCount ?? QUALITY_SCORE.totalCount
  const notReadyCount = realData?.notReadyCount ?? QUALITY_SCORE.notReadyCount
  const breakdown = realData?.breakdown ?? QUALITY_SCORE_BREAKDOWN
  const trend = realData?.trend ?? QUALITY_SCORE_TREND

  const isPerfect = score === 100
  const isLow = score < 50

  // Track score_viewed on render
  useEffect(() => {
    if (!hasTrackedScore.current) {
      hasTrackedScore.current = true
      track({
        event: 'catalog_quality_score_viewed',
        retailer_id: 'mock-retailer',
        feed_id: uploadId ?? 'mock-feed',
        score_pct: score,
        catalog_ready_count: catalogReadyCount,
        total_count: totalCount,
        not_ready_count: notReadyCount,
      })
    }
  }, [])

  // Track breakdown_viewed when breakdown is rendered
  useEffect(() => {
    if (!hasTrackedBreakdown.current && notReadyCount > 0) {
      hasTrackedBreakdown.current = true
      track({
        event: 'catalog_quality_breakdown_viewed',
        retailer_id: 'mock-retailer',
        feed_id: uploadId ?? 'mock-feed',
        score_pct: score,
      })
    }
  }, [notReadyCount, score])

  function handleSparklineHover() {
    if (hasTrackedTrend.current) return
    hasTrackedTrend.current = true
    const direction = trend[trend.length - 1] > trend[0] ? 'up' as const
      : trend[trend.length - 1] < trend[0] ? 'down' as const
      : 'flat' as const
    track({
      event: 'catalog_quality_trend_viewed',
      retailer_id: 'mock-retailer',
      feed_id: uploadId ?? 'mock-feed',
      trend_direction: direction,
    })
  }

  // Format breakdown field names for display
  function formatField(field: string): string {
    return field.replace(/^missing_/, '').replace(/_/g, ' ')
  }

  return (
    <div className={`quality-score${isLow ? ' quality-score--warning' : ''}`}>
      <h3 className="quality-score__header">Feed quality score</h3>

      {/* Score display */}
      <div className="quality-score__value">
        <span
          className={`quality-score__pct${
            isPerfect
              ? ' quality-score__pct--perfect'
              : isLow
                ? ' quality-score__pct--warning'
                : ''
          }`}
        >
          {score}%
        </span>
        <span className="quality-score__label">catalog-ready</span>
      </div>

      {/* Celebratory text for 100% */}
      {isPerfect && (
        <div className="quality-score__perfect">Perfect score!</div>
      )}

      {/* Raw counts */}
      <div className="quality-score__counts">
        {catalogReadyCount} / {totalCount} products are catalog-ready
      </div>

      {/* Warning CTA for low scores */}
      {isLow && (
        <div className="quality-score__cta">
          Contact your TAM for help improving your feed quality
        </div>
      )}

      {/* Not-ready summary + breakdown */}
      {notReadyCount > 0 && (
        <>
          <div className="quality-score__attention">
            {notReadyCount} products need attention
          </div>
          <div className="quality-score__breakdown">
            {breakdown.map(
              (entry, i) =>
                `${entry.count} missing ${formatField(entry.field)}${
                  i < breakdown.length - 1 ? ' \u00B7 ' : ''
                }`,
            ).join('')}
          </div>
        </>
      )}

      {/* Sparkline */}
      {trend.length > 1 && (
        <Sparkline data={trend} onHover={handleSparklineHover} />
      )}
    </div>
  )
}
