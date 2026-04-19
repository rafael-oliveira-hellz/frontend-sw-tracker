import { format } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  Compass,
  Loader2,
  RefreshCcw,
  Save,
  Trophy,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import { useData } from "../context/DataContext";
import {
  concludeCurrentLabyrinthCycle,
  fetchCurrentLabyrinthCycle,
  saveCurrentLabyrinthCycle,
  type LabyrinthCycleDto,
} from "../lib/guildImport";
import { useGuildCurrentState } from "../lib/useGuildCurrentState";

const formatLabDate = (value?: string) => {
  if (!value) {
    return "-";
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
};

export default function Labyrinth() {
  const { userData, isAdmin, accessToken } = useData();
  const { currentState, currentMember, isLoading, error, refresh } = useGuildCurrentState({
    currentUserName: userData?.user.username,
  });
  const [cycle, setCycle] = useState<LabyrinthCycleDto | null>(null);
  const [cycleLoading, setCycleLoading] = useState(false);
  const [cycleError, setCycleError] = useState<string | null>(null);
  const [cycleSaving, setCycleSaving] = useState(false);
  const [durationDays, setDurationDays] = useState("4");
  const [requiredAttacksByDay, setRequiredAttacksByDay] = useState<string[]>(["1", "1", "1", "1"]);
  const [copyAllDaysValue, setCopyAllDaysValue] = useState("1");
  const [attacksByMember, setAttacksByMember] = useState<Record<number, string>>({});
  const adminEnabled = isAdmin() && Boolean(accessToken);

  const members = useMemo(
    () =>
      [...(currentState?.members ?? [])].sort((left, right) =>
        left.member.wizardName.localeCompare(right.member.wizardName, "pt-BR"),
      ),
    [currentState],
  );

  useEffect(() => {
    if (!adminEnabled || !accessToken) {
      return;
    }

    let cancelled = false;

    const loadCycle = async () => {
      setCycleLoading(true);
      setCycleError(null);

      try {
        const nextCycle = await fetchCurrentLabyrinthCycle(accessToken);
        if (cancelled) {
          return;
        }

        setCycle(nextCycle);
      } catch (loadError) {
        if (!cancelled) {
          setCycleError(
            loadError instanceof Error
              ? loadError.message
              : "Falha ao carregar o ciclo manual do labirinto.",
          );
        }
      } finally {
        if (!cancelled) {
          setCycleLoading(false);
        }
      }
    };

    void loadCycle();

    return () => {
      cancelled = true;
    };
  }, [accessToken, adminEnabled]);

  useEffect(() => {
    if (!adminEnabled) {
      return;
    }

    const nextAttacks: Record<number, string> = {};
    for (const member of members) {
      const entry = cycle?.entries.find((item) => item.wizardId === member.wizardId);
      nextAttacks[member.wizardId] = entry ? String(entry.validAttacks) : "0";
    }

    setAttacksByMember(nextAttacks);
    const nextDurationDays = cycle?.actualDurationDays ?? cycle?.expectedDurationDays ?? 4;
    setDurationDays(String(nextDurationDays));
    setRequiredAttacksByDay(
      Array.from({ length: nextDurationDays }, (_, index) =>
        String(cycle?.requiredAttacksByDay?.[index] ?? 1),
      ),
    );
    setCopyAllDaysValue(String(cycle?.requiredAttacksByDay?.[0] ?? 1));
  }, [adminEnabled, cycle, members]);

  if (!userData) {
    return null;
  }

  const hasCoverage = Boolean(currentMember?.coverage.labyrinth);
  const totalAvailable = hasCoverage ? 1 : 0;
  const totalUsed = currentMember?.labyrinth.score ? 1 : 0;
  const progressPercentage = totalAvailable > 0 ? (totalUsed / totalAvailable) * 100 : 0;

  const buildCyclePayload = () => ({
    actualDurationDays: Math.max(0, Number(durationDays) || 0),
    requiredAttacksByDay: requiredAttacksByDay.map((value) => Math.max(0, Number(value) || 0)),
    entries: members.map((member) => ({
      wizardId: member.wizardId,
      memberName: member.member.wizardName,
      validAttacks: Math.max(0, Number(attacksByMember[member.wizardId] ?? "0") || 0),
    })),
  });

  const expectedTotalAttacks = requiredAttacksByDay.reduce(
    (sum, value) => sum + Math.max(0, Number(value) || 0),
    0,
  );

  const handleSaveCycle = async () => {
    if (!accessToken) {
      return;
    }

    setCycleSaving(true);
    setCycleError(null);

    try {
      const savedCycle = await saveCurrentLabyrinthCycle(accessToken, buildCyclePayload());
      setCycle(savedCycle);
    } catch (saveError) {
      setCycleError(
        saveError instanceof Error ? saveError.message : "Falha ao salvar o ciclo manual do labirinto.",
      );
    } finally {
      setCycleSaving(false);
    }
  };

  const handleConcludeCycle = async () => {
    if (!accessToken) {
      return;
    }

    setCycleSaving(true);
    setCycleError(null);

    try {
      const concludedCycle = await concludeCurrentLabyrinthCycle(accessToken, buildCyclePayload());
      setCycle(concludedCycle);
    } catch (concludeError) {
      setCycleError(
        concludeError instanceof Error
          ? concludeError.message
          : "Falha ao concluir o ciclo manual do labirinto.",
      );
    } finally {
      setCycleSaving(false);
    }
  };

  return (
    <div className="clandestino-shell p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
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
                <span className="font-bold text-white">
                  {totalUsed} / {totalAvailable}
                </span>
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
                  Atualizado em:{" "}
                  {currentMember?.updatedAt ? format(new Date(currentMember.updatedAt), "dd/MM/yyyy HH:mm") : "-"}
                </p>
                <p>Fontes de importação: {currentMember?.provenance.labyrinth?.length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {adminEnabled ? (
          <Card className="border border-amber-500/30 bg-slate-900/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Apuração manual do labirinto</CardTitle>
              <CardDescription className="text-slate-300">
                A liderança registra os ataques válidos e os dias reais do ciclo. A punição do lab só entra na avaliação quando este ciclo for concluído.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {cycleError ? (
                <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Falha no ciclo manual</AlertTitle>
                  <AlertDescription>{cycleError}</AlertDescription>
                </Alert>
              ) : null}

              {cycleLoading ? (
                <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando ciclo manual do labirinto...
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-slate-950/50 p-4">
                  <div className="text-sm text-slate-400">Data do lab</div>
                  <div className="mt-1 text-xl font-semibold text-white">
                    {formatLabDate(cycle?.cycleStartDate)}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-950/50 p-4">
                  <Label htmlFor="lab-duration" className="text-sm text-slate-400">
                    Dias reais do lab
                  </Label>
                  <Input
                    id="lab-duration"
                    type="number"
                    min={0}
                    value={durationDays}
                    disabled={cycle?.isConcluded}
                    onChange={(event) => setDurationDays(event.target.value)}
                    className="mt-2 border-slate-700 bg-slate-900 text-white"
                  />
                </div>
                <div className="rounded-lg bg-slate-950/50 p-4">
                  <div className="text-sm text-slate-400">Status</div>
                  <div className="mt-1 text-xl font-semibold text-white">
                    {cycle?.isConcluded ? "Concluído" : "Em edição"}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {cycle?.isConcluded
                      ? `Fechado em ${cycle.concludedAt ? format(new Date(cycle.concludedAt), "dd/MM/yyyy HH:mm") : "-"}`
                      : "Edite os ataques válidos até o jogo definir o encerramento do lab."}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Exigência por dia</p>
                    <p className="text-xs text-slate-400">
                      Defina quantos ataques válidos contam em cada dia do ciclo.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Mínimo total esperado</p>
                    <p className="text-lg font-semibold text-white">{expectedTotalAttacks}</p>
                  </div>
                </div>
                <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="w-32">
                    <Label htmlFor="lab-copy-all-days" className="text-sm text-slate-300">
                      Valor base
                    </Label>
                    <Input
                      id="lab-copy-all-days"
                      type="number"
                      min={0}
                      value={copyAllDaysValue}
                      disabled={cycle?.isConcluded}
                      onChange={(event) => setCopyAllDaysValue(event.target.value)}
                      className="mt-2 border-slate-700 bg-slate-950 text-white"
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={cycle?.isConcluded}
                    onClick={() =>
                      setRequiredAttacksByDay((current) =>
                        current.map(() => String(Math.max(0, Number(copyAllDaysValue) || 0))),
                      )
                    }
                    className="bg-sky-500 text-white hover:bg-sky-400"
                  >
                    Copiar valor para todos os dias
                  </Button>
                  <Button
                    type="button"
                    disabled={cycle?.isConcluded}
                    onClick={() => setRequiredAttacksByDay((current) => current.map(() => "0"))}
                    className="bg-slate-700 text-white hover:bg-slate-600"
                  >
                    Zerar todos os dias
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  {requiredAttacksByDay.map((value, index) => (
                    <div key={`lab-day-${index + 1}`} className="rounded-lg bg-slate-900/80 p-3">
                      <Label htmlFor={`lab-day-${index + 1}`} className="text-sm text-slate-300">
                        Dia {index + 1}
                      </Label>
                      <Input
                        id={`lab-day-${index + 1}`}
                        type="number"
                        min={0}
                        value={value}
                        disabled={cycle?.isConcluded}
                        onChange={(event) =>
                          setRequiredAttacksByDay((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? event.target.value : item,
                            ),
                          )
                        }
                        className="mt-2 border-slate-700 bg-slate-950 text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => void handleSaveCycle()}
                  disabled={cycleSaving || cycleLoading || cycle?.isConcluded}
                  className="bg-amber-400 text-slate-950 hover:bg-amber-300"
                >
                  {cycleSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar edições do lab
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleConcludeCycle()}
                  disabled={cycleSaving || cycleLoading || cycle?.isConcluded}
                  className="bg-emerald-500 text-white hover:bg-emerald-400"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Concluir edições do lab
                </Button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
                <table className="min-w-full divide-y divide-slate-800 text-sm">
                  <thead className="bg-slate-900/90">
                    <tr className="text-left text-slate-300">
                      <th className="px-4 py-3 font-medium">Membro</th>
                      <th className="px-4 py-3 font-medium">Ataques válidos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {members.map((member) => (
                      <tr key={member.wizardId} className="text-slate-200">
                        <td className="px-4 py-3">{member.member.wizardName}</td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={0}
                            value={attacksByMember[member.wizardId] ?? "0"}
                            disabled={cycle?.isConcluded}
                            onChange={(event) =>
                              setAttacksByMember((current) => ({
                                ...current,
                                [member.wizardId]: event.target.value,
                              }))
                            }
                            className="w-28 border-slate-700 bg-slate-900 text-white"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
  useEffect(() => {
    const parsedDays = Math.max(0, Number(durationDays) || 0);
    setRequiredAttacksByDay((current) =>
      Array.from({ length: parsedDays }, (_, index) => current[index] ?? "1"),
    );
  }, [durationDays]);
