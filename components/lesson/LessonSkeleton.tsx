import React from 'react'

function SkeletonLine({ width = 'w-full', height = 'h-4' }: { width?: string; height?: string }) {
  return <div className={`${height} ${width} rounded-[4px] animate-shimmer`} style={{ background: 'var(--color-surface-alt)' }} />
}

function SectionSkeleton({ headingWidth = 'w-48' }: { headingWidth?: string }) {
  return (
    <div className="space-y-3">
      {/* Heading row with bookmark + confused button placeholders */}
      <div className="flex items-center justify-between gap-4">
        <SkeletonLine width={headingWidth} height="h-5" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-full animate-shimmer" style={{ background: 'var(--color-surface-alt)' }} />
          <SkeletonLine width="w-20" height="h-6" />
        </div>
      </div>
      {/* Body lines */}
      <div className="space-y-2">
        <SkeletonLine width="w-full" height="h-3.5" />
        <SkeletonLine width="w-full" height="h-3.5" />
        <SkeletonLine width="w-5/6" height="h-3.5" />
        <SkeletonLine width="w-4/5" height="h-3.5" />
      </div>
    </div>
  )
}

export default function LessonSkeleton() {
  return (
    <div className="max-w-[720px] mx-auto space-y-10 py-4 animate-page-enter">

      {/* ── Header block ── */}
      <div className="space-y-4 pb-6 border-b border-border">
        {/* Badge row */}
        <div className="flex items-center justify-between">
          <SkeletonLine width="w-32" height="h-3" />
          <div className="flex items-center gap-2">
            <SkeletonLine width="w-14" height="h-5" />
            <SkeletonLine width="w-20" height="h-5" />
            <SkeletonLine width="w-16" height="h-3" />
          </div>
        </div>
        {/* Title */}
        <SkeletonLine width="w-4/5" height="h-9" />
        {/* Reading time */}
        <SkeletonLine width="w-40" height="h-3" />
      </div>

      {/* ── Section 1: explanation ── */}
      <SectionSkeleton headingWidth="w-52" />

      {/* ── Section 2: analogy ── */}
      <SectionSkeleton headingWidth="w-44" />

      {/* ── Code block ── */}
      <div className="rounded-[10px] border border-border overflow-hidden">
        {/* Code header bar */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-border"
          style={{ background: 'var(--color-surface)' }}
        >
          <SkeletonLine width="w-28" height="h-3" />
          <SkeletonLine width="w-10" height="h-3" />
        </div>
        {/* Code lines */}
        <div className="p-5 space-y-2.5" style={{ background: 'var(--color-surface-alt)' }}>
          <SkeletonLine width="w-3/5" height="h-3" />
          <SkeletonLine width="w-4/5" height="h-3" />
          <SkeletonLine width="w-1/2" height="h-3" />
          <SkeletonLine width="w-2/3" height="h-3" />
          <SkeletonLine width="w-2/5" height="h-3" />
        </div>
      </div>

      {/* ── Callout card ── */}
      <div
        className="p-4 rounded-[10px] border border-border flex gap-3"
        style={{ background: 'var(--color-surface)' }}
      >
        {/* Left accent stripe */}
        <div className="w-1 rounded-full animate-shimmer flex-shrink-0" style={{ background: 'var(--color-surface-alt)', minHeight: '56px' }} />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="w-36" height="h-4" />
          <SkeletonLine width="w-full" height="h-3" />
          <SkeletonLine width="w-4/5" height="h-3" />
        </div>
      </div>

      {/* ── Section 3: use_case ── */}
      <SectionSkeleton headingWidth="w-56" />

      {/* ── Key takeaways ── */}
      <div className="pt-4 border-t border-border space-y-3">
        <SkeletonLine width="w-32" height="h-5" />
        <div className="space-y-2.5">
          {[0.82, 0.75, 0.88].map((ratio, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-shimmer" style={{ background: 'var(--color-surface-alt)' }} />
              <SkeletonLine width={`w-[${Math.round(ratio * 100)}%]`} height="h-3" />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
