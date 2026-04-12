import React from "react";
import { Link } from "react-router";
import { ArrowLeft, History } from "lucide-react";

import GuildImportHistoryPanel from "../components/admin/GuildImportHistoryPanel";
import { Button } from "../components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useData } from "../context/DataContext";

export default function ImportHistoryPage() {
  const { userData, isAdmin } = useData();

  if (!userData || !isAdmin()) {
    return (
      <div className="clandestino-shell flex items-center justify-center p-4">
        <Card className="border-2 border-red-500/30 bg-slate-900/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-red-400">Acesso negado</CardTitle>
            <CardDescription className="text-slate-300">
              Apenas líderes e vice-líderes podem acessar esta área.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="clandestino-shell p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/admin">
              <Button variant="ghost" className="mb-4 text-slate-300 hover:bg-slate-800 hover:text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao painel admin
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-2">
                <History className="h-5 w-5 text-violet-300" />
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-violet-200 via-fuchsia-300 to-pink-300 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl lg:text-4xl">
                  Histórico de importações
                </h1>
                <p className="text-sm text-slate-300 sm:text-base">
                  Consulte as importações persistidas e acompanhe a consolidação enviada ao backend.
                </p>
              </div>
            </div>
          </div>
        </div>

        <GuildImportHistoryPanel />
      </div>
    </div>
  );
}
