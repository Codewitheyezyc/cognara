import React from 'react'

export default function LessonSkeleton() {
  return (
    <div className="max-w-[720px] mx-auto space-y-8 py-4">
      {/* Title skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-20 bg-surface rounded-[4px] animate-shimmer" />
        <div className="h-10 w-3/4 bg-surface rounded-[4px] animate-shimmer" />
        <div className="h-4 w-32 bg-surface rounded-[4px] animate-shimmer" />
      </div>

      {/* Content block skeletons */}
      <div className="space-y-4">
        <div className="h-4 w-full bg-surface rounded-[4px] animate-shimmer" />
        <div className="h-4 w-full bg-surface rounded-[4px] animate-shimmer" />
        <div className="h-4 w-5/6 bg-surface rounded-[4px] animate-shimmer" />
      </div>

      {/* Code block skeleton */}
      <div className="p-6 bg-surface border border-border rounded-[10px] space-y-3">
        <div className="h-4 w-1/4 bg-surface-alt rounded-[4px] animate-shimmer" />
        <div className="h-20 w-full bg-surface-alt rounded-[4px] animate-shimmer" />
      </div>

      {/* Card skeleton */}
      <div className="h-28 w-full bg-surface border border-border rounded-[10px] animate-shimmer" />
    </div>
  )
}
