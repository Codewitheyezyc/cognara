import React from 'react'

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-surface-alt rounded-[6px]" />
        <div className="h-4 w-72 bg-surface-alt rounded-[4px]" />
      </div>

      {/* Top row Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Milestone Card Skeleton */}
        <div className="lg:col-span-2 h-52 bg-surface border border-border rounded-[10px] p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-surface-alt rounded-[4px]" />
            <div className="h-8 w-2/3 bg-surface-alt rounded-[6px]" />
            <div className="h-4 w-5/6 bg-surface-alt rounded-[4px]" />
          </div>
          <div className="h-10 w-full bg-surface-alt rounded-[6px] mt-4" />
        </div>

        {/* Vitals Skeleton */}
        <div className="h-52 bg-surface border border-border rounded-[10px] p-6 flex flex-col justify-between">
          <div className="h-4 w-24 bg-surface-alt rounded-[4px]" />
          <div className="space-y-4 my-auto">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-md bg-surface-alt" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-12 bg-surface-alt rounded" />
                <div className="h-3 w-16 bg-surface-alt rounded" />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-md bg-surface-alt" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-12 bg-surface-alt rounded" />
                <div className="h-3 w-16 bg-surface-alt rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Track Skeletons */}
      <div className="space-y-4">
        <div className="h-6 w-36 bg-surface-alt rounded-[4px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-surface border border-border rounded-[10px] p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-3 w-12 bg-surface-alt rounded" />
                <div className="h-4 w-32 bg-surface-alt rounded" />
                <div className="h-3 w-full bg-surface-alt rounded" />
              </div>
              <div className="h-3 w-1/3 bg-surface-alt rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
