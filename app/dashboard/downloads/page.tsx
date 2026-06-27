'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { BookOpen, Download, Trash2, ArrowLeft, Clock, Sparkles, ChevronRight, BookOpenCheck, Bookmark } from 'lucide-react'
import { GeneratedLesson } from '@/types/ai'
import { CodeBlock } from '@/components/lesson/CodeBlock'
import { Callout } from '@/components/lesson/Callout'
import { LessonTable } from '@/components/lesson/LessonTable'

interface SavedLessonEntry {
  id: string
  title: string
  subject: string
  depthLevel: number
  lesson?: GeneratedLesson
  state: 'downloaded' | 'saved'
  downloadedAt: string
}

const depthLabels = ["", "Like I'm 10", "Beginner", "Intermediate", "Advanced", "Expert"]

// Automatic Vital Concept Highlight Parser
function highlightKeywords(text: string, keyIndex: { value: number }) {
  if (!text) return [];

  // Match words case-insensitively
  const regex = /\b(javascript|closures?|react|node\.js|typescript|v8|compilers?|databases?|functions?|variables?|classes?|https?|css|html|memory|stack|heap|garbage collector|gc|threads?|json|sql|nosql|authentications?|auth|oauth|jwt|securities?|encryptions?|decryptions?|latency|bandwidth|throttling|caching|cache|cdns?|load balancers?|microservices?|monoliths?|docker|kubernetes|git|github|cac|ltv)\b/gi;

  const parts = text.split(regex);
  if (parts.length === 1) return [text];

  return parts.map((part, idx) => {
    // Odd indexes represent the captured matches (keywords)
    if (idx % 2 === 1) {
      return (
        <span 
          key={`kw-${keyIndex.value++}`} 
          className="font-bold text-text-1 px-1 py-0.5 bg-primary/10 border-b-2 border-primary/45 rounded-sm hover:bg-primary/20 hover:text-primary transition-all duration-150 cursor-help"
          title={`Cognara Vital Concept: "${part}"`}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

// Beautiful inline text formatting parser to highlight bold text, code, and italics
function formatInlineText(text: string) {
  if (!text) return '';

  const parts: React.ReactNode[] = [];
  let currentText = text;
  let index = 0;
  
  while (currentText.length > 0) {
    const boldIdx = currentText.indexOf('**');
    const codeIdx = currentText.indexOf('`');
    const italicIdx = currentText.indexOf('*');
    
    // Sort active tokens chronologically to parse sequentially
    const targets = [
      { type: 'bold', index: boldIdx, len: 2 },
      { type: 'code', index: codeIdx, len: 1 },
      { type: 'italic', index: italicIdx, len: 1 }
    ].filter(t => t.index !== -1).sort((a, b) => a.index - b.index);
    
    if (targets.length === 0) {
      parts.push(...highlightKeywords(currentText, { value: index }));
      break;
    }
    
    const firstTarget = targets[0];
    
    // Append standard leading text
    if (firstTarget.index > 0) {
      parts.push(...highlightKeywords(currentText.substring(0, firstTarget.index), { value: index }));
    }
    
    const contentStart = firstTarget.index + firstTarget.len;
    const closingToken = firstTarget.type === 'bold' ? '**' : firstTarget.type === 'code' ? '`' : '*';
    const closingIdx = currentText.indexOf(closingToken, contentStart);
    
    if (closingIdx === -1) {
      // Treat unclosed tokens as plain text
      parts.push(...highlightKeywords(currentText.substring(firstTarget.index, contentStart), { value: index }));
      currentText = currentText.substring(contentStart);
    } else {
      const tokenContent = currentText.substring(contentStart, closingIdx);
      if (firstTarget.type === 'bold') {
        parts.push(
          <strong key={index++} className="font-extrabold text-primary dark:text-primary-hover drop-shadow-[0_0_8px_rgba(91,142,255,0.1)]">
            {tokenContent}
          </strong>
        );
      } else if (firstTarget.type === 'code') {
        parts.push(
          <code key={index++} className="px-1.5 py-0.5 bg-surface-alt border border-border/80 rounded text-[11px] font-mono text-accent break-all select-all font-semibold">
            {tokenContent}
          </code>
        );
      } else {
        parts.push(
          <em key={index++} className="italic text-accent">
            {tokenContent}
          </em>
        );
      }
      currentText = currentText.substring(closingIdx + firstTarget.len);
    }
  }
  return parts;
}

// Block and line splitting parser for rich layouts (lists and paragraphs)
function formatLessonText(text: string) {
  if (!text) return null;

  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    let trimmed = line.trim();
    
    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
    if (isBullet) {
      trimmed = trimmed.substring(2);
    }
    
    const parts = formatInlineText(trimmed);

    if (isBullet) {
      return (
        <li key={lineIdx} className="flex items-start text-text-2 text-sm leading-relaxed pl-1 my-1.5">
          <span className="text-primary mr-2 select-none shrink-0">•</span>
          <span className="flex-1">{parts}</span>
        </li>
      );
    }

    if (trimmed.length === 0) {
      return <div key={lineIdx} className="h-3" />;
    }

    return (
      <p key={lineIdx} className="text-text-2 text-sm leading-relaxed mb-3">
        {parts}
      </p>
    );
  });
}

export default function DownloadsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [downloads, setDownloads] = useState<Record<string, SavedLessonEntry>>({})
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSavedLessons = () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cognara_downloaded_lessons')
        if (stored) {
          setDownloads(JSON.parse(stored))
        } else {
          setDownloads({})
        }
      } catch (err) {
        console.error('Failed to load saved lessons:', err)
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadSavedLessons()

    window.addEventListener('storage', loadSavedLessons)
    return () => window.removeEventListener('storage', loadSavedLessons)
  }, [])

  const handleDelete = (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const updated = { ...downloads }
      delete updated[lessonId]
      setDownloads(updated)
      localStorage.setItem('cognara_downloaded_lessons', JSON.stringify(updated))
      toast('Lesson removed from Saved Lessons.')
      window.dispatchEvent(new Event('storage'))
    } catch (err) {
      console.error('Failed to delete lesson:', err)
    }
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your saved lessons shelf?')) {
      try {
        localStorage.removeItem('cognara_downloaded_lessons')
        setDownloads({})
        setSelectedLessonId(null)
        toast('Saved lessons shelf cleared.')
        window.dispatchEvent(new Event('storage'))
      } catch (err) {
        console.error('Failed to clear saved lessons:', err)
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
        <p className="text-text-3 text-sm font-mono">Loading saved lessons shelf...</p>
      </div>
    )
  }

  // Active Offline Lesson Reader View
  if (selectedLessonId && downloads[selectedLessonId]) {
    const entry = downloads[selectedLessonId]
    const { title, subject, depthLevel, lesson } = entry

    if (!lesson) {
      return (
        <div className="py-20 text-center space-y-4">
          <p className="text-text-2 text-sm">This lesson is saved as reference and requires an active connection.</p>
          <button 
            onClick={() => setSelectedLessonId(null)} 
            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            Back to Shelf
          </button>
        </div>
      )
    }

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
                return (
                  <div key={idx} className="space-y-3">
                    <h3 className="font-heading text-lg font-semibold text-text-1">
                      {section.heading}
                    </h3>
                    <div className="space-y-3">
                      {formatLessonText(section.body || '')}
                    </div>
                  </div>
                )

              case 'summary':
                return (
                  <div key={idx} className="space-y-3 border-l-2 border-primary/40 pl-4 bg-primary/2.5 py-2.5 rounded-r-md">
                    <h3 className="font-heading text-lg font-bold text-text-1">
                      {section.heading}
                    </h3>
                    <div className="space-y-2">
                      {formatLessonText(section.body || '')}
                    </div>
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
            <Bookmark className="h-5 w-5" strokeWidth={1.5} />
            <h1 className="font-heading text-2xl font-bold text-text-1">Saved Lessons Shelf</h1>
          </div>
          <p className="text-text-2 text-sm mt-1">
            Manage your bookmarked lessons and downloaded offline guides.
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

      {/* Grid list of saved/downloaded lessons */}
      {downloadList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {downloadList.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                const isSavedOnly = item.state === 'saved'
                const isOfflineMode = typeof window !== 'undefined' && !window.navigator.onLine

                if (isSavedOnly) {
                  if (isOfflineMode) {
                    toast('This lesson is saved as reference and requires an internet connection to read.', 'error')
                  } else {
                    router.push(`/dashboard/lesson/${item.id}`)
                  }
                } else {
                  if (isOfflineMode) {
                    setSelectedLessonId(item.id)
                  } else {
                    router.push(`/dashboard/lesson/${item.id}`)
                  }
                }
              }}
              className="p-5 bg-surface border border-border/80 hover:border-primary/45 rounded-xl transition duration-150 flex flex-col justify-between cursor-pointer group shadow-sm hover:shadow-[0_0_20px_rgba(91,142,255,0.05)] relative overflow-hidden"
            >
              {/* Highlight left border glow */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/20 group-hover:bg-primary transition-all" />

              <div className="space-y-3 pr-10">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2 py-0.5 border border-primary/20 bg-primary/5 text-primary text-[9px] font-mono font-bold uppercase tracking-wider rounded">
                    {item.subject || 'Development'}
                  </span>
                  
                  <div className="flex items-center space-x-1.5">
                    {item.state === 'saved' ? (
                      <span className="inline-flex items-center gap-1 text-[9px] text-purple-500 font-bold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                        <Bookmark className="h-2.5 w-2.5" />
                        Reference
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] text-emerald-500 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        <Download className="h-2.5 w-2.5" />
                        Offline
                      </span>
                    )}
                    <span className="text-[9px] text-text-3 font-mono">
                      {depthLabels[item.depthLevel] || 'Beginner'}
                    </span>
                  </div>
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
                  {item.state === 'saved' ? 'Open Lesson' : 'Read Offline'} <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              {/* Trash Delete Icon */}
              <button
                onClick={(e) => handleDelete(item.id, e)}
                className="absolute top-4 right-4 p-1.5 border border-border hover:border-error/20 hover:text-error hover:bg-error/5 rounded-md text-text-3 transition-colors cursor-pointer"
                title="Remove item"
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
            <Bookmark className="h-10 w-10 animate-bounce" strokeWidth={1.5} />
          </div>
          
          <div className="space-y-1.5">
            <h3 className="font-heading text-lg font-bold text-text-1">Your saved lessons shelf is empty</h3>
            <p className="text-xs text-text-2 leading-relaxed max-w-sm">
              Bookmark lessons for reference or download them offline to study without distractions.
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
