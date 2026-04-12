import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { AlertCircle, KeyRound, LogIn, ShieldCheck } from "lucide-react";

import logo from "../../assets/logo.jpeg";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useData } from "../context/DataContext";

export default function Login() {
  const [password, setPassword] = useState("");
  const [usernameOrNumber, setUsernameOrNumber] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useData();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(usernameOrNumber, password);
      navigate("/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao entrar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="clandestino-shell flex items-center justify-center p-4">
      <Card className="relative z-10 w-full max-w-md border-2 border-amber-500/30 bg-slate-950/82 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
        <CardHeader className="pb-4 text-center">
          <div className="mb-4 flex justify-center">
            <div className="overflow-hidden rounded-full border border-amber-400/40 shadow-[0_0_45px_rgba(89,192,255,0.18)]">
              <img src={logo} alt="Logo Clã D9stino" className="h-28 w-28 object-cover sm:h-32 sm:w-32" />
            </div>
          </div>
          <CardTitle className="clandestino-brand-title text-2xl font-bold sm:text-3xl">
            Clã D9stino
          </CardTitle>
          <CardDescription className="text-sm text-slate-300 sm:text-base">
            Painel de atividades sincronizado da guilda
          </CardDescription>
          <div className="pt-3 text-sm text-slate-400">
            Quer entrar na guilda?{" "}
            <Link to="/recrutamento" className="font-semibold text-cyan-300 hover:text-cyan-200">
              Veja a página pública de recrutamento
            </Link>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-xl border border-amber-500/20 bg-slate-900/60 p-4 text-sm text-slate-200">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <ShieldCheck className="h-4 w-4" />
              Contas criadas automaticamente pela importação da guilda
            </div>
            <p className="mt-2 text-slate-300">
              O acesso é liberado quando a liderança importa os JSONs da guilda. Entre com o nome ou número do
              invocador e use sua senha atual ou a senha padrão informada pela liderança.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <KeyRound className="h-3.5 w-3.5" />
              Se você acabou de entrar na guilda, peça uma nova importação para que sua conta seja sincronizada.
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-3 text-sm text-red-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usernameOrNumber" className="text-slate-200">
                Nome ou Número do Invocador
              </Label>
              <Input
                id="usernameOrNumber"
                type="text"
                placeholder="Digite seu nome ou número"
                value={usernameOrNumber}
                onChange={(e) => setUsernameOrNumber(e.target.value)}
                className="border-slate-600 bg-slate-800/60 text-white placeholder:text-slate-500 focus:border-amber-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loginPassword" className="text-slate-200">
                Senha
              </Label>
              <Input
                id="loginPassword"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-slate-600 bg-slate-800/60 text-white placeholder:text-slate-500 focus:border-amber-500"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-400 to-cyan-500 font-semibold text-slate-950 shadow-lg shadow-cyan-950/35 transition-all hover:from-amber-300 hover:to-cyan-400"
            >
              <LogIn className="mr-2 h-4 w-4" />
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
