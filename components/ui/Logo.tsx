import React from 'react'

interface LogoProps {
  className?: string
}

export function Logo({ className = 'h-6 w-6' }: LogoProps) {
  return (
    <svg 
      className={`${className} shrink-0 logo-animated`} 
      viewBox="0 0 80 80" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes logo-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes logo-pulse {
          0%, 100% { opacity: 0.65; transform: scale(1); }
          50%       { opacity: 1;    transform: scale(1.15); }
        }
        .logo-animated .logo-diamond {
          animation: logo-float 4s ease-in-out infinite;
          transform-origin: 40px 40px;
        }
        .logo-animated .p1 { animation: logo-pulse 3s ease-in-out 0s infinite; transform-origin: 40px 6px; }
        .logo-animated .p2 { animation: logo-pulse 3s ease-in-out 0.5s infinite; transform-origin: 69px 21px; }
        .logo-animated .p3 { animation: logo-pulse 3s ease-in-out 1s infinite; transform-origin: 74px 40px; }
        .logo-animated .p4 { animation: logo-pulse 3s ease-in-out 1.5s infinite; transform-origin: 69px 59px; }
        .logo-animated .p5 { animation: logo-pulse 3s ease-in-out 2s infinite; transform-origin: 40px 74px; }
        .logo-animated .p6 { animation: logo-pulse 3s ease-in-out 2.5s infinite; transform-origin: 6px 40px; }
      `}} />

      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-logo-start, #7BA7FF)" />
          <stop offset="50%" stopColor="var(--color-primary, #5B8EFF)" />
          <stop offset="100%" stopColor="var(--color-accent, #A78BFA)" />
        </linearGradient>
        
        <filter id="logoGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="logoParticleGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ambient rings */}
      <circle cx="40" cy="40" r="36" fill="var(--color-primary-glow, rgba(91,142,255,0.07))" />
      <circle cx="40" cy="40" r="28" fill="rgba(91,142,255,0.05)" />

      {/* Particles */}
      <circle className="p1" cx="40" cy="6" r="3.5" fill="var(--color-accent, #A78BFA)" opacity="0.85" filter="url(#logoParticleGlow)" />
      <circle className="p2" cx="69" cy="21" r="2.5" fill="var(--color-primary, #5B8EFF)" opacity="0.7" filter="url(#logoParticleGlow)" />
      <circle className="p3" cx="74" cy="40" r="3" fill="var(--color-logo-start, #7BA7FF)" opacity="0.75" filter="url(#logoParticleGlow)" />
      <circle className="p4" cx="69" cy="59" r="2.2" fill="var(--color-accent, #A78BFA)" opacity="0.65" filter="url(#logoParticleGlow)" />
      <circle className="p5" cx="40" cy="74" r="3.5" fill="var(--color-primary, #5B8EFF)" opacity="0.8" filter="url(#logoParticleGlow)" />
      <circle className="p6" cx="6" cy="40" r="2.5" fill="var(--color-accent, #A78BFA)" opacity="0.65" filter="url(#logoParticleGlow)" />

      {/* Diamond Core */}
      <g className="logo-diamond">
        <polygon points="40,10 62,40 40,70 18,40" fill="url(#logoGradient)" filter="url(#logoGlow)" />
        <polygon points="40,18 56,40 40,58 30,40" fill="rgba(255,255,255,0.13)" />
        {/* Eyes */}
        <circle cx="35" cy="37" r="3.5" fill="rgba(10,12,20,0.85)" />
        <circle cx="45" cy="37" r="3.5" fill="rgba(10,12,20,0.85)" />
        <circle cx="36.2" cy="35.8" r="1.4" fill="rgba(255,255,255,0.95)" />
        <circle cx="46.2" cy="35.8" r="1.4" fill="rgba(255,255,255,0.95)" />
      </g>
    </svg>
  )
}
