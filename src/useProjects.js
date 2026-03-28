import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'lyricssync_projects'
const THEME_KEY = 'lyricssync_theme'

function newProject(name = 'lyrics_video') {
  return {
    id: Date.now().toString(),
    name,
    lyrics: '',
    lines: [],   // [{ text, time }]
  }
}

export function useProjects() {
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      const list = saved ? JSON.parse(saved) : []
      return list.length > 0 ? list : [newProject()]
    } catch {
      return [newProject()]
    }
  })

  const [activeId, setActiveId] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      const list = saved ? JSON.parse(saved) : []
      return list.length > 0 ? list[0].id : projects[0]?.id
    } catch {
      return null
    }
  })

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(THEME_KEY) || 'dark'
  })

  // Persist projects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  }, [projects])

  // Persist + apply theme
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const active = projects.find(p => p.id === activeId) || projects[0]

  const updateActive = useCallback((changes) => {
    setProjects(prev =>
      prev.map(p => p.id === active.id ? { ...p, ...changes } : p)
    )
  }, [active?.id])

  const createProject = useCallback(() => {
    const p = newProject()
    setProjects(prev => [...prev, p])
    setActiveId(p.id)
  }, [])

  const deleteProject = useCallback((id) => {
    setProjects(prev => {
      const next = prev.filter(p => p.id !== id)
      if (next.length === 0) {
        const fresh = newProject()
        setActiveId(fresh.id)
        return [fresh]
      }
      if (id === activeId) setActiveId(next[0].id)
      return next
    })
  }, [activeId])

  const renameProject = useCallback((id, name) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name } : p))
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }, [])

  return {
    projects,
    active,
    activeId,
    setActiveId,
    updateActive,
    createProject,
    deleteProject,
    renameProject,
    theme,
    toggleTheme,
  }
}
