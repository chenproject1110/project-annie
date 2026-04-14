import React from 'react';

const purplePrimary = '#8B5CF6';
const purpleDark = '#6D28D9';
const textColor = '#F3F4F6';

export function Logo({ className = '', showText = true }: { className?: string; showText?: boolean }) {

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* The Icon Graphic */}
      <svg
        width="40"
        height="40"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Project Annie Logo"
      >
        <defs>
          {/* Modern Purple Gradient */}
          <linearGradient id="annie-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={purpleDark} />
            <stop offset="100%" stopColor={purplePrimary} />
          </linearGradient>
        </defs>

        {/* The abstract 'A' shape forming a lens aperture */}
        <path
          d="M50 10L20 90H35L50 50L65 90H80L50 10Z"
          fill="url(#annie-gradient)"
          stroke={purplePrimary}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* The central 'focus' circle/eye */}
        <circle cx="50" cy="65" r="8" fill={textColor} />
      </svg>

      {/* The Text Wordmark (Optional based on prop) */}
      {showText && (
        <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-300">
          PROJECT <span style={{ color: purplePrimary }}>ANNIE</span>
        </span>
      )}
    </div>
  );
}