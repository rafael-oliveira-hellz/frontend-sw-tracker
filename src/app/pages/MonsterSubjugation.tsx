import {
  AlertCircle,
  ArrowLeft,
  Droplet,
  Flame,
  Loader2,
  RefreshCcw,
  Skull,
  Wind,
} from "lucide-react";
import { Link } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useData } from "../context/DataContext";
import { getSubjugationStatus } from "../lib/subjugation";
import { useGuildCurrentState } from "../lib/useGuildCurrentState";

const getElementColor = (element: string) => {
  switch (element) {
    case "Fogo":
      return "from-red-500 to-orange-500";
    case "Água":
      return "from-blue-500 to-cyan-500";
    case "Vento":
      return "from-green-500 to-emerald-500";
    case "Boss Slime":
      return "from-violet-500 to-fuchsia-600";
    default:
      return "from-gray-500 to-gray-600";
  }
};

const getElementIcon = (element: string) => {
  switch (element) {
    case "Fogo":
      return <Flame className="h-6 w-6" />;
    case "Água":
      return <Droplet className="h-6 w-6" />;
    case "Vento":
      return <Wind className="h-6 w-6" />;
    case "Boss Slime":
      return <Skull className="h-6 w-6" />;
    default:
      return null;
  }
};

export default function MonsterSubjugation() {
  const { userData } = useData();
  const { currentMember, isLoading, error, refresh } = useGuildCurrentState({
    currentUserName: userData?.user.username,
  });

  if (!userData) return null;

  const score = currentMember?.subjugation.clearScore ?? 0;
  const subjugationStatus = getSubjugationStatus(currentMember?.subjugation);
  const fronts = [
    { label: "Fogo", completed: subjugationStatus.miniBossTypes.includes(101) },
    { label: "Água", completed: subjugationStatus.miniBossTypes.includes(102) },
    { label: "Vento", completed: subjugationStatus.miniBossTypes.includes(103) },
    { label: "Boss Slime", completed: subjugationStatus.completedBosses > 0 },
  ];

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
                Atualizar subjugação
              </>
            )}
          </Button>
        </div>

        <Card className="border-2 border-purple-500/30 bg-slate-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl text-white">Subjugação de Monstros</CardTitle>
            <CardDescription className="text-slate-300">
              Estado atual sincronizado do ciclo de subjugação.
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
                <Flame className="h-4 w-4" />
                <AlertTitle>Nenhum registro encontrado</AlertTitle>
                <AlertDescription>
                  Ainda não há estado atual sincronizado de subjugação para o seu membro.
                </AlertDescription>
              </Alert>
            )}

            <div className="rounded-lg bg-purple-500/10 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-slate-300">Estado atual do ciclo</span>
                <span className="font-bold text-white">
                  {subjugationStatus.frontsCompleted} / {subjugationStatus.frontsExpected} frentes
                </span>
              </div>
              {subjugationStatus.incomplete ? (
                <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                  Subjugação incompleta.
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {fronts.map((front) => (
                  <div
                    key={front.label}
                    className={`flex flex-col items-center gap-2 rounded-lg p-3 ${
                      front.completed ? "border-2 border-green-500 bg-green-500/10" : "bg-slate-950/40"
                    }`}
                  >
                    <div
                      className={`rounded-full bg-gradient-to-br p-2 text-white ${getElementColor(front.label)}`}
                    >
                      {getElementIcon(front.label)}
                    </div>
                    <span className="text-center text-sm font-medium text-white">{front.label}</span>
                    {front.completed ? (
                      <span className="text-xs font-semibold text-green-400">Consolidado</span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-500">Pendente</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-slate-950/50 p-4">
                <div className="text-sm text-slate-400">Score</div>
                <div className="mt-1 text-2xl font-semibold text-white">{score}</div>
              </div>
              <div className="rounded-lg bg-slate-950/50 p-4">
                <div className="text-sm text-slate-400">Rank</div>
                <div className="mt-1 text-2xl font-semibold text-white">
                  {currentMember?.subjugation.rank ?? "-"}
                </div>
              </div>
              <div className="rounded-lg bg-slate-950/50 p-4">
                <div className="text-sm text-slate-400">Contribuição</div>
                <div className="mt-1 text-2xl font-semibold text-white">
                  {currentMember?.subjugation.contributeRatio?.toFixed(2) ?? "0.00"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
