const PaymentIcons = () => (
  <div className="flex flex-wrap items-center justify-center gap-3 py-2">
    <div className="flex h-10 items-center gap-2 rounded-2xl border border-border bg-card px-4 shadow-sm">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">M</span>
      <div className="leading-none">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Multicaixa</div>
        <div className="text-[11px] font-semibold text-foreground">Express</div>
      </div>
    </div>

    <div className="flex h-10 items-center rounded-2xl border border-border bg-card px-4 shadow-sm">
      <div className="flex items-center gap-1.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background">
          <span className="text-[8px] font-black">P</span>
        </div>
        <span className="text-[11px] font-bold text-foreground">PlinqPay</span>
      </div>
    </div>

    <div className="flex h-10 items-center rounded-2xl border border-border bg-card px-4 shadow-sm">
      <span className="text-[11px] font-semibold text-muted-foreground">Pagamento por referência</span>
    </div>
  </div>
);

export default PaymentIcons;
