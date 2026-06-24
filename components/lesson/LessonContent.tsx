'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GeneratedLesson } from '@/types/ai'
import { BookOpen, ArrowRight, ChevronDown, Lock, Download } from 'lucide-react'
import { CodeBlock } from './CodeBlock'
import { Callout } from './Callout'
import { LessonTable } from './LessonTable'
import { ExerciseCode } from './ExerciseCode'
import { ExerciseWriting } from './ExerciseWriting'
import { ExerciseTask } from './ExerciseTask'
import { ExerciseProject } from './ExerciseProject'
import { createClient } from '@/lib/supabase/client'
import { BookmarkButton } from './BookmarkButton'
import { ConfusedButton } from './ConfusedButton'
import { LessonPreviewModal } from '../dashboard/LessonPreviewModal'
import { useToast } from '@/components/ui/toast'


interface LessonContentProps {
  lesson: GeneratedLesson
  depthLevel: number
  isChangingDepth: boolean
  onDepthChange: (newDepth: number) => Promise<void>
  lessonTitle: string
  subject: string
  lessonId: string
  userId: string
  isPro: boolean
  phaseNumber: number
}

const depthLevels = [
  { value: 1, title: "Like I'm 10" },
  { value: 2, title: "Beginner" },
  { value: 3, title: "Intermediate" },
  { value: 4, title: "Advanced" },
  { value: 5, title: "Expert" },
]

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

