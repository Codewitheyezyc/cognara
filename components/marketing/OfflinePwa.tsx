'use client'

import React, { useState } from 'react'
import { WifiOff, Layers, Flame, Smartphone, Monitor, Share2, PlusSquare, MoreVertical } from 'lucide-react'

export function OfflinePwa() {
  const [pwaDeviceTab, setPwaDeviceTab] = useState<'apple' | 'android' | 'desktop'>('apple')

  return (
    <section id="offline-pwa" className="py-20 md:py-28 animate-page-enter scroll-mt-24">
      <div className="bg-surface border border-border rounded-[12px] p-6 md:p-8 space-y-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-36 h-36 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
        
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <span className="inline-flex items-center px-3 py-1 border border-primary/20 bg-primary/5 text-primary text-xs font-mono font-bold uppercase tracking-widest rounded-full">
            Progressive Web App (PWA)
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-text-1">
            Install Cognara. Study Anywhere, Offline.
          </h2>
          <p className="text-text-2 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Save Cognara directly to your device home screen as a native application. Read your downloaded lessons, track your streaks, and navigate your path—all with zero internet connection.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Side: PWA features description */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-center">
            <h3 className="font-heading text-lg font-bold text-text-1">Why install the PWA?</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <WifiOff className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-1">Full Offline Reading</h4>
                  <p className="text-[11px] text-text-2 leading-relaxed mt-0.5">
                    Open the app without internet to browse your downloaded lessons shelf. Learn on flights, commutes, or remote locations without distractions.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-1">Native Fullscreen Layout</h4>
                  <p className="text-[11px] text-text-2 leading-relaxed mt-0.5">
                    Banish browser address bars, tabs, and navigation controls. Enjoy 100% focused viewport space dedicated purely to studying.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="w-8 h-8 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center text-success shrink-0">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-1">Instant App Shell Loading</h4>
                  <p className="text-[11px] text-text-2 leading-relaxed mt-0.5">
                    Our service worker pre-caches static layout elements, icons, assets, and custom fonts, making subsequent loads instant even on slow connections.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Interactive Device Installation Steps */}
          <div className="lg:col-span-7 flex flex-col border border-border/80 bg-surface-alt/40 rounded-xl p-5 md:p-6 space-y-6">
            <div className="flex flex-col space-y-2.5">
              <span className="text-[10px] font-mono text-text-3 uppercase tracking-wider">Device Guides</span>
              {/* Tabs bar */}
              <div className="flex border border-border/85 bg-surface rounded-lg p-0.5 overflow-hidden">
                {[
                  { id: 'apple', label: 'Apple iOS', icon: Smartphone },
                  { id: 'android', label: 'Android', icon: Smartphone },
                  { id: 'desktop', label: 'Desktop App', icon: Monitor }
                ].map((tab) => {
                  const TabIcon = tab.icon
                  const isActive = pwaDeviceTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setPwaDeviceTab(tab.id as any)}
                      type="button"
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        isActive
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-text-2 hover:text-text-1 hover:bg-surface-alt/50'
                      }`}
                    >
                      <TabIcon className="h-3.5 w-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tab content area */}
            <div className="flex-1 bg-surface border border-border/70 rounded-lg p-4 md:p-5 flex flex-col justify-between min-h-[220px]">
              {pwaDeviceTab === 'apple' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
                    <Smartphone className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-text-1">Install on iPhone & iPad (Safari)</span>
                  </div>
                  <ol className="space-y-3 text-[11px] text-text-2 pl-1 break-words">
                    <li className="flex items-start">
                      <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[9px] mr-2 shrink-0 mt-0.5">1</span>
                      <span>Open the **Safari** browser and navigate to <code className="px-1 py-0.5 bg-surface-alt border border-border rounded text-[10px] font-mono break-all">cognaralearn.com/dashboard</code> (or the app URL).</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[9px] mr-2 shrink-0 mt-0.5">2</span>
                      <span>Tap the **Share** button <Share2 className="h-3.5 w-3.5 inline mx-0.5 text-text-2" /> (the square icon with an arrow pointing up at the bottom of the screen).</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[9px] mr-2 shrink-0 mt-0.5">3</span>
                      <span>Scroll down the options menu and select **Add to Home Screen** <PlusSquare className="h-3.5 w-3.5 inline mx-0.5 text-text-2" />.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[9px] mr-2 shrink-0 mt-0.5">4</span>
                      <span>Tap **Add** in the top right corner. The Cognara diamond app icon will be installed on your Home Screen.</span>
                    </li>
                  </ol>
                </div>
              )}

              {pwaDeviceTab === 'android' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
                    <Smartphone className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-text-1">Install on Android Device (Chrome)</span>
                  </div>
                  <ol className="space-y-3 text-[11px] text-text-2 pl-1">
                    <li className="flex items-start">
                      <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[9px] mr-2 shrink-0 mt-0.5">1</span>
                      <span>Open Google **Chrome** and navigate to your dashboard/app URL.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[9px] mr-2 shrink-0 mt-0.5">2</span>
                      <span>Tap the **Menu** icon <MoreVertical className="h-3.5 w-3.5 inline mx-0.5 text-text-2" /> (three vertical dots in the top-right corner of Chrome).</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[9px] mr-2 shrink-0 mt-0.5">3</span>
                      <span>Tap **Install app** or **Add to Home screen** from the menu options.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[9px] mr-2 shrink-0 mt-0.5">4</span>
                      <span>Confirm by tapping **Install** in the popup. The app will install in the background and appear in your launcher drawer.</span>
                    </li>
                  </ol>
                </div>
              )}

              {pwaDeviceTab === 'desktop' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
                    <Monitor className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-text-1">Install on PC, Mac, or Chromebook (Chrome/Edge)</span>
                  </div>
                  <ol className="space-y-3 text-[11px] text-text-2 pl-1">
                    <li className="flex items-start">
                      <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[9px] mr-2 shrink-0 mt-0.5">1</span>
                      <span>Open Google **Chrome**, **Microsoft Edge**, or **Brave** and log in to Cognara.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[9px] mr-2 shrink-0 mt-0.5">2</span>
                      <span>Look at the right side of the address bar at the top (next to the bookmark star). You will see the **PWA Install icon** (a monitor with a down arrow, or a plus icon).</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[9px] mr-2 shrink-0 mt-0.5">3</span>
                      <span>Click the install icon, and click **Install** when the system prompt appears.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[9px] mr-2 shrink-0 mt-0.5">4</span>
                      <span>The app will immediately open in a dedicated standalone window. A launch shortcut will be placed on your desktop for quick double-click access.</span>
                    </li>
                  </ol>
                </div>
              )}
              
              {/* Decorative badge */}
              <div className="mt-4 pt-3.5 border-t border-border/40 flex items-center justify-between text-[9px] font-mono text-text-3">
                <span>SECURE AND LIGHTWEIGHT</span>
                <span className="text-success font-bold">● ONLINE / OFFLINE DETECTED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
