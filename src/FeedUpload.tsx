import { useRef, useState } from 'react'
import './FeedUpload.css'

type UploadState = 'idle' | 'processing'

interface Props {
  onComplete: (filename: string) => void
}

export default function FeedUpload({ onComplete }: Props) {
  const [state, setState] = useState<UploadState>('idle')
  const [dragging, setDragging] = useState(false)
  const [filename, setFilename] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setFilename(file.name)
    setState('processing')
    setTimeout(() => { setState('idle'); onComplete(file.name) }, 2200)
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
          <div className="feed-upload__spinner" />
          <p className="feed-upload__processing-title">Analyzing your feed...</p>
          <p className="feed-upload__processing-file">{filename}</p>
          <p className="feed-upload__processing-sub">Comparing against your last feed from Feb 28, 2026</p>
        </div>
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
