import { useRef, useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import s from './panels.module.css'

export default function PreviewPanel({ project, setStep, mediaBlob }) {
  const mediaRef = useRef(null)
  const [cur, setCur] = useState({ prev: '', cur: '♪ Press play to start ♪' })
  const [flash, setFlash] = useState(false)

  const sorted = [...project.lines]
    .filter(l => l.time !== null)
    .sort((a, b) => a.time - b.time)

  function onTimeUpdate() {
    if (!mediaRef.current) return
    const t = mediaRef.current.currentTime
    let curIdx = -1

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].time <= t) curIdx = i
    }

    const prevLine = curIdx > 0 ? sorted[curIdx - 1].text : ''
    const currentLine = curIdx >= 0 ? sorted[curIdx].text : '♪'
    setCur(prevState => {
      if (prevState.cur !== currentLine) setFlash(true)
      return {
        prev: prevLine,
        cur: currentLine,
      }
    })
  }

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(false), 350)
    return () => clearTimeout(t)
  }, [flash])

  return (
    <div className={s.panel}>
      <h2>Preview</h2>
      <p className={s.sub}>Watch your lyrics follow along in real time.</p>

      {/* Karaoke stage */}
      <div className={s.stage}>
        <div className={s.stagePrev}>{cur.prev}</div>
        <div className={`${s.stageCur} ${flash ? s.flash : ''}`}>{cur.cur}</div>
      </div>

      {/* Player */}
      <div className={s.card}>
        {mediaBlob
          ? mediaBlob.type.startsWith('video')
            ? <video ref={mediaRef} src={mediaBlob.url} controls className={s.video} onTimeUpdate={onTimeUpdate} />
            : <audio ref={mediaRef} src={mediaBlob.url} controls className={s.audio} onTimeUpdate={onTimeUpdate} />
          : <p className={s.noMedia}>No media loaded — go to Setup first.</p>
        }
      </div>

      {sorted.length === 0 && (
        <p className={s.warn}>No timed lines yet — go to the Timing tab first.</p>
      )}

      <div className={s.row}>
        <button className={s.btn} onClick={() => setStep('timing')}>
          <ArrowLeft size={14} /> Fix timing
        </button>
        <button className={`${s.btn} ${s.btnAccent}`} onClick={() => setStep('export')}>
          Export <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
