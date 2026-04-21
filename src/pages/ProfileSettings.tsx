import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, Save, ArrowLeft, User, AtSign, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";

const ProfileSettings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    username: "",
    bio: "",
    avatar_url: "",
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          username: data.username || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || "",
        });
      }
    };
    fetch();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 2MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo deve ser uma imagem");
      return;
    }

    setUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao enviar imagem");
      setUploading(false);
      setPreviewUrl(null);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);

    if (updateError) {
      toast.error("Erro ao atualizar perfil");
    } else {
      setProfile((p) => ({ ...p, avatar_url: avatarUrl }));
      toast.success("Foto atualizada!");
    }
    setUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (profile.username.length < 3) {
      toast.error("Username deve ter pelo menos 3 caracteres");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        username: profile.username,
        bio: profile.bio,
      })
      .eq("id", user.id);

    if (error) {
      if (error.code === "23505") {
        toast.error("Esse username já está em uso");
      } else {
        toast.error("Erro ao salvar perfil");
      }
    } else {
      toast.success("Perfil atualizado!");
    }
    setSaving(false);
  };

  const displayAvatar = previewUrl || profile.avatar_url;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="loading-spinner h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <Logo size="sm" />
          <div className="w-16" />
        </div>
      </header>

      <div className="container mx-auto max-w-lg px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-1 font-display text-2xl font-bold text-foreground">Editar Perfil</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            Personalize como os doadores veem seu perfil
          </p>

          {/* Avatar */}
          <div className="mb-8 flex flex-col items-center">
            <div className="group relative">
              <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-primary/20 bg-muted">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User size={40} className="text-muted-foreground" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110"
              >
                {uploading ? (
                  <div className="loading-spinner h-4 w-4 border-primary-foreground/30 border-t-primary-foreground" />
                ) : (
                  <Camera size={16} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Clique no ícone para alterar a foto (máx. 2MB)
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="flex items-center gap-1.5">
                <User size={14} /> Nome completo
              </Label>
              <Input
                id="full_name"
                placeholder="Seu nome completo"
                value={profile.full_name}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, full_name: e.target.value }))
                }
                className="h-11"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username" className="flex items-center gap-1.5">
                <AtSign size={14} /> Username
              </Label>
              <Input
                id="username"
                placeholder="seuusuario"
                value={profile.username}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  }))
                }
                className="h-11"
                minLength={3}
                maxLength={30}
                required
              />
              <p className="text-xs text-muted-foreground">
                Seu link: pilha-money.com/@{profile.username}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio" className="flex items-center gap-1.5">
                <FileText size={14} /> Bio (opcional)
              </Label>
              <Textarea
                id="bio"
                placeholder="Conte um pouco sobre você..."
                value={profile.bio}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, bio: e.target.value }))
                }
                className="resize-none"
                rows={3}
                maxLength={200}
              />
              <div className="text-right text-xs text-muted-foreground">
                {profile.bio.length}/200
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 gap-2"
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="loading-spinner h-4 w-4" /> Salvando...
                </span>
              ) : (
                <>
                  <Save size={16} /> Salvar Alterações
                </>
              )}
            </Button>
          </form>

          {/* Preview */}
          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Pré-visualização
            </p>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-primary/20 bg-muted">
                {displayAvatar ? (
                  <img src={displayAvatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User size={24} className="text-muted-foreground" />
                  </div>
                )}
              </div>
              <div>
                <div className="font-display font-bold text-card-foreground">
                  {profile.full_name || "Seu Nome"}
                </div>
                <div className="text-sm text-muted-foreground">
                  @{profile.username || "username"}
                </div>
                {profile.bio && (
                  <div className="mt-1 text-xs text-muted-foreground">{profile.bio}</div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileSettings;
