export interface PipelinePhase {
  name: string
  durationMs: number
}

export const PIPELINE_PHASES: PipelinePhase[] = [
  { name: 'Parsing file...',        durationMs: 300 },
  { name: 'Validating fields...',   durationMs: 400 },
  { name: 'Matching products...',   durationMs: 500 },
  { name: 'Computing diff...',      durationMs: 400 },
  { name: 'Analyzing quality...',   durationMs: 400 },
]

export interface PipelineProgress {
  phaseIndex: number
  phaseName: string
  totalPhases: number
}

/**
 * Simulates the 5-phase feed processing pipeline.
 * Calls `onProgress` at each phase transition so the UI can show the current step.
 * Total duration is ~2 seconds. Returns a resolved promise when complete.
 */
export function processFeed(
  onProgress: (progress: PipelineProgress) => void,
): Promise<void> {
  return new Promise<void>((resolve) => {
    let elapsed = 0

    PIPELINE_PHASES.forEach((phase, index) => {
      setTimeout(() => {
        onProgress({
          phaseIndex: index,
          phaseName: phase.name,
          totalPhases: PIPELINE_PHASES.length,
        })

        // Resolve after the last phase completes
        if (index === PIPELINE_PHASES.length - 1) {
          setTimeout(resolve, phase.durationMs)
        }
      }, elapsed)

      elapsed += phase.durationMs
    })
  })
}
