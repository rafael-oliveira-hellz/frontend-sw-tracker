import { format } from "date-fns";
import { AlertCircle, ArrowLeft, Compass, Loader2, RefreshCcw, Trophy } from "lucide-react";
import { Link } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { useData } from "../context/DataContext";
import { useGuildCurrentState } from "../lib/useGuildCurrentState";

export default function Labyrinth() {
  const { userData } = useData();
  const { currentMember, isLoading, error, refresh } = useGuildCurrentState({
    currentUserName: userData?.user.username,
  });

  if (!userData) return null;

  const hasCoverage = Boolean(currentMember?.coverage.labyrinth);
  const totalAvailable = hasCoverage ? 1 : 0;
  const totalUsed = currentMember?.labyrinth.score ? 1 : 0;
  const progressPercentage = totalAvailable > 0 ? (totalUsed / totalAvailable) * 100 : 0;

  return (
    <div className="clandestino-shell p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>

          <Button
            type="button"
            onClick={() => void refresh()}
            disabled={isLoading}
            className="bg-gradient-to-r from-cyan-500 to-sky-600 text-slate-950 hover:from-cyan-400 hover:to-sky-500"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Atualizar labirinto
              </>
            )}
          </Button>
        </div>

        <Card className="border-2 border-blue-500/30 bg-slate-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl text-white">Labirinto</CardTitle>
            <CardDescription className="text-slate-300">
              Estado atual sincronizado do ciclo de labirinto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Falha ao carregar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!currentMember && !isLoading && !error && (
              <Alert className="border-slate-700 bg-slate-900/50 text-slate-100">
                <Compass className="h-4 w-4" />
                <AlertTitle>Nenhum registro encontrado</AlertTitle>
                <AlertDescription>
                  Ainda não há estado atual sincronizado de labirinto para o seu membro.
                </AlertDescription>
              </Alert>
            )}

            <div className="rounded-lg bg-blue-500/10 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-slate-300">Estado atual sincronizado</span>
                <span className="font-bold text-white">{totalUsed} / {totalAvailable}</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-slate-950/50 p-4">
                <div className="text-sm text-slate-400">Score</div>
                <div className="mt-1 text-2xl font-semibold text-white">{currentMember?.labyrinth.score ?? 0}</div>
              </div>
              <div className="rounded-lg bg-slate-950/50 p-4">
                <div className="text-sm text-slate-400">Rank</div>
                <div className="mt-1 text-2xl font-semibold text-white">{currentMember?.labyrinth.rank ?? "-"}</div>
              </div>
              <div className="rounded-lg bg-slate-950/50 p-4">
                <div className="text-sm text-slate-400">Contribuição</div>
                <div className="mt-1 text-2xl font-semibold text-white">
                  {currentMember?.labyrinth.contributionRate?.toFixed(2) ?? "0.00"}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <div className="mb-3 flex items-center gap-2 text-white">
                <Trophy className="h-5 w-5 text-blue-300" />
                <span className="font-semibold">Resumo do estado atual</span>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <p>MVP: {currentMember?.labyrinth.isMvp ? "sim" : "não"}</p>
                <p>
                  Atualizado em: {currentMember?.updatedAt ? format(new Date(currentMember.updatedAt), "dd/MM/yyyy HH:mm") : "-"}
                </p>
                <p>Fontes de importação: {currentMember?.provenance.labyrinth?.length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
