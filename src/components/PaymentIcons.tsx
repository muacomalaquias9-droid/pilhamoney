const PaymentIcons = () => (
  <div className="flex flex-wrap items-center justify-center gap-3 py-2">
    {/* Multicaixa Express */}
    <div className="flex h-9 items-center rounded-lg border border-border bg-background px-3 shadow-sm">
      <svg viewBox="0 0 120 30" className="h-6 w-auto">
        <rect width="120" height="30" rx="4" fill="#E31937"/>
        <text x="60" y="12" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="Arial, sans-serif">MULTICAIXA</text>
        <text x="60" y="23" textAnchor="middle" fill="white" fontSize="8" fontWeight="900" fontFamily="Arial, sans-serif">EXPRESS</text>
      </svg>
    </div>

    {/* PlinqPay */}
    <div className="flex h-9 items-center rounded-lg border border-border bg-background px-3 shadow-sm">
      <div className="flex items-center gap-1.5">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-foreground">
          <span className="text-[7px] font-black text-background">P</span>
        </div>
        <span className="text-[11px] font-bold text-foreground">PlinqPay</span>
      </div>
    </div>

    {/* Referência */}
    <div className="flex h-9 items-center rounded-lg border border-border bg-background px-3 shadow-sm">
      <span className="text-[11px] font-semibold text-muted-foreground">Referência</span>
    </div>
  </div>
);

export default PaymentIcons;
