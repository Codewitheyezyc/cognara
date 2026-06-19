'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Download, Trash2, ArrowLeft, Clock, Sparkles, ChevronRight, BookOpenCheck } from 'lucide-react'
import { GeneratedLesson } from '@/types/ai'
import { CodeBlock } from '@/components/lesson/CodeBlock'
import { Callout } from '@/components/lesson/Callout'
import { LessonTable } from '@/components/lesson/LessonTable'

interface DownloadedLessonEntry {
  id: string
  title: string
  subject: string
  depthLevel: number
  lesson: GeneratedLesson
  downloadedAt: string
}

const depthLabels = ["", "Like I'm 10", "Beginner", "Intermediate", "Advanced", "Expert"]

export default function DownloadsPage() {
  const router = useRouter()
  const [downloads, setDownloads] = useState<Record<string, DownloadedLessonEntry>>({})
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load from local storage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cognara_downloaded_lessons')
        if (stored) {
          setDownloads(JSON.parse(stored))
        }
      } catch (err) {
        console.error('Failed to load downloaded lessons:', err)
      } finally {
        setLoading(false)
      }
    }
  }, [])

  const handleDelete = (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const updated = { ...downloads }
      delete updated[lessonId]
      setDownloads(updated)
      localStorage.setItem('cognara_downloaded_lessons', JSON.stringify(updated))
    } catch (err) {
      console.error('Failed to delete lesson:', err)
    }
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all offline downloaded lessons?')) {
      try {
        localStorage.removeItem('cognara_downloaded_lessons')
        setDownloads({})
        setSelectedLessonId(null)
      } catch (err) {
        console.error('Failed to clear downloaded lessons:', err)
      }
    }
  }

  const downloadList = Object.values(downloads).sort(
    (a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime()
  )

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-text-3 text-sm font-mono">Loading downloads cache...</p>
      </div>
    )
  }

  // Active Offline Lesson Reader View
  if (selectedLessonId && downloads[selectedLessonId]) {
    const entry = downloads[selectedLessonId]
    const { title, subject, depthLevel, lesson } = entry

    return (
      <div className="max-w-[720px] mx-auto pb-16 animate-page-enter">
        {/* Navigation / Header controls */}
        <div className="flex items-center justify-between border-b border-border/60 pb-5 mb-6">
          <button
            onClick={() => setSelectedLessonId(null)}
            className="inline-flex items-center space-x-2 text-xs text-text-2 hover:text-text-1 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Downloads</span>
          </button>
          
          <div className="flex items-center space-x-2 text-[10px] bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Reading Offline</span>
          </div>
        </div>

        {/* Lesson Heading Block */}
        <div className="space-y-4 pb-6 border-b border-border mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 border border-primary/20 bg-primary/10 text-primary text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm">
              {subject || 'Tech'}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 border border-border bg-surface-alt text-text-2 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm">
              {depthLabels[depthLevel] || 'Beginner'}
            </span>
          </div>

          <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-1 tracking-tight">
            {lesson.title || title}
          </h1>

          <div className="flex items-center space-x-4 text-xs text-text-3 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-text-3" />
              {lesson.estimated_minutes || 5} min read
            </span>
            <span>·</span>
            <span>Downloaded {new Date(entry.downloadedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Lesson Body Sections Loop */}
        <div className="space-y-8">
          {(lesson.sections || []).map((section, idx) => {
            switch (section.type) {
              case 'explanation':
              case 'analogy':
              case 'use_case':
              case 'summary':
                return (
                  <div key={idx} className="space-y-3">
                    <h3 className="font-heading text-lg font-semibold text-text-1">
                      {section.heading}
                    </h3>
                    <p className="text-text-2 text-sm leading-relaxed whitespace-pre-line">
                      {section.body}
                    </p>
                  </div>
                )

              case 'code':
                return (
                  <div key={idx} className="space-y-3">
                    <h3 className="font-heading text-lg font-semibold text-text-1">
                      {section.heading}
                    </h3>
                    <CodeBlock
                      code={section.code_snippet!}
                      language={section.code_language!}
                      caption={section.code_caption}
                    />
                  </div>
                )

              case 'code_comparison':
                return (
                  <div key={idx} className="space-y-3">
                    <h3 className="font-heading text-lg font-semibold text-text-1">
                      {section.heading}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                      <div>
                        <div className="text-error font-semibold mb-2 text-xs uppercase tracking-wider flex items-center gap-1">
                          {section.comparison_label_left || '❌ Before'}
                        </div>
                        <CodeBlock code={section.code_left!} language={section.code_language || 'js'} />
                      </div>
                      <div>
                        <div className="text-success font-semibold mb-2 text-xs uppercase tracking-wider flex items-center gap-1">
                          {section.comparison_label_right || '✅ After'}
                        </div>
                        <CodeBlock code={section.code_right!} language={section.code_language || 'js'} />
                      </div>
                    </div>
                    {section.comparison_caption && (
                      <p className="text-text-2 text-xs italic mt-1">
                        {section.comparison_caption}
                      </p>
                    )}
                  </div>
                )

              case 'diagram':
                return (
                  <div key={idx} className="space-y-3">
                    <h3 className="font-heading text-lg font-semibold text-text-1">
                      {section.heading}
                    </h3>
                    <pre className="bg-surface-alt border border-border rounded-[10px] p-6 font-mono text-xs text-text-1 overflow-x-auto leading-relaxed">
                      {section.diagram_content}
                    </pre>
                  </div>
                )

              case 'table':
                return (
                  <LessonTable
                    key={idx}
                    heading={section.heading}
                    headers={section.table_headers!}
                    rows={section.table_rows!}
                  />
                )

              case 'callout':
                return (
                  <Callout
                    key={idx}
                    type={section.callout_type!}
                    body={section.callout_body!}
                  />
                )

              case 'resource':
                return (
                  <div key={idx} className="p-4 rounded-[8px] bg-surface-alt/40 border border-border flex items-center gap-3 my-4">
                    <span className="text-xl">📖</span>
                    <div>
                      <span className="text-text-1 font-semibold text-sm">
                        {section.resource_title}
                      </span>
                      {section.resource_description && (
                        <p className="text-text-2 text-xs mt-1">
                          {section.resource_description}
                        </p>
                      )}
                      {section.resource_url && (
                        <span className="text-[10px] text-text-3 font-mono block mt-1">
                          Link (Requires connection): {section.resource_url}
                        </span>
                      )}
                    </div>
                  </div>
                )

              case 'exercise_code':
                return (
                  <div key={idx} className="p-5 border border-border/80 bg-surface-alt/20 rounded-xl space-y-3">
                    <div className="flex items-center space-x-2 text-primary">
                      <BookOpenCheck className="h-4 w-4" />
                      <span className="text-xs font-bold font-heading">Coding Practice: {section.heading}</span>
                    </div>
                    <p className="text-text-2 text-sm leading-relaxed whitespace-pre-line">{section.exercise_instructions || 'Write code for the instructions below.'}</p>
                    <div className="text-[10px] uppercase font-mono tracking-wider bg-surface-alt/80 border border-border px-2.5 py-0.5 rounded text-text-3 w-fit">
                      Language: {section.exercise_language || 'javascript'}
                    </div>
                    {section.exercise_starter_code && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-text-3">Starter Code:</span>
                        <pre className="bg-surface border border-border rounded-lg p-3 font-mono text-xs text-text-2 overflow-x-auto">
                          {section.exercise_starter_code}
                        </pre>
                      </div>
                    )}
                  </div>
                )

              case 'exercise_writing':
                return (
                  <div key={idx} className="p-5 border border-border/80 bg-surface-alt/20 rounded-xl space-y-3">
                    <div className="flex items-center space-x-2 text-primary">
                      <BookOpenCheck className="h-4 w-4" />
                      <span className="text-xs font-bold font-heading">Writing Practice: {section.heading}</span>
                    </div>
                    <p className="text-text-2 text-sm leading-relaxed whitespace-pre-line">{section.exercise_instructions || 'Complete the writing response.'}</p>
                    {section.exercise_criteria && section.exercise_criteria.length > 0 && (
                      <div className="space-y-1 text-xs">
                        <span className="font-semibold text-text-1">Evaluation Criteria:</span>
                        <ul className="list-disc pl-4 space-y-1 text-text-3">
                          {section.exercise_criteria.map((crit, cIdx) => (
                            <li key={cIdx}>{crit}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )

              case 'exercise_task':
                return (
                  <div key={idx} className="p-5 border border-border/80 bg-surface-alt/20 rounded-xl space-y-3">
                    <div className="flex items-center space-x-2 text-primary">
                      <BookOpenCheck className="h-4 w-4" />
                      <span className="text-xs font-bold font-heading">Task Checklist: {section.heading}</span>
                    </div>
                    <p className="text-text-2 text-sm leading-relaxed whitespace-pre-line">{section.exercise_instructions || 'Complete the tasks.'}</p>
                    {section.exercise_steps && section.exercise_steps.length > 0 && (
                      <div className="space-y-2 text-xs">
                        <ul className="space-y-1.5">
                          {section.exercise_steps.map((step, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-2 text-text-2">
                              <input type="checkbox" disabled className="mt-0.5 rounded border-border" />
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )

              case 'exercise_project':
                return (
                  <div key={idx} className="p-5 border border-border/80 bg-surface-alt/20 rounded-xl space-y-3">
                    <div className="flex items-center space-x-2 text-primary">
                      <BookOpenCheck className="h-4 w-4" />
                      <span className="text-xs font-bold font-heading">Interactive Project: {section.exercise_project_title || section.heading}</span>
                    </div>
                    <p className="text-text-2 text-sm leading-relaxed whitespace-pre-line">{section.exercise_project_description || section.heading}</p>
                    <div className="text-[10px] uppercase font-mono tracking-wider bg-surface-alt/80 border border-border px-2.5 py-0.5 rounded text-text-3 w-fit">
                      Template: {section.exercise_project_template || 'vanilla'}
                    </div>
                    {section.exercise_project_steps && section.exercise_project_steps.length > 0 && (
                      <div className="space-y-1.5 text-xs mt-2">
                        <span className="font-semibold text-text-1">Guided Project Steps:</span>
                        <ol className="list-decimal pl-4 space-y-1 text-text-3">
                          {section.exercise_project_steps.map((step, sIdx) => (
                            <li key={sIdx}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )

              default:
                return null
            }
          })}
        </div>

        {/* Finished Offline Reading Banner */}
        <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
          <div className="text-xs text-text-3">
            Finished reading offline? Feel free to jump back.
          </div>
          <button
            onClick={() => setSelectedLessonId(null)}
            className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-lg transition duration-150 cursor-pointer shadow-[0_0_12px_rgba(91,142,255,0.2)]"
          >
            Finish Lesson Read
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-page-enter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-primary">
            <Download className="h-5 w-5" strokeWidth={1.5} />
            <h1 className="font-heading text-2xl font-bold text-text-1">In-App Offline Shelf</h1>
          </div>
          <p className="text-text-2 text-sm mt-1">
            Read your downloaded lessons offline inside the app with zero connection.
          </p>
        </div>

        {downloadList.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 border border-error/20 hover:border-error/40 hover:bg-error/5 text-error rounded-lg text-xs font-semibold transition cursor-pointer self-start sm:self-center"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Shelf</span>
          </button>
        )}
      </div>

      {/* Grid list of downloaded lessons */}
      {downloadList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {downloadList.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedLessonId(item.id)}
              className="p-5 bg-surface border border-border/80 hover:border-primary/45 rounded-xl transition duration-150 flex flex-col justify-between cursor-pointer group shadow-sm hover:shadow-[0_0_20px_rgba(91,142,255,0.05)] relative overflow-hidden"
            >
              {/* Highlight left border glow */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/20 group-hover:bg-primary transition-all" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2 py-0.5 border border-primary/20 bg-primary/5 text-primary text-[9px] font-mono font-bold uppercase tracking-wider rounded">
                    {item.subject || 'Development'}
                  </span>
                  <span className="text-[9px] text-text-3 font-mono">
                    {depthLabels[item.depthLevel] || 'Beginner'}
                  </span>
                </div>

                <h3 className="font-heading text-base font-bold text-text-1 group-hover:text-primary transition-colors line-clamp-1">
                  {item.title}
                </h3>

                <p className="text-xs text-text-2 leading-relaxed line-clamp-2">
                  {item.lesson?.sections?.[0]?.body || 'Access saved lesson sections and coding practice summaries.'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between text-[11px] text-text-3">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="h-3.5 w-3.5" />
                  {item.lesson?.estimated_minutes || 5}m read
                </span>
                <span className="text-primary hover:underline font-bold inline-flex items-center gap-0.5">
                  Read Offline <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              {/* Trash Delete Icon */}
              <button
                onClick={(e) => handleDelete(item.id, e)}
                className="absolute top-4 right-4 p-1.5 border border-border hover:border-error/20 hover:text-error hover:bg-error/5 rounded-md text-text-3 transition-colors cursor-pointer"
                title="Remove download"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center text-center p-12 bg-surface-alt/20 border border-border/80 rounded-2xl max-w-xl mx-auto space-y-6">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl text-primary">
            <Download className="h-10 w-10 animate-bounce" strokeWidth={1.5} />
          </div>
          
          <div className="space-y-1.5">
            <h3 className="font-heading text-lg font-bold text-text-1">Your downloads shelf is empty</h3>
            <p className="text-xs text-text-2 leading-relaxed max-w-sm">
              Any lesson you download from your learning roadmap path will stay cached right here, so you can study without network distractions.
            </p>
          </div>

          <Link href="/dashboard/path">
            <button className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-lg transition duration-150 cursor-pointer shadow-[0_0_12px_rgba(91,142,255,0.2)]">
              Browse Roadmap Path
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}
