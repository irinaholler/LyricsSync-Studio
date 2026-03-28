import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  Image as ImageIcon,
  Video,
  X,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import s from './panels.module.css'

function lrcTime(secs) {
  const m = Math.floor(secs / 60)
  const sec = (secs % 60).toFixed(2).padStart(5, '0')
  return `${String(m).padStart(2, '0')}:${sec}`
}

function srtTime(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s2 = Math.floor(secs % 60)
  const ms = Math.round((secs % 1) * 1000)
  const p = (n, d) => String(n).padStart(d, '0')
  return `${p(h, 2)}:${p(m, 2)}:${p(s2, 2)},${p(ms, 3)}`
}

function buildLRC(lines) {
  return lines.map(l => `[${lrcTime(l.time)}]${l.text}`).join('\n')
}

function buildSRT(lines) {
  return lines.map((l, i) => {
    const end = lines[i + 1] ? lines[i + 1].time - 0.05 : l.time + 3
    return `${i + 1}\n${srtTime(l.time)} --> ${srtTime(Math.max(l.time + 0.5, end))}\n${l.text}`
  }).join('\n\n')
}

function downloadText(content, filename) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }))
  a.download = filename
  a.click()
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function wrapText(ctx, text, maxWidth) {
  if (!text) return []
  const words = text.split(' ')
  const lines = []
  let current = ''

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    const width = ctx.measureText(test).width

    if (width <= maxWidth) {
      current = test
    } else {
      if (current) lines.push(current)
      current = word
    }
  }

  if (current) lines.push(current)
  return lines
}

function fitImageCover(img, canvasWidth, canvasHeight) {
  const imgRatio = img.width / img.height
  const canvasRatio = canvasWidth / canvasHeight

  let drawWidth
  let drawHeight
  let x
  let y

  if (imgRatio > canvasRatio) {
    drawHeight = canvasHeight
    drawWidth = img.width * (canvasHeight / img.height)
    x = (canvasWidth - drawWidth) / 2
    y = 0
  } else {
    drawWidth = canvasWidth
    drawHeight = img.height * (canvasWidth / img.width)
    x = 0
    y = (canvasHeight - drawHeight) / 2
  }

  return { x, y, drawWidth, drawHeight }
}

function drawCenteredLines(ctx, lines, centerX, startY, lineHeight) {
  lines.forEach((line, i) => {
    ctx.fillText(line, centerX, startY + i * lineHeight)
  })
}

function getTextState(sorted, t) {
  let curIdx = -1

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].time <= t) curIdx = i
  }

  return {
    prev: curIdx > 0 ? sorted[curIdx - 1].text : '',
    cur: curIdx >= 0 ? sorted[curIdx].text : '',
  }
}

