import { useRef, useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, TriangleAlert } from 'lucide-react'
import s from './panels.module.css'

function fmtTime(secs) {
  if (secs === null || secs === undefined) return '—:——.——'
  const m = Math.floor(secs / 60)
  const sec = (secs % 60).toFixed(2).padStart(5, '0')
  return `${String(m).padStart(2, '0')}:${sec}`
}

export default function TimingPanel({ project, updateActive, setStep, mediaBlob }) {
  const mediaRef = useRef(null)
  const listRef = useRef(null)
  const [tapIdx, setTapIdx] = useState(0)
  const [showClearModal, setShowClearModal] = useState(false)

  const lines = project.lines

  useEffect(() => {
    const firstUntimed = lines.findIndex(l => l.time === null)
    setTapIdx(firstUntimed === -1 ? lines.length : firstUntimed)
  }, [project.id])

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${tapIdx}"]`)
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [tapIdx])

  useEffect(() => {
    function onKey(e) {
      if (showClearModal && e.key === 'Escape') {
        setShowClearModal(false)
        return
      }

      if (e.code === 'Space' && e.target === document.body && !showClearModal) {
        e.preventDefault()
        tap()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showClearModal, tapIdx, lines])

  function tap() {
    const OFFSET = 0.1 // 100 ms

    if (!mediaRef.current) {
      alert('Load a media file first.')
      return
    }
    if (tapIdx >= lines.length) return
    setTimeTo(tapIdx, Math.max(0, mediaRef.current.currentTime - OFFSET))
    setTapIdx(i => i + 1)
  }

  function tapForLine(idx) {
    if (!mediaRef.current) {
      alert('Load a media file first.')
      return
    }
    setTimeTo(idx, mediaRef.current.currentTime)
    setTapIdx(idx + 1)
  }

  function setTimeTo(idx, time) {
    const next = lines.map((l, i) => (i === idx ? { ...l, time } : l))
    updateActive({ lines: next })
  }

  function editTime(idx, val) {
    const t = parseFloat(val)
    const next = lines.map((l, i) =>
      i === idx ? { ...l, time: isNaN(t) || val === '' ? null : t } : l
    )
    updateActive({ lines: next })
  }

  function confirmClearAll() {
    updateActive({ lines: lines.map(l => ({ ...l, time: null })) })
    setTapIdx(0)
    setShowClearModal(false)
  }

  const timedCount = lines.filter(l => l.time !== null).length

  return (
    <>
      <div className={s.panel}>
        <h2>Set the timing</h2>
        <p className={s.sub}>
          Play your music and tap when each line starts singing.
          You can also type the exact second manually.
        </p>

        <div className={s.card}>
          {mediaBlob
            ? mediaBlob.type.startsWith('video')
              ? <video ref={mediaRef} src={mediaBlob.url} controls className={s.video} />
              : <audio ref={mediaRef} src={mediaBlob.url} controls className={s.audio} />
            : <p className={s.noMedia}>No media loaded — go to Setup first.</p>
          }

          <button className={s.btnTap} onClick={tap}>
            ⏎ &nbsp; Tap — mark current line &nbsp;
            <span className={s.tapHint}>(or press Space)</span>
          </button>
        </div>

        <div className={s.card}>
          <div className={s.cardLabel}>
            Lines &nbsp;
            <span className={s.pill}>{timedCount} / {lines.length} timed</span>
          </div>

          <div className={s.linesScroll} ref={listRef}>
            {lines.map((line, idx) => (
              <div
                key={idx}
                data-idx={idx}
                className={[
                  s.lineRow,
                  line.time !== null ? s.timed : '',
                  idx === tapIdx ? s.current : '',
                ].join(' ')}
              >
                <span className={s.timeBadge}>{fmtTime(line.time)}</span>
                <span className={s.lineText}>{line.text}</span>

                <input
                  className={s.timeInput}
                  type="number"
                  step="0.01"
                  min="0"
                  value={line.time !== null ? line.time.toFixed(2) : ''}
                  placeholder="sec"
                  title="Edit seconds manually"
                  onChange={e => editTime(idx, e.target.value)}
                />

                <button className={s.tapLineBtn} onClick={() => tapForLine(idx)}>
                  Tap
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={s.row}>
          <button
            className={`${s.btn} ${s.btnDanger}`}
            onClick={() => setShowClearModal(true)}
          >
            Clear all timestamps
          </button>

          <button className={s.btn} onClick={() => setStep('setup')}>
            <ArrowLeft size={14} /> Back
          </button>

          <button className={`${s.btn} ${s.btnAccent}`} onClick={() => setStep('preview')}>
            Preview <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {showClearModal && (
        <div className={s.modalOverlay} onClick={() => setShowClearModal(false)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalIcon}>
              <TriangleAlert size={18} />
            </div>

            <h3 className={s.modalTitle}>Clear all timestamps?</h3>
            <p className={s.modalText}>
              This will remove all saved timing marks for this song.
              Your lyrics will stay, but you’ll need to sync the lines again.
            </p>

            <div className={s.modalActions}>
              <button className={s.btn} onClick={() => setShowClearModal(false)}>
                Cancel
              </button>
              <button className={`${s.btn} ${s.btnDangerSolid}`} onClick={confirmClearAll}>
                Yes, clear all
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}