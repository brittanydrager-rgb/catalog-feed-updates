import { useImperativeHandle, useRef, useState } from 'react'
import { uploadFile, type UploadResult } from './api'
import './FeedUpload.css'

type UploadState = 'idle' | 'processing' | 'error'

interface Props {
  onComplete: (filename: string, result: UploadResult) => void
  triggerRef?: React.Ref<{ trigger: () => void }>
}

const PHASE_NAMES = [
  'Parsing file...',
  'Validating fields...',
  'Matching products...',
  'Computing diff...',
  'Scoring quality...',
]

export default function FeedUpload({ onComplete, triggerRef }: Props) {
  const [state, setState] = useState<UploadState>('idle')
  const [filename, setFilename] = useState('')
  const [phaseName, setPhaseName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(triggerRef, () => ({ trigger: () => inputRef.current?.click() }))

  async function handleFile(file: File) {
    setFilename(file.name)
    setState('processing')
    setErrorMsg('')

    // Cycle through phase names while waiting for the real upload
    let phaseIdx = 0
    setPhaseName(PHASE_NAMES[0])
    const interval = setInterval(() => {
      phaseIdx = Math.min(phaseIdx + 1, PHASE_NAMES.length - 1)
      setPhaseName(PHASE_NAMES[phaseIdx])
    }, 400)

    try {
      const result = await uploadFile(file)
      clearInterval(interval)
      setState('idle')
      onComplete(file.name, result)
    } catch (err) {
      clearInterval(interval)
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  if (state === 'processing') {
    return (
      <div className="feed-upload feed-upload--processing">
        <div className="feed-upload__processing-inner">
          <div className="feed-upload__doc-icon">
            <svg width="40" height="48" viewBox="0 0 40 48" fill="none">
              <path d="M4 4C4 1.79 5.79 0 8 0H26L36 10V44C36 46.21 34.21 48 32 48H8C5.79 48 4 46.21 4 44V4Z" fill="#E8E9EB"/>
              <path d="M26 0L36 10H30C27.79 10 26 8.21 26 6V0Z" fill="#C8CACD"/>
            </svg>
          </div>
          <p className="feed-upload__processing-title">Analyzing your feed...</p>
          <p className="feed-upload__processing-phase">{phaseName}</p>
          <div className="feed-upload__progress-track">
            <div className="feed-upload__progress-bar" />
          </div>
          <p className="feed-upload__processing-file">{filename}</p>
          <p className="feed-upload__processing-sub">Comparing against your last feed</p>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="feed-upload feed-upload--error" onClick={() => setState('idle')}>
        <p className="feed-upload__title" style={{ color: '#C5280C' }}>Upload failed</p>
        <p className="feed-upload__sub">{errorMsg}</p>
        <p className="feed-upload__formats">Click to try again</p>
      </div>
    )
  }

  return (
    <div
      className={`feed-upload ${dragging ? 'feed-upload--dragging' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        className="feed-upload__input"
        onChange={onInputChange}
        accept="*"
      />

      <div className="feed-upload__icon">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M20 8L20 26M20 8L14 14M20 8L26 14" stroke="#0A5546" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 28V30C8 31.1 8.9 32 10 32H30C31.1 32 32 31.1 32 30V28" stroke="#0A5546" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </div>

      <p className="feed-upload__title">Upload your feed file to preview changes</p>
      <p className="feed-upload__sub">Drag and drop here, or <span className="feed-upload__browse">browse files</span></p>
      <p className="feed-upload__formats">Accepts .txt, .csv, .json, .xml and other feed formats</p>
    </div>
  )
}