export default function LessonContent({ 
  lesson, 
  depthLevel, 
  isChangingDepth, 
  onDepthChange,
  lessonTitle,
  subject,
  lessonId,
  userId,
  isPro,
  phaseNumber
}: LessonContentProps) {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const router = useRouter()

  const supabase = createClient()
  const [bookmarks, setBookmarks] = React.useState<any[]>([])

  const { toast } = useToast()
  const [isDownloaded, setIsDownloaded] = React.useState(false)

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cognara_downloaded_lessons')
        const downloads = stored ? JSON.parse(stored) : {}
        if (downloads[lessonId]) {
          setIsDownloaded(true)
        }
      } catch (err) {
        console.error('Failed to check downloads cache:', err)
      }
    }
  }, [lessonId])

  const handleDownload = () => {
    if (!isPro && phaseNumber > 1) {
      setIsModalOpen(true)
      return
    }

    try {
      const stored = localStorage.getItem('cognara_downloaded_lessons')
      const downloads = stored ? JSON.parse(stored) : {}

      if (downloads[lessonId]) {
        toast('Lesson is already downloaded and cached offline!')
        return
      }

      downloads[lessonId] = {
        id: lessonId,
        title: lesson.title,
        subject: subject,
        depthLevel: depthLevel,
        lesson: lesson,
        downloadedAt: new Date().toISOString(),
      }

      localStorage.setItem('cognara_downloaded_lessons', JSON.stringify(downloads))
      setIsDownloaded(true)
      toast('Lesson downloaded successfully for in-app offline reading! 🎓')
    } catch (err) {
      console.error(err)
      toast('Failed to cache lesson offline', 'error')
    }
  }

  React.useEffect(() => {
    async function fetchBookmarks() {
      if (!userId || !lessonId) return
      const { data } = await supabase
        .from('lesson_bookmarks')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('user_id', userId)
      if (data) {
        setBookmarks(data)
      }
    }
    fetchBookmarks()
  }, [lessonId, userId, supabase])

  return (
    <div className="max-w-[720px] mx-auto space-y-8 pb-12 animate-page-enter">
      {/* Lesson Heading Block */}
      <div className="space-y-3 pb-6 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="hidden sm:flex items-center space-x-2 text-accent">
            <BookOpen className="h-4 w-4" strokeWidth={1.5} />
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Cognitive Lesson</span>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 sm:gap-3 flex-nowrap">
            <span className="inline-flex items-center px-2 py-0.5 border border-primary/20 bg-primary/10 text-primary text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm shrink-0">
              {depthLabels[depthLevel] || 'Beginner'}
            </span>
            
            {/* Download Lesson Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wide focus:outline-none flex items-center space-x-1 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>
                {!isPro && phaseNumber > 1 
                  ? 'Download 🔒' 
                  : isDownloaded 
                  ? 'Downloaded ✓' 
                  : 'Download'}
              </span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isChangingDepth}
                className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wide focus:outline-none flex items-center space-x-0.5 cursor-pointer disabled:opacity-50"
              >
                <span>Change depth</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-44 rounded-md shadow-lg bg-surface border border-border z-50 py-1 animate-page-enter">
                    {depthLevels.map((lvl) => {
                      const isLvlLocked = !isPro && lvl.value !== 2 // Only Beginner (Level 2) is unlocked
                      return (
                        <button
                          key={lvl.value}
                          type="button"
                          disabled={depthLevel === lvl.value}
                          onClick={() => {
                            if (isLvlLocked) {
                              setIsModalOpen(true)
                              setIsDropdownOpen(false)
                              return
                            }
                            onDepthChange(lvl.value)
                            setIsDropdownOpen(false)
                          }}
                          className={`w-full text-left px-4 py-2 text-xs hover:bg-surface-alt cursor-pointer transition-colors duration-100 flex items-center justify-between ${
                            depthLevel === lvl.value ? 'text-primary font-semibold' : 'text-text-2'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {isLvlLocked && <Lock className="h-3 w-3 text-text-3" />}
                            {lvl.title}
                          </span>
                          <span className="text-[9px] font-mono text-text-3">Lvl {lvl.value}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-1 tracking-tight">
          {lesson.title}
        </h1>
        <p className="text-xs font-mono text-text-2">
          Estimated reading time: <span className="text-primary font-bold">{lesson.estimated_minutes} minutes</span>
        </p>
      </div>

      {/* Structured Sections Loop */}
      <div className="space-y-8">
        {(lesson.sections || []).map((section, idx) => {
          const sectionBookmark = bookmarks.find(b => b.section_index === idx)
          const sectionEl = (() => {
            switch (section.type) {
            case 'explanation':
            case 'analogy':
            case 'use_case':
              return (
                <div key={idx}>
                  <ConfusedButton
                    sectionHeading={section.heading}
                    sectionBody={section.body || ''}
                    subject={subject}
                    depthLevel={depthLevel}
                    isPro={isPro}
                    onUpgradePrompt={() => setIsModalOpen(true)}
                    bookmarkSlot={
                      <BookmarkButton
                        lessonId={lessonId}
                        lessonTitle={lessonTitle}
                        sectionIndex={idx}
                        sectionHeading={section.heading || ''}
                        sectionBody={section.body?.slice(0, 200) || ''}
                        userId={userId}
                        initialBookmark={sectionBookmark}
                        onBookmarkChange={(newBookmark) => {
                          if (newBookmark) {
                            setBookmarks(prev => [...prev.filter(b => b.section_index !== idx), newBookmark])
                          } else {
                            setBookmarks(prev => prev.filter(b => b.section_index !== idx))
                          }
                        }}
                        variant="inline"
                      />
                    }
                  >
                    <div className="space-y-3">
                      {formatLessonText(section.body || '')}
                    </div>
                  </ConfusedButton>
                </div>
              )

            case 'summary':
              return (
                <div key={idx} className="space-y-3 border-l-2 border-primary/40 pl-4 bg-primary/2.5 py-2.5 rounded-r-md">
                  <h3 className="font-heading text-lg font-bold text-text-1 pr-12">
                    {section.heading}
                  </h3>
                  <div className="space-y-2">
                    {formatLessonText(section.body || '')}
                  </div>
                </div>
              )


            case 'exercise_code':
              return (
                <div key={idx} style={{ marginBottom: '28px' }}>
                  <ExerciseCode
                    language={section.exercise_language || 'javascript'}
                    starterCode={section.exercise_starter_code || '// Write your code here\n'}
                    instructions={section.exercise_instructions || section.heading}
                    expectedOutput={section.exercise_expected_output}
                    isLocked={!isPro}
                    onUpgradePrompt={() => setIsModalOpen(true)}
                  />
                </div>
              )

            case 'exercise_writing':
              return (
                <div key={idx} style={{ marginBottom: '28px' }}>
                  <ExerciseWriting
                    instructions={section.exercise_instructions || section.heading}
                    criteria={section.exercise_criteria || []}
                    lessonTitle={lessonTitle}
                    subject={subject}
                    isLocked={!isPro}
                    onUpgradePrompt={() => setIsModalOpen(true)}
                  />
                </div>
              )

            case 'exercise_task':
              return (
                <div key={idx} style={{ marginBottom: '28px' }}>
                  <ExerciseTask
                    instructions={section.exercise_instructions || section.heading}
                    steps={section.exercise_steps || []}
                  />
                </div>
              )

            case 'exercise_project':
              return (
                <div key={idx} style={{ marginBottom: '28px' }}>
                  <ExerciseProject
                    projectTitle={section.exercise_project_title || 'Project Exercise'}
                    description={section.exercise_project_description || ''}
                    template={section.exercise_project_template || 'vanilla'}
                    starterFiles={section.exercise_project_files || {
                      'index.js': '// Start coding here\n'
                    }}
                    steps={section.exercise_project_steps || []}
                    lessonId={lessonId}
                    userId={userId}
                    isLocked={!isPro}
                    onUpgradePrompt={() => setIsModalOpen(true)}
                  />
                </div>
              )

            case 'code':
              return (
                <div key={idx} className="space-y-2">
                  <h3 className="font-heading text-lg font-semibold text-text-1 pr-12">
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
                <div key={idx} className="space-y-2">
                  <h3 className="font-heading text-lg font-semibold text-text-1 pr-12">
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
                <div key={idx} className="space-y-2">
                  <h3 className="font-heading text-lg font-semibold text-text-1 pr-12">
                    {section.heading}
                  </h3>
                  <pre style={{
                    background: 'var(--color-surface-alt)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    padding: '24px',
                    fontFamily: 'var(--font-mono), JetBrains Mono, monospace',
                    fontSize: '13px',
                    color: 'var(--color-text-1)',
                    overflowX: 'auto',
                    lineHeight: '1.8'
                  }}>
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
                <div key={idx} className="p-4 rounded-[8px] bg-surface border border-border flex items-center gap-3 my-4">
                  <span className="text-xl">📖</span>
                  <div>
                    <a
                      href={section.resource_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-semibold text-sm hover:underline"
                    >
                      {section.resource_title}
                    </a>
                    {section.resource_description && (
                      <p className="text-text-2 text-xs mt-1">
                        {section.resource_description}
                      </p>
                    )}
                  </div>
                </div>
              )

            default:
              return null
          }
        })()

        if (!sectionEl) return null

        // explanation/analogy/use_case sections embed the BookmarkButton inline inside
        // ConfusedButton's header row via bookmarkSlot — no need for the absolute overlay wrapper.
        const hasInlineBookmark = ['explanation', 'analogy', 'use_case'].includes(section.type)

        if (hasInlineBookmark) {
          return <div key={idx}>{sectionEl}</div>
        }

        return (
          <div key={idx} className="relative group/section">
            <BookmarkButton
              lessonId={lessonId}
              lessonTitle={lessonTitle}
              sectionIndex={idx}
              sectionHeading={section.heading || ''}
              sectionBody={section.body?.slice(0, 200) || section.code_snippet?.slice(0, 200) || ''}
              userId={userId}
              initialBookmark={sectionBookmark}
              onBookmarkChange={(newBookmark) => {
                if (newBookmark) {
                  setBookmarks(prev => [...prev.filter(b => b.section_index !== idx), newBookmark])
                } else {
                  setBookmarks(prev => prev.filter(b => b.section_index !== idx))
                }
              }}
            />
            {sectionEl}
          </div>
        )
      })}
      </div>

      {/* Key Takeaways Section */}
      <div className="pt-6 border-t border-border space-y-3">
        <h3 className="font-heading text-lg font-bold text-text-1">Key Takeaways</h3>
        <ul className="space-y-2">
          {(lesson.key_takeaways || []).map((takeaway, idx) => (
            <li key={idx} className="flex items-start text-xs text-text-2 leading-relaxed">
              <span className="text-primary mr-2 select-none">•</span>
              <span>{formatInlineText(takeaway)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Next Lesson Preview Banner */}
      {lesson.next_lesson_preview && (
        <div className="p-4 rounded-[10px] bg-surface-alt border border-border flex items-center justify-between space-x-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-text-3 font-semibold">Upcoming Next</span>
            <p className="text-xs text-text-2">{lesson.next_lesson_preview}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-3 flex-shrink-0" strokeWidth={2} />
        </div>
      )}
      <LessonPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lessonTitle={lessonTitle}
        lessonDescription={lesson.title ? `Review and test your skills inside: ${lessonTitle}` : undefined}
        phaseNumber={phaseNumber}
      />
    </div>
  )
}
