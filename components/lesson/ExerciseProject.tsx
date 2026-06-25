'use client'
import { useEffect, useRef, useState } from 'react'
import { Save, CheckSquare, Square, RefreshCw, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ProjectFiles {
  [filename: string]: string
}

interface ExerciseProjectProps {
  projectTitle: string
  description: string
  template: string
  starterFiles: ProjectFiles
  steps: string[]
  lessonId: string
  userId: string
  isLocked?: boolean
  onUpgradePrompt?: () => void
}

export function ExerciseProject({
  projectTitle,
  description,
  template,
  starterFiles,
  steps,
  lessonId,
  userId,
  isLocked = false,
  onUpgradePrompt
}: ExerciseProjectProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const vmRef = useRef<any>(null)
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>(
    new Array(steps.length).fill(false)
  )
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [initialFiles, setInitialFiles] = useState<ProjectFiles>(starterFiles)

  // 1. Fetch saved project from Supabase on mount
  useEffect(() => {
    if (isLocked) {
      setLoading(false)
      return
    }
    const loadProject = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('user_projects')
          .select('files, steps_done')
          .eq('user_id', userId)
          .eq('lesson_id', lessonId)
          .maybeSingle()

        if (data && !error) {
          if (data.files && Object.keys(data.files).length > 0) {
            setInitialFiles(data.files)
          }
          if (Array.isArray(data.steps_done)) {
            // Map saved boolean array
            setCheckedSteps(data.steps_done)
          }
        }
      } catch (err) {
        console.error('Error loading user project:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [userId, lessonId])

  // 2. Initialize StackBlitz once loading is complete
  useEffect(() => {
    if (loading || isLocked) return

    const initStackBlitz = async () => {
      if (!containerRef.current) return

      const sdk = await import('@stackblitz/sdk')

      const vm = await sdk.default.embedProject(containerRef.current, {
        title: projectTitle,
        description: description,
        template: template as any,
        files: initialFiles,
        settings: {
          compile: {
            trigger: 'auto',
            clearConsole: false
          }
        }
      }, {
        height: 520,
        hideNavigation: true,
        hideDevTools: false,
        forceEmbedLayout: true,
        openFile: Object.keys(initialFiles)[0]
      })

      vmRef.current = vm
    }

    initStackBlitz()
  }, [loading])

  // 3. Save progress handler
  const saveProgress = async (updatedSteps = checkedSteps) => {
    setSaving(true)
    setSaved(false)
    try {
      let currentFiles = initialFiles
      if (vmRef.current) {
        currentFiles = await vmRef.current.getFiles()
      }

      const supabase = createClient()
      const { error } = await supabase
        .from('user_projects')
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          title: projectTitle,
          template: template,
          files: currentFiles,
          steps_done: updatedSteps,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,lesson_id' })

      if (!error) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        console.error('Supabase project save error:', error)
      }
    } catch (err) {
      console.error('Failed to save project:', err)
    } finally {
      setSaving(false)
    }
  }

  const toggleStep = (index: number) => {
    const updated = [...checkedSteps]
    updated[index] = !updated[index]
    setCheckedSteps(updated)
    // Auto-save whenever steps are toggled
    saveProgress(updated)
  }

  const completedCount = checkedSteps.filter(Boolean).length

  if (loading) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        background: 'var(--color-surface-alt)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        color: 'var(--color-text-2)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading workspace data...</span>
      </div>
    )
  }

  return (
    <div style={{
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      overflow: 'hidden',
      marginBlock: '24px'
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 48px 14px 20px',
        background: 'var(--color-surface-alt)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{
            fontSize: '11px',
            color: 'var(--color-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontFamily: 'JetBrains Mono, monospace',
            marginBottom: '6px'
          }}>
            🏗️ Project Exercise
          </div>
          <div style={{
            color: 'var(--color-text-1)',
            fontWeight: 600,
            fontSize: '16px',
            marginBottom: '4px'
          }}>
            {projectTitle}
          </div>
          <p style={{
            color: 'var(--color-text-2)',
            fontSize: '13px',
            margin: 0
          }}>
            {description}
          </p>
        </div>

        {!isLocked && (
          <button
            onClick={() => saveProgress()}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 h-9 bg-primary hover:bg-primary/95 border border-primary border-b-[4px] border-b-blue-700 text-white rounded-xl text-xs font-bold active:translate-y-[2px] active:border-b-[2px] transition-all cursor-pointer shadow-sm select-none shrink-0"
          >
            {saving ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={13} />
                <span>Save Progress</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Paywall overlay or Steps checklist + StackBlitz editor + footer */}
      {isLocked ? (
        <div style={{
          padding: '48px 24px',
          background: 'rgba(91,142,255,0.02)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          borderTop: '1px solid var(--color-border)'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'rgba(91,142,255,0.1)',
            border: '1px solid rgba(91,142,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)'
          }}>
            <Lock size={18} />
          </div>
          <div style={{ maxWidth: '380px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono), monospace', textTransform: 'uppercase', color: 'var(--color-accent)', fontWeight: 600, letterSpacing: '0.05em' }}>Practice Environment Locked</span>
            <p style={{ color: 'var(--color-text-2)', fontSize: '13px', margin: '6px 0 0', lineHeight: '1.5' }}>
              StackBlitz sandbox project workspace is locked. Upgrade to Pro to complete interactive coding projects directly in your browser.
            </p>
          </div>
          <button
            onClick={() => onUpgradePrompt ? onUpgradePrompt() : window.location.href = '/dashboard/settings'}
            className="flex items-center gap-1.5 px-6 h-10 bg-primary hover:bg-primary/95 border border-primary border-b-[4px] border-b-blue-700 text-white rounded-xl text-xs font-bold active:translate-y-[2px] active:border-b-[2px] transition-all cursor-pointer shadow-md"
          >
            Upgrade to Pro
          </button>
        </div>
      ) : (
        <>
          {/* Steps checklist */}
          <div style={{
            padding: '16px 20px',
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)'
          }}>
            <div style={{
              fontSize: '12px',
              color: 'var(--color-text-2)',
              fontWeight: 600,
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}>
              Project Steps — {completedCount}/{steps.length} complete
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {steps.map((step, i) => (
                <div
                  key={i}
                  onClick={() => toggleStep(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '8px 10px',
                    background: checkedSteps[i] ? 'rgba(52,211,153,0.06)' : 'var(--color-surface-alt)',
                    border: `1px solid ${checkedSteps[i] ? 'var(--color-success)' : 'var(--color-border)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    color: checkedSteps[i] ? 'var(--color-success)' : 'var(--color-text-3)',
                    flexShrink: 0,
                    marginTop: '1px'
                  }}>
                    {checkedSteps[i] ? <CheckSquare size={15} /> : <Square size={15} />}
                  </div>
                  <span style={{
                    color: checkedSteps[i] ? 'var(--color-text-3)' : 'var(--color-text-1)',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    textDecoration: checkedSteps[i] ? 'line-through' : 'none'
                  }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* StackBlitz iframe container */}
          <div
            ref={containerRef}
            style={{ width: '100%', minHeight: '520px' }}
          />

          {/* Footer */}
          <div style={{
            padding: '12px 20px',
            background: 'var(--color-surface-alt)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ color: 'var(--color-text-3)', fontSize: '12px' }}>
              Your work is saved in the cloud and synced to your profile
            </span>
            {saved && (
              <span style={{ color: 'var(--color-success)', fontSize: '12px', fontWeight: 600 }}>
                ✓ Progress saved successfully
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
