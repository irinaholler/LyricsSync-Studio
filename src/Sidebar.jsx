import { useState } from 'react'
import { Sun, Moon, Plus, Trash2, Music2, Pencil, Check } from 'lucide-react'
import s from './Sidebar.module.css'

const STEPS = [
  { id: 'setup',   label: 'Setup' },
  { id: 'timing',  label: 'Timing' },
  { id: 'preview', label: 'Preview' },
  { id: 'export',  label: 'Export' },
]

export default function Sidebar({
  projects, activeId, setActiveId,
  createProject, deleteProject, renameProject,
  step, setStep,
  theme, toggleTheme,
}) {
  const [editingId, setEditingId] = useState(null)
  const [editVal, setEditVal]     = useState('')

  function startRename(p, e) {
    e.stopPropagation()
    setEditingId(p.id)
    setEditVal(p.name)
  }

  function commitRename(id) {
    if (editVal.trim()) renameProject(id, editVal.trim())
    setEditingId(null)
  }

  return (
    <aside className={s.sidebar}>
      <div className={s.head}>
        <span className={s.logo}>Lyrics<em>Sync</em></span>
        <button className={s.themeBtn} onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      {/* Projects */}
      <div className={s.sectionLabel}>
        <span>Projects</span>
        <button className={s.addBtn} onClick={createProject} title="New project">
          <Plus size={13} />
        </button>
      </div>

      <div className={s.projectList}>
        {projects.map(p => (
          <div
            key={p.id}
            className={`${s.projItem} ${p.id === activeId ? s.active : ''}`}
            onClick={() => { setActiveId(p.id); setStep('setup') }}
          >
            <Music2 size={13} className={s.projIcon} />
            {editingId === p.id ? (
              <input
                className={s.renameInput}
                value={editVal}
                autoFocus
                onChange={e => setEditVal(e.target.value)}
                onBlur={() => commitRename(p.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename(p.id)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span className={s.projName}>{p.name}</span>
            )}
            <button
              className={s.iconBtn}
              onClick={(e) => startRename(p, e)}
              title="Rename"
            >
              <Pencil size={11} />
            </button>
            <button
              className={`${s.iconBtn} ${s.danger}`}
              onClick={e => { e.stopPropagation(); deleteProject(p.id) }}
              title="Delete"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>

      {/* Step navigation */}
      <div className={s.nav}>
        {STEPS.map((st, i) => (
          <button
            key={st.id}
            className={`${s.navItem} ${step === st.id ? s.navActive : ''}`}
            onClick={() => setStep(st.id)}
          >
            <span className={s.navNum}>{i + 1}</span>
            {st.label}
          </button>
        ))}
      </div>
    </aside>
  )
}
