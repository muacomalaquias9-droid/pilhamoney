import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { QrCode, Copy, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PersonalQRCodeProps {
  username: string;
  fullName: string;
  userId: string;
}

const PersonalQRCode = ({ username, fullName, userId }: PersonalQRCodeProps) => {
  const [showModal, setShowModal] = useState(false);
  const profileUrl = `${window.location.origin}/@${username}`;

  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    toast.success("Link copiado!");
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Doe para ${fullName}`, text: `Faça uma doação para ${fullName} no Pilha-Money`, url: profileUrl });
      } catch { /* user cancelled */ }
    } else {
      copyLink();
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex flex-col items-center py-2 rounded-2xl hover:bg-muted/50 transition-colors"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform active:scale-95">
          <QrCode size={20} />
        </div>
        <span className="text-[11px] font-medium text-muted-foreground mt-1.5">QR Code</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={() => setShowModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl bg-card shadow-lg p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">Meu QR Code</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-border">
                <QRCodeSVG
                  value={profileUrl}
                  size={200}
                  level="H"
                  includeMargin={false}
                  fgColor="#16a34a"
                  bgColor="#ffffff"
                />
              </div>

              <p className="mt-4 text-center text-sm font-medium text-foreground">{fullName}</p>
              <p className="text-xs text-muted-foreground">@{username}</p>
              <p className="mt-1 text-[10px] text-muted-foreground break-all text-center">{profileUrl}</p>

              <div className="mt-4 flex gap-2 w-full">
                <Button variant="outline" className="flex-1" size="sm" onClick={copyLink}>
                  <Copy size={14} className="mr-1" /> Copiar
                </Button>
                <Button className="flex-1" size="sm" onClick={share}>
                  <Share2 size={14} className="mr-1" /> Partilhar
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default PersonalQRCode;
