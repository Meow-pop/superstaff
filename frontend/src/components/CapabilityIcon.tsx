interface CapabilityIconProps {
  kind: 'agent' | 'workflow' | 'trend'
}

export function CapabilityIcon({ kind }: CapabilityIconProps) {
  if (kind === 'agent') {
    return (
      <svg viewBox="0 0 96 96" role="img" aria-label="Agent 智能体">
        <defs>
          <linearGradient id="robotBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#dff2ff" />
          </linearGradient>
          <linearGradient id="robotScreen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#394dc4" />
            <stop offset="1" stopColor="#6b42bc" />
          </linearGradient>
        </defs>
        <path d="M48 12v11" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
        <circle cx="48" cy="10" r="5" fill="#ffcc67" />
        <rect x="21" y="24" width="54" height="48" rx="16" fill="url(#robotBody)" />
        <rect x="28" y="34" width="40" height="25" rx="10" fill="url(#robotScreen)" />
        <circle cx="40" cy="46" r="4" fill="#78efff" />
        <circle cx="56" cy="46" r="4" fill="#78efff" />
        <path d="M41 64h14" stroke="#8aa2dc" strokeWidth="4" strokeLinecap="round" />
        <path d="M17 41h5M74 41h5" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
        <circle cx="80" cy="41" r="5" fill="#ff6c9f" />
        <circle cx="16" cy="41" r="5" fill="#ff6c9f" />
        <path d="M34 75v7M62 75v7" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
        <path d="M25 25l-7-6M71 25l7-6" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      </svg>
    )
  }

  if (kind === 'workflow') {
    return (
      <svg viewBox="0 0 96 96" role="img" aria-label="自动工作流">
        <defs>
          <linearGradient id="flowBlock" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#e7ddff" />
          </linearGradient>
        </defs>
        <path d="M29 32h21c9 0 15 6 15 15v7" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
        <path d="M44 65H31c-8 0-13-5-13-13v-5" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
        <rect x="12" y="18" width="27" height="27" rx="7" fill="url(#flowBlock)" />
        <rect x="56" y="53" width="27" height="27" rx="7" fill="url(#flowBlock)" />
        <rect x="38" y="40" width="24" height="24" rx="6" transform="rotate(45 50 52)" fill="#fff" opacity=".92" />
        <circle cx="25.5" cy="31.5" r="5" fill="#8e66e4" />
        <circle cx="69.5" cy="66.5" r="5" fill="#7f5ade" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 96 96" role="img" aria-label="一键追爆">
      <defs>
        <linearGradient id="clapper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d9fffa" />
        </linearGradient>
        <linearGradient id="flame" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#ffdd67" />
          <stop offset="1" stopColor="#ff6e88" />
        </linearGradient>
      </defs>
      <path d="M58 17c3 11-7 14-3 23 8-5 12-12 10-21 10 8 17 19 14 31-3 14-14 24-30 24-18 0-31-12-31-29 0-10 5-19 14-26-2 10 1 17 8 22 0-12 8-18 18-24Z" fill="url(#flame)" opacity=".88" />
      <rect x="18" y="38" width="62" height="39" rx="7" fill="url(#clapper)" />
      <path d="M18 46h62M26 38l10 8M45 38l10 8M64 38l10 8" stroke="#30a2a9" strokeWidth="4" />
      <path d="m43 55 17 9-17 9Z" fill="#36aeb4" />
      <rect x="15" y="28" width="64" height="13" rx="4" transform="rotate(-8 15 28)" fill="#fff" opacity=".95" />
      <path d="m27 28 10 11M47 25l10 11M67 22l9 10" stroke="#42b6bd" strokeWidth="4" />
    </svg>
  )
}
