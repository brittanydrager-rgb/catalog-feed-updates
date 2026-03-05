import {
  QUALITY_SCORE,
  QUALITY_SCORE_BREAKDOWN,
  QUALITY_SCORE_TREND,
} from './mockDiff'
import './FeedQualityScore.css'

function Sparkline({ data }: { data: number[] }) {
  const width = 120
  const height = 32
  const padding = 6 // room for the endpoint circle

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

export default function FeedQualityScore() {
  const { score, catalogReadyCount, totalCount, notReadyCount } = QUALITY_SCORE
  const isPerfect = score === 100
  const isLow = score < 50

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
            {QUALITY_SCORE_BREAKDOWN.map(
              (entry, i) =>
                `${entry.count} missing ${entry.field}${
                  i < QUALITY_SCORE_BREAKDOWN.length - 1 ? ' \u00B7 ' : ''
                }`,
            ).join('')}
          </div>
        </>
      )}

      {/* Sparkline */}
      <Sparkline data={QUALITY_SCORE_TREND} />
    </div>
  )
}
