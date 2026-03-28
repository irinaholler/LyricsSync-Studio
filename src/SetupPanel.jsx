import { useRef } from 'react'
import { Upload, FileMusic, ArrowRight } from 'lucide-react'
import s from './panels.module.css'

export default function SetupPanel({ project, updateActive, setStep, mediaBlob, setMedia }) {
  const fileRef  = useRef()
  const lrcRef   = useRef()

  function handleMediaFile(file) {
    if (!file) return
    if (mediaBlob) URL.revokeObjectURL(mediaBlob.url)
    setMedia({ url: URL.createObjectURL(file), type: file.type, name: file.name })
  }

  function handleLRCImport(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const lines = []
      const rawLyrics = []
      text.split('\n').forEach(line => {
        const m = line.match(/^\[(\d{2}):(\d{2}\.\d+)\](.*)$/)
        if (m) {
          const time = parseInt(m[1]) * 60 + parseFloat(m[2])
          const txt  = m[3].trim()
          if (txt) {
            lines.push({ text: txt, time })
            rawLyrics.push(txt)
          }
        }
      })
      updateActive({ lines, lyrics: rawLyrics.join('\n') })
    }
    reader.readAsText(file)
  }

  function handleLyricsChange(val) {
    const lines = val.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .map(text => ({ text, time: null }))
    updateActive({ lyrics: val, lines })
  }

  const timedCount = project.lines.filter(l => l.time !== null).length

  return (
    <div className={s.panel}>
      <h2>Set up your song</h2>
      <p className={s.sub}>Paste your lyrics and load a music or video file.</p>

      {/* Status pills */}
      <div className={s.statusBar}>
        <span><span className={`${s.dot} ${project.lines.length > 0 ? s.on : ''}`} />
          {project.lines.length > 0 ? `${project.lines.length} lines` : 'No lyrics yet'}
        </span>
        <span><span className={`${s.dot} ${mediaBlob ? s.on : ''}`} />
          {mediaBlob ? mediaBlob.name : 'No media loaded'}
        </span>
        <span><span className={`${s.dot} ${timedCount > 0 ? s.on : ''}`} />
          {timedCount > 0 ? `${timedCount} lines timed` : 'Not timed yet'}
        </span>
      </div>

      {/* Lyrics */}
      <div className={s.card}>
        <div className={s.cardLabel}>Lyrics</div>
        <textarea
          className={s.textarea}
          value={project.lyrics}
          onChange={e => handleLyricsChange(e.target.value)}
          placeholder={'Never gonna give you up\nNever gonna let you down\nNever gonna run around\nAnd desert you\n...'}
          rows={10}
        />
        <p className={s.hint}>One line = one subtitle. Blank lines are ignored.</p>
      </div>

      {/* Media upload */}
      <div className={s.card}>
        <div className={s.cardLabel}>Audio or Video file</div>
        <div
          className={`${s.uploadZone} ${mediaBlob ? s.loaded : ''}`}
          onClick={() => fileRef.current.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="audio/*,video/*"
            style={{ display: 'none' }}
            onChange={e => handleMediaFile(e.target.files[0])}
          />
          <div className={s.uploadIcon}><FileMusic size={28} /></div>
          {mediaBlob
            ? <span>✓ {mediaBlob.name} — click to change</span>
            : <span>Click to load MP3, MP4, WAV, OGG…</span>
          }
          <p className={s.hint} style={{ marginTop: 6 }}>
            File stays on your computer — nothing is uploaded.
          </p>
        </div>
      </div>

      {/* LRC import */}
      <div className={s.card}>
        <div className={s.cardLabel}>Import existing .lrc file (optional)</div>
        <button
          className={s.btn}
          onClick={() => lrcRef.current.click()}
        >
          <Upload size={14} /> Import .lrc
        </button>
        <input
          ref={lrcRef}
          type="file"
          accept=".lrc,text/plain"
          style={{ display: 'none' }}
          onChange={e => handleLRCImport(e.target.files[0])}
        />
        <p className={s.hint} style={{ marginTop: 8 }}>
          Loads lyrics and timestamps from an existing LRC file so you can edit them.
        </p>
      </div>

      <button
        className={`${s.btn} ${s.btnAccent} ${s.btnWide}`}
        onClick={() => {
          if (project.lines.length === 0) {
            alert('Please add some lyrics first.')
            return
          }
          setStep('timing')
        }}
      >
        Continue to Timing <ArrowRight size={15} />
      </button>
    </div>
  )
}
