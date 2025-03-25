interface IconProps {
  className?: string;
}

export function CasinoIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export function SpadesIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.5 5 8 7 8.5 9c.35 1.5 1.5 2.5 2 3.5s.1 2 0 2.5H10c-.5 0-1 1.5 0 2s2 .5 2 .5v4h0c0 .5.5.5.5.5h1.5s.5 0 .5-.5V18s1.5 0 2-.5 0-2 0-2h-.5c-.5-.5-.5-1.5 0-2.5s1.65-2 2-3.5c.5-2 0-4-3.5-7z"/>
    </svg>
  );
}

export function ClubsIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2c-1.66 0-3 1.34-3 3 0 1.24.76 2.3 1.83 2.75-.6 1.21-1.6 2.41-3.46 2.58C4.74 10.53 3 11.84 3 15c0 1.66 1.34 3 3 3s3-1.34 3-3c0-.73-.27-1.4-.7-1.92.47.18.97.3 1.5.32 1.37.09 2.5-.42 3.2-1.12.71.7 1.83 1.21 3.2 1.12.53-.03 1.03-.14 1.5-.32-.43.52-.7 1.19-.7 1.92 0 1.66 1.34 3 3 3s3-1.34 3-3c0-3.16-1.74-4.47-4.37-4.67-1.85-.17-2.86-1.37-3.46-2.58C16.24 7.3 17 6.24 17 5c0-1.66-1.34-3-3-3z"/>
    </svg>
  );
}

export function HeartsIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  );
}

export function DiamondsIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 12l10 10 10-10L12 2z"/>
    </svg>
  );
}

export function DiceIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.071 4.929a10 10 0 10 0 14.142 14.142M7.05 7.05A7 7 0 0017 17M3 12h.01M12 3v.01M21 12h-.01M12 21v-.01M18.364 5.636l-.01.01" />
    </svg>
  );
}

export function RouletteIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" strokeWidth="2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4M12 18v4M22 12h-4M6 12H2M17 7l-2 2M9 17l-2 2M17 17l-2-2M9 7l-2-2" />
    </svg>
  );
}

export function SlotIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="2" y="4" width="20" height="16" rx="2" strokeWidth="2" />
      <line x1="8" y1="4" x2="8" y2="20" strokeWidth="2" />
      <line x1="16" y1="4" x2="16" y2="20" strokeWidth="2" />
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function TrophyIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
} 