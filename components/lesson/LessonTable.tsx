'use client'

import React from 'react'

export function LessonTable({ headers, rows, heading }: {
  headers: string[]
  rows: string[][]
  heading: string
}) {
  return (
    <div className="my-6 space-y-3">
      {heading && (
        <h4 className="text-sm font-semibold text-text-1 pr-12 font-sans tracking-tight">
          {heading}
        </h4>
      )}
      <div className="overflow-hidden rounded-xl border border-border shadow-[0_2px_12px_rgba(0,0,0,0.05)] bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs md:text-sm">
            <thead>
              <tr className="bg-surface-alt border-b border-border select-none">
                {headers.map((h, i) => (
                  <th 
                    key={i} 
                    className="px-4 py-3 text-[10px] md:text-[11px] font-bold text-primary font-mono uppercase tracking-wider border-r border-border last:border-r-0"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr 
                  key={i} 
                  className="border-b border-border/80 last:border-b-0 hover:bg-surface-alt/40 transition-colors"
                >
                  {row.map((cell, j) => (
                    <td 
                      key={j} 
                      className="px-4 py-3 text-text-2 text-xs md:text-[13px] leading-relaxed border-r border-border last:border-r-0 font-medium"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
export default LessonTable
