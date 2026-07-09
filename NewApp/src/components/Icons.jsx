export function RefreshIcon({size = 16}) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
             stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 8a6 6 0 1 0 1.5-3.9"/>
            <path d="M2 4v4h4"/>
        </svg>
    );
}

export function InfoIcon({size = 14}) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
             stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6"/>
            <line x1="8" y1="5" x2="8" y2="8.5"/>
            <circle cx="8" cy="11" r="0.5" fill="currentColor"/>
        </svg>
    );
}

export function ImportIcon({size = 16}) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
             stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v7"/>
            <path d="M5 6l3 3 3-3"/>
            <path d="M3 12h10v2H3z"/>
        </svg>
    );
}
