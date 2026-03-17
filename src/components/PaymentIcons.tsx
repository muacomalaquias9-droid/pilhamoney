const PaymentIcons = () => (
  <div className="flex items-center justify-center gap-3 py-1">
    {/* Visa */}
    <svg viewBox="0 0 48 32" className="h-7 w-auto" aria-label="Visa">
      <rect width="48" height="32" rx="4" fill="hsl(var(--muted))" />
      <path d="M19.5 21h-2.7l1.7-10.5h2.7L19.5 21zm-5-10.5l-2.6 7.2-.3-1.5-.9-4.7s-.1-.9-1.2-.9H5.3l-.1.3s1.2.3 2.7.9l2.3 8.7h2.8l4.3-10h-2.8zm22.3 10.5h2.5l-2.2-10.5h-2.2c-.9 0-1.1.5-1.1.5l-4 10h2.8l.5-1.5h3.4l.3 1.5zm-3-3.5l1.4-3.9.8 3.9h-2.2zm-5.5-4l.4-2.2s-1.1-.4-2.3-.4c-1.3 0-4.3.6-4.3 3.3 0 2.5 3.5 2.6 3.5 3.9 0 1.3-3.1 1.1-4.2.3l-.4 2.3s1.2.5 3 .5c1.8 0 4.5-.9 4.5-3.4 0-2.6-3.5-2.8-3.5-3.9 0-1.1 2.5-1 3.3-.4z" fill="hsl(var(--foreground))" />
    </svg>
    {/* MasterCard */}
    <svg viewBox="0 0 48 32" className="h-7 w-auto" aria-label="MasterCard">
      <rect width="48" height="32" rx="4" fill="hsl(var(--muted))" />
      <circle cx="19" cy="16" r="8" fill="#EB001B" />
      <circle cx="29" cy="16" r="8" fill="#F79E1B" />
      <path d="M24 10.3a8 8 0 0 1 0 11.4 8 8 0 0 1 0-11.4z" fill="#FF5F00" />
    </svg>
    {/* Bybit */}
    <div className="flex h-7 items-center rounded bg-muted px-2">
      <span className="text-[10px] font-bold text-foreground tracking-tight">BYBIT</span>
    </div>
    {/* RedotPay */}
    <div className="flex h-7 items-center rounded bg-muted px-2">
      <span className="text-[10px] font-bold text-foreground tracking-tight">RedotPay</span>
    </div>
  </div>
);

export default PaymentIcons;
