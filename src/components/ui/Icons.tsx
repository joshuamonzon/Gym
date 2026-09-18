import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }
const base = (size: number, p: P) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p,
})

export const ChevronLeft = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><path d="m15 5-7 7 7 7" /></svg>
export const ChevronRight = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><path d="m9 5 7 7-7 7" /></svg>
export const ChevronDown = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><path d="m5 9 7 7 7-7" /></svg>
export const ChevronUp = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><path d="m5 15 7-7 7 7" /></svg>
export const Plus = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><path d="M12 5v14M5 12h14" /></svg>
export const Check = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><path d="m5 12 5 5L20 7" /></svg>
export const Close = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
export const Trash = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
export const More = ({ size = 22, ...p }: P) => <svg {...base(size, p)} fill="currentColor" stroke="none"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
export const Timer = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9 2h6M12 2v3" /></svg>
export const Stopwatch = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><circle cx="12" cy="13" r="7" /><path d="M12 10v3l2 2M10 2h4M12 2v4" /></svg>
export const Gear = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
export const Pencil = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" /></svg>
export const Share = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><path d="M12 3v12M8 7l4-4 4 4M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" /></svg>
export const Flame = ({ size = 22, ...p }: P) => <svg {...base(size, p)} fill="currentColor" stroke="none"><path d="M12 2s5 4.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 1-3.5s.5 2 2 2c0-3 2-5.5 2-8.5Z" /></svg>
export const Moon = ({ size = 22, ...p }: P) => <svg {...base(size, p)} fill="currentColor" stroke="none"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>
export const Swap = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><path d="M4 7h13l-3-3M20 17H7l3 3" /></svg>
export const Calendar = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
export const Chart = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><path d="M3 20h18M4 16l5-6 4 3 7-8" /></svg>
export const Dumbbell = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><path d="M2 12h2M20 12h2M9 12h6" /><rect x="4" y="8" width="3" height="8" rx="1" /><rect x="17" y="8" width="3" height="8" rx="1" /><rect x="7" y="6" width="2" height="12" rx="0.5" /><rect x="15" y="6" width="2" height="12" rx="0.5" /></svg>
export const Ruler = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><circle cx="12" cy="5" r="2" /><path d="M12 7v6M8 10l4 3 4-3M9 21l3-8 3 8" /></svg>
export const Trophy = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" /></svg>
export const Search = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
export const Info = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
export const Play = ({ size = 22, ...p }: P) => <svg {...base(size, p)} fill="currentColor" stroke="none"><path d="M7 5v14l12-7Z" /></svg>
export const ArrowUp = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><path d="M12 19V5M5 12l7-7 7 7" /></svg>
export const ArrowDown = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><path d="M12 5v14M5 12l7 7 7-7" /></svg>
export const Download = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><path d="M12 3v12M8 11l4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
export const Upload = ({ size = 22, ...p }: P) => <svg {...base(size, p)}><path d="M12 15V3M8 7l4-4 4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
