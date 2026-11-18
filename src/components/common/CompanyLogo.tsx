import React from 'react';

interface CompanyLogoProps {
  company: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ company, size = 'md' }) => {
  const lower = company.toLowerCase();
  const boxSize =
    size === 'sm' ? 'w-9 h-9 rounded-lg' : size === 'lg' ? 'w-12 h-12 rounded-xl' : 'w-11 h-11 rounded-xl';

  if (lower.includes('meta')) {
    return (
      <div className={`${boxSize} bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0`}>
        <svg viewBox="0 0 36 24" className="w-6 h-4" fill="none" aria-label="Meta logo">
          <path
            d="M10.2 4C6.5 4 3.5 7.9 3.5 12.6C3.5 16.4 5.7 19 8.7 19C11.4 19 13.5 16.9 16.1 12.5L18 9.3L19.9 12.5C22.5 16.9 24.6 19 27.3 19C30.3 19 32.5 16.4 32.5 12.6C32.5 7.9 29.5 4 25.8 4C23.1 4 21.1 5.9 19 9.1L18 10.6L17 9.1C14.9 5.9 12.9 4 10.2 4Z"
            stroke="#0081FB"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  if (lower.includes('google')) {
    return (
      <div className={`${boxSize} bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-label="Google logo">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.37 24 12 24z" />
          <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z" />
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z" />
        </svg>
      </div>
    );
  }

  if (lower.includes('microsoft')) {
    return (
      <div className={`${boxSize} bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-label="Microsoft logo">
          <rect x="2" y="2" width="9" height="9" fill="#F25022" />
          <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
          <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
          <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
        </svg>
      </div>
    );
  }

  if (lower.includes('tcs')) {
    return (
      <div className={`${boxSize} bg-pink-50 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/40 flex items-center justify-center shrink-0`}>
        <span className="font-display font-bold text-xs tracking-tight bg-gradient-to-r from-pink-600 to-indigo-600 bg-clip-text text-transparent">
          tcs
        </span>
      </div>
    );
  }

  const initials = company
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <div className={`${boxSize} bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shrink-0`}>
      <span className="font-display font-bold text-sm text-[#6425E8] dark:text-indigo-300">
        {initials || 'CO'}
      </span>
    </div>
  );
};
