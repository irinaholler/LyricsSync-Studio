import { useState } from 'react'
import { useProjects } from './useProjects'
import Sidebar from './Sidebar'
import SetupPanel from './SetupPanel'
import TimingPanel from './TimingPanel'
import PreviewPanel from './PreviewPanel'
import ExportPanel from './ExportPanel'
import s from './App.module.css'

export default function App() {
  const {
    projects, active, activeId, setActiveId,
    updateActive, createProject, deleteProject, renameProject,
    theme, toggleTheme,
  } = useProjects()

  const [step, setStep] = useState('setup')
  const [media, setMedia] = useState(null)

  return (
    <div className={s.app}>
      <Sidebar
        projects={projects}
        activeId={activeId}
        setActiveId={(id) => { setActiveId(id); setStep('setup') }}
        createProject={createProject}
        deleteProject={deleteProject}
        renameProject={renameProject}
        step={step}
        setStep={setStep}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <main className={s.main}>
        {step === 'setup' && <SetupPanel project={active} updateActive={updateActive} setStep={setStep} mediaBlob={media} setMedia={setMedia} />}
        {step === 'timing' && <TimingPanel project={active} updateActive={updateActive} setStep={setStep} mediaBlob={media} />}
        {step === 'preview' && <PreviewPanel project={active} setStep={setStep} mediaBlob={media} />}
        {step === 'export' && <ExportPanel project={active} setStep={setStep} mediaBlob={media} />}
      </main>
    </div>
  )
}