function drawFrame(ctx, opts) {
  const { width, height, bgImg, textState, songTitle, showSongTitle } = opts

  if (bgImg) {
    const fit = fitImageCover(bgImg, width, height)
    ctx.drawImage(bgImg, fit.x, fit.y, fit.drawWidth, fit.drawHeight)
  } else {
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#17171b')
    gradient.addColorStop(1, '#0d0d0f')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  ctx.fillStyle = 'rgba(0,0,0,0.42)'
  ctx.fillRect(0, 0, width, height)

  const radial = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.1,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.75
  )
  radial.addColorStop(0, 'rgba(0,0,0,0)')
  radial.addColorStop(1, 'rgba(0,0,0,0.35)')
  ctx.fillStyle = radial
  ctx.fillRect(0, 0, width, height)

  const centerX = width / 2
  ctx.textAlign = 'center'

  const hasTitle = showSongTitle && songTitle.trim()

  if (hasTitle) {
    const titleFontSize = Math.max(24, Math.round(width * 0.028))
    const titleLineHeight = Math.round(titleFontSize * 1.22)
    ctx.fillStyle = 'rgba(255,255,255,0.82)'
    ctx.font = `500 ${titleFontSize}px Inter, sans-serif`
    const titleLines = wrapText(ctx, songTitle.trim(), width * 0.72).slice(0, 2)
    drawCenteredLines(ctx, titleLines, centerX, height * 0.095, titleLineHeight)
  }

  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.font = `500 ${Math.round(width * 0.024)}px Inter, sans-serif`
  const prevLines = wrapText(ctx, textState.prev, width * 0.56).slice(0, 2)
  const prevY = hasTitle ? height * 0.21 : height * 0.24
  drawCenteredLines(ctx, prevLines, centerX, prevY, Math.round(width * 0.034))

  let mainFontSize = Math.round(width * 0.05)
  let mainLineHeight = Math.round(mainFontSize * 1.28)
  let currentLines = []

  while (mainFontSize >= 34) {
    ctx.font = `600 ${mainFontSize}px Inter, sans-serif`
    currentLines = wrapText(ctx, textState.cur || '♪', width * 0.72)
    if (currentLines.length <= 3) break
    mainFontSize -= 3
    mainLineHeight = Math.round(mainFontSize * 1.28)
  }

  ctx.font = `600 ${mainFontSize}px Inter, sans-serif`
  ctx.fillStyle = '#f5f1ea'

  const reservedLines = 3
  const reservedHeight = reservedLines * mainLineHeight
  const actualHeight = currentLines.length * mainLineHeight
  const centerY = hasTitle ? height * 0.54 : height / 2
  const currentStartY =
    centerY - reservedHeight / 2 + (reservedHeight - actualHeight) / 2 + mainLineHeight * 0.15

  drawCenteredLines(ctx, currentLines, centerX, currentStartY, mainLineHeight)
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <button className={s.btn} onClick={handleCopy}>
      {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
    </button>
  )
}

const SIZE_PRESETS = {
  story: { label: 'Story · 1080×1920', width: 1080, height: 1920 },
  square: { label: 'Square · 1080×1080', width: 1080, height: 1080 },
  landscape: { label: 'Landscape · 1920×1080', width: 1920, height: 1080 },
}

