const PaymentIcons = () => (
  <div className="flex flex-wrap items-center justify-center gap-4 py-2">
    {/* Visa - official colors */}
    <div className="flex h-9 items-center rounded-lg border border-border bg-background px-3 shadow-sm">
      <svg viewBox="0 0 780 500" className="h-5 w-auto" aria-label="Visa">
        <path d="M293.2 348.7l33.4-195.8h53.4l-33.4 195.8zM540.7 159c-10.6-4-27.2-8.3-47.9-8.3-52.9 0-90.1 26.5-90.4 64.5-.3 28.1 26.6 43.8 46.9 53.1 20.8 9.6 27.8 15.7 27.7 24.3-.1 13.1-16.6 19.1-31.9 19.1-21.4 0-32.7-3-50.3-10.2l-6.9-3.1-7.5 43.8c12.5 5.5 35.6 10.2 59.6 10.5 56.3 0 92.8-26.2 93.2-66.8.2-22.3-14.1-39.2-45-53.1-18.7-9-30.2-15.1-30.1-24.3 0-8.1 9.7-16.8 30.7-16.8 17.5-.3 30.2 3.5 40.1 7.5l4.8 2.3 7.3-42.5zm138.7-6.1h-41.4c-12.8 0-22.4 3.5-28.1 16.2l-79.6 179.6h56.3s9.2-24.1 11.3-29.4h68.8c1.6 6.9 6.5 29.4 6.5 29.4h49.8l-43.6-195.8zm-66 126.4c4.4-11.3 21.5-55 21.5-55-.3.5 4.4-11.4 7.1-18.8l3.6 17s10.4 47.1 12.5 56.8h-44.7zM327.1 152.9l-52.5 133.5-5.6-27.1c-9.7-31.2-40-65-73.9-81.9l48 171.2h56.7l84.4-195.8h-57.1z" fill="#1A1F71"/>
        <path d="M146.9 152.9H60.3l-.7 3.6c67.3 16.2 111.8 55.4 130.3 102.4l-18.8-90.2c-3.2-12.3-12.7-15.4-24.2-15.8z" fill="#F9A533"/>
      </svg>
    </div>

    {/* Mastercard - official circles */}
    <div className="flex h-9 items-center rounded-lg border border-border bg-background px-3 shadow-sm">
      <svg viewBox="0 0 780 500" className="h-5 w-auto" aria-label="Mastercard">
        <circle cx="330" cy="250" r="160" fill="#EB001B"/>
        <circle cx="450" cy="250" r="160" fill="#F79E1B"/>
        <path d="M390 130.7c-39.4 31.2-64.6 79.5-64.6 133.3s25.2 102.1 64.6 133.3c39.4-31.2 64.6-79.5 64.6-133.3S429.4 161.9 390 130.7z" fill="#FF5F00"/>
      </svg>
    </div>

    {/* Multicaixa Express */}
    <div className="flex h-9 items-center rounded-lg border border-border bg-background px-3 shadow-sm">
      <div className="flex items-center gap-1.5">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-[#E31937]">
          <span className="text-[8px] font-black text-white">MC</span>
        </div>
        <span className="text-[10px] font-semibold text-foreground">Express</span>
      </div>
    </div>

    {/* PayPay */}
    <div className="flex h-9 items-center rounded-lg border border-border bg-background px-3 shadow-sm">
      <div className="flex items-center gap-1">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-[#00A651]">
          <span className="text-[8px] font-black text-white">PP</span>
        </div>
        <span className="text-[10px] font-semibold text-foreground">PayPay</span>
      </div>
    </div>

    {/* Bybit */}
    <div className="flex h-9 items-center rounded-lg border border-border bg-background px-3 shadow-sm">
      <div className="flex items-center gap-1">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-[#F7A600]">
          <span className="text-[7px] font-black text-white">B</span>
        </div>
        <span className="text-[10px] font-semibold text-foreground">Bybit</span>
      </div>
    </div>

    {/* RedotPay */}
    <div className="flex h-9 items-center rounded-lg border border-border bg-background px-3 shadow-sm">
      <div className="flex items-center gap-1">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF3B30]">
          <span className="text-[7px] font-black text-white">R</span>
        </div>
        <span className="text-[10px] font-semibold text-foreground">RedotPay</span>
      </div>
    </div>
  </div>
);

export default PaymentIcons;