export default function ExportPanel({ project, setStep, mediaBlob }) {
  const sorted = [...project.lines]
    .filter(l => l.time !== null)
    .sort((a, b) => a.time - b.time)

  const lrc = sorted.length ? buildLRC(sorted) : '(no timed lines yet)'
  const srt = sorted.length ? buildSRT(sorted) : '(no timed lines yet)'

  const [bgImage, setBgImage] = useState(null)
  const [sizePreset, setSizePreset] = useState('story')
  const [isRenderingVideo, setIsRenderingVideo] = useState(false)
  const [renderStatus, setRenderStatus] = useState('')
  const [downloadNotice, setDownloadNotice] = useState('')
  const [exportBaseName, setExportBaseName] = useState(project.name || 'lyrics_video')
  const [showSongTitle, setShowSongTitle] = useState(false)
  const [songTitle, setSongTitle] = useState(project.name || '')
  const fileRef = useRef(null)

  const slug =
    exportBaseName.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '') || 'lyrics_video'

  const renderRef = useRef({
    cancelled: false,
    recorder: null,
    audio: null,
    stream: null,
    rafId: null,
    audioCtx: null,
    sourceNode: null,
    destNode: null,
    monitorGain: null,
  })

  useEffect(() => {
    setExportBaseName(project.name || 'lyrics_video')
    setSongTitle(project.name || '')
  }, [project.id, project.name])

  useEffect(() => {
    return () => {
      if (bgImage?.url) URL.revokeObjectURL(bgImage.url)
      cleanupRender()
    }
  }, [bgImage])

  function cleanupRender() {
    const current = renderRef.current

    if (current.rafId) {
      cancelAnimationFrame(current.rafId)
      current.rafId = null
    }

    if (current.audio) {
      try {
        current.audio.pause()
      } catch { }
      current.audio.src = ''
      current.audio.load?.()
      current.audio = null
    }

    if (current.sourceNode) {
      try {
        current.sourceNode.disconnect()
      } catch { }
      current.sourceNode = null
    }

    if (current.destNode) {
      try {
        current.destNode.disconnect()
      } catch { }
      current.destNode = null
    }

    if (current.monitorGain) {
      try {
        current.monitorGain.disconnect()
      } catch { }
      current.monitorGain = null
    }

    if (current.recorder && current.recorder.state !== 'inactive') {
      try {
        current.recorder.stop()
      } catch { }
    }
    current.recorder = null

    if (current.stream) {
      current.stream.getTracks().forEach(track => {
        try {
          track.stop()
        } catch { }
      })
      current.stream = null
    }

    if (current.audioCtx) {
      try {
        current.audioCtx.close()
      } catch { }
      current.audioCtx = null
    }
  }

  function cancelRender() {
    renderRef.current.cancelled = true
    setRenderStatus('Cancelling…')
    cleanupRender()
    setIsRenderingVideo(false)
  }

  function handleBgImage(file) {
    if (!file) return
    if (bgImage?.url) URL.revokeObjectURL(bgImage.url)
    setBgImage({
      file,
      name: file.name,
      url: URL.createObjectURL(file),
    })
  }

  async function exportLyricVideo() {
    if (!mediaBlob) {
      alert('Please load a music or video file first in Setup.')
      return
    }

    if (!sorted.length) {
      alert('Please create some timestamps first.')
      return
    }

    if (!window.MediaRecorder || !window.AudioContext) {
      alert('This browser does not support video + audio export here.')
      return
    }

    renderRef.current.cancelled = false

    try {
      setIsRenderingVideo(true)
      setRenderStatus('Preparing media…')

      const { width, height } = SIZE_PRESETS[sizePreset]
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      const bgImg = bgImage?.url ? await loadImage(bgImage.url) : null

      const audio = document.createElement(mediaBlob.type.startsWith('video') ? 'video' : 'audio')
      audio.src = mediaBlob.url
      audio.preload = 'auto'
      audio.muted = false
      audio.volume = 1
      audio.playsInline = true
      audio.crossOrigin = 'anonymous'
      renderRef.current.audio = audio

      await new Promise((resolve, reject) => {
        audio.onloadedmetadata = () => resolve()
        audio.onerror = reject
      })

      const duration = Number(audio.duration)
      if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error('Could not read media duration')
      }

      drawFrame(ctx, {
        width,
        height,
        bgImg,
        textState: getTextState(sorted, 0),
        songTitle,
        showSongTitle,
      })

      const fps = 30
      const canvasStream = canvas.captureStream(fps)

      const audioCtx = new AudioContext()
      renderRef.current.audioCtx = audioCtx

      const sourceNode = audioCtx.createMediaElementSource(audio)
      const destNode = audioCtx.createMediaStreamDestination()
      const monitorGain = audioCtx.createGain()
      monitorGain.gain.value = 0

      sourceNode.connect(destNode)
      sourceNode.connect(monitorGain)
      monitorGain.connect(audioCtx.destination)

      renderRef.current.sourceNode = sourceNode
      renderRef.current.destNode = destNode
      renderRef.current.monitorGain = monitorGain

      await audioCtx.resume()

      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...destNode.stream.getAudioTracks(),
      ])

      if (!combinedStream.getAudioTracks().length) {
        throw new Error('Could not capture audio track for export')
      }

      renderRef.current.stream = combinedStream

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm;codecs=vp8,opus'

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 8_000_000,
      })
      renderRef.current.recorder = recorder

      const chunks = []

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      const done = new Promise(resolve => {
        recorder.onstop = () => resolve()
      })

      recorder.start(250)

      const startedAt = performance.now()
      await audio.play()
      setRenderStatus('Starting render…')

      await new Promise(resolve => {
        function renderLoop() {
          if (renderRef.current.cancelled) {
            resolve()
            return
          }

          const t = Math.min(audio.currentTime, duration)

          drawFrame(ctx, {
            width,
            height,
            bgImg,
            textState: getTextState(sorted, t),
            songTitle,
            showSongTitle,
          })

          const progress = Math.min(100, Math.round((t / duration) * 100))
          setRenderStatus(`Progress: ${progress}%`)

          if (t >= duration - 0.05 || audio.ended) {
            resolve()
            return
          }

          renderRef.current.rafId = requestAnimationFrame(renderLoop)
        }

        renderLoop()
      })

      if (!renderRef.current.cancelled) {
        await wait(150)
      }

      if (recorder.state !== 'inactive') {
        recorder.stop()
      }

      await done

      if (!renderRef.current.cancelled) {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const filename = `${slug}_${sizePreset}.webm`
        downloadBlob(blob, filename)

        const elapsed = ((performance.now() - startedAt) / 1000).toFixed(1)
        setRenderStatus(`Done — exported in ${elapsed}s`)
        setDownloadNotice(`✓ Video saved as ${filename}`)

        setTimeout(() => {
          setDownloadNotice('')
        }, 4000)
      } else {
        setRenderStatus('Render cancelled')
      }
    } catch (err) {
      console.error(err)
      alert('Video export failed. Please try again.')
      setRenderStatus('')
    } finally {
      cleanupRender()
      setIsRenderingVideo(false)
      renderRef.current.cancelled = false
    }
  }

  return (
    <div className={`${s.panel} ${s.exportPanel}`}>
      <h2>Export</h2>
      <p className={s.sub}>Download your synced lyrics in standard formats, or render a lyric video.</p>

      {sorted.length === 0 && (
        <p className={s.warn}>No timed lines yet — go to the Timing tab first.</p>
      )}

      <div className={`${s.card} ${s.exportHeroCard}`}>
        <div className={s.cardLabel}>Social export - lyric video</div>
        <div className={s.exportHeroBody}>
          <div style={{ marginTop: 14 }}>
            <div className={s.exportFieldLabel}>File name</div>
            <input
              className={s.textInput}
              value={exportBaseName}
              onChange={e => setExportBaseName(e.target.value)}
              placeholder="my_song_lyrics"
              disabled={isRenderingVideo}
            />
          </div>

          <div className={s.socialGrid}>
            <div className={s.socialControls}>
              <div>
                <div className={s.exportFieldLabel}>Background image</div>

                <div
                  className={`${s.uploadZone} ${bgImage ? s.loaded : ''}`}
                  onClick={() => fileRef.current.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => handleBgImage(e.target.files[0])}
                  />
                  <div className={s.uploadIcon}><ImageIcon size={28} /></div>
                  {bgImage
                    ? <span>✓ {bgImage.name} — click to change</span>
                    : <span>Click to load one background image</span>}
                  <p className={s.hint} style={{ marginTop: 6 }}>
                    One image for the whole video.
                  </p>
                </div>
              </div>

              <div className={s.formatBlock}>
                <div className={s.exportFieldLabel}>Format</div>
                <div className={s.presetList}>
                  {Object.entries(SIZE_PRESETS).map(([key, value]) => (
                    <button
                      key={key}
                      className={`${s.presetBtn} ${sizePreset === key ? s.presetBtnActive : ''}`}
                      onClick={() => setSizePreset(key)}
                      disabled={isRenderingVideo}
                    >
                      {value.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={s.optionBlock}>
                <label className={s.switchRow}>
                  <input
                    type="checkbox"
                    checked={showSongTitle}
                    onChange={e => setShowSongTitle(e.target.checked)}
                    disabled={isRenderingVideo}
                  />
                  <span>Show song title</span>
                </label>

                {showSongTitle && (
                  <div className={s.optionField}>
                    <div className={s.exportFieldLabel}>Song title</div>
                    <input
                      className={s.textInput}
                      value={songTitle}
                      onChange={e => setSongTitle(e.target.value)}
                      placeholder="Artist — Song title"
                      disabled={isRenderingVideo}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className={s.previewColumn}>
              <div className={s.exportFieldLabel}>Preview</div>
              <div className={s.previewMini}>
                <div
                  className={s.previewMiniBox}
                  style={{
                    aspectRatio: `${SIZE_PRESETS[sizePreset].width} / ${SIZE_PRESETS[sizePreset].height}`,
                    backgroundImage: bgImage ? `url(${bgImage.url})` : 'none',
                  }}
                >
                  <div className={s.previewMiniOverlay}>
                    {showSongTitle && songTitle.trim() && (
                      <div className={s.previewMiniTitle}>{songTitle}</div>
                    )}

                    <div className={s.previewMiniOverlay}>
                      {showSongTitle && songTitle.trim() && (
                        <div className={s.previewMiniTitle}>{songTitle}</div>
                      )}

                      <div className={s.previewEmpty}>
                        <div className={s.previewEmptyIcon}>♪</div>
                        <div className={s.previewEmptyText}>Lyrics</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!mediaBlob && (
            <p className={s.warn} style={{ marginTop: 14 }}>
              No audio/video loaded yet — go back to Setup and attach your media file first.
            </p>
          )}

          <div className={s.exportActions}>
            <div className={s.row}>
              <button
                className={`${s.btn} ${s.btnAccent}`}
                onClick={exportLyricVideo}
                disabled={!sorted.length || !mediaBlob || isRenderingVideo}
              >
                <Video size={14} />
                {isRenderingVideo ? 'Rendering video…' : 'Render lyric video (.webm)'}
              </button>

              {isRenderingVideo && (
                <button className={s.btn} onClick={cancelRender}>
                  <X size={14} /> Cancel render
                </button>
              )}
            </div>

            {isRenderingVideo && (
              <div className={s.renderNotice}>
                <div className={s.renderNoticeTop}>
                  <div className={s.renderSpinner} />
                  <div>
                    <div className={s.renderTitle}>Rendering your lyric video</div>
                    <div className={s.renderText}>
                      Please wait and keep this tab open. This can take about as long as the song.
                    </div>
                  </div>
                </div>

                <div className={s.renderMeta}>
                  <span>{renderStatus || 'Preparing…'}</span>
                  <span>Do not refresh or close the browser.</span>
                </div>
              </div>
            )}

            {!isRenderingVideo && renderStatus && (
              <p className={s.hint} style={{ marginTop: 12 }}>
                {renderStatus}
              </p>
            )}
          </div>
        </div>
      </div>

      {downloadNotice && <div className={s.successNotice}>{downloadNotice}</div>}

      <div className={s.card}>
        <div className={s.cardLabel}>LRC — for music players</div>
        <pre className={s.codeBox}>{lrc}</pre>
        <div className={s.row} style={{ marginTop: 12 }}>
          <button
            className={`${s.btn} ${s.btnAccent}`}
            onClick={() => downloadText(lrc, `${slug}.lrc`)}
            disabled={!sorted.length}
          >
            <Download size={14} /> Download .lrc
          </button>
          <CopyBtn text={lrc} />
        </div>
        <p className={s.hint} style={{ marginTop: 10 }}>
          Works with VLC, foobar2000, AIMP, and most phone music apps.
        </p>
      </div>

      <div className={s.card}>
        <div className={s.cardLabel}>SRT — for video players &amp; editors</div>
        <pre className={s.codeBox}>{srt}</pre>
        <div className={s.row} style={{ marginTop: 12 }}>
          <button
            className={`${s.btn} ${s.btnAccent}`}
            onClick={() => downloadText(srt, `${slug}.srt`)}
            disabled={!sorted.length}
          >
            <Download size={14} /> Download .srt
          </button>
          <CopyBtn text={srt} />
        </div>
        <p className={s.hint} style={{ marginTop: 10 }}>
          Works with VLC (video), DaVinci Resolve, Adobe Premiere, and most video tools.
        </p>
      </div>

      <button className={s.btn} onClick={() => setStep('preview')}>
        <ArrowLeft size={14} /> Back to preview
      </button>
    </div>
  )
}
