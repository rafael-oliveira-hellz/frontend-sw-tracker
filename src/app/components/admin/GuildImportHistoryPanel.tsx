import {
  AlertCircle,
  Database,
  FileJson,
  History,
  Loader2,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  clearLastGuildImportRunId,
  DEFAULT_GUILD_IMPORT_HISTORY_ENDPOINT,
  fetchGuildImportHistory,
  fetchGuildImportHistoryDetail,
  GUILD_IMPORT_COMPLETED_EVENT,
  readLastGuildImportRunId,
  type GuildImportHistoryDetailDto,
  type GuildImportHistoryItemDto,
} from "../../lib/guildImport";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const formatDateTime = (value?: string) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
};

const formatOptionalNumber = (value?: number) => (value !== undefined ? String(value) : "Não identificado");

function HistorySummaryCards({ items }: { items: GuildImportHistoryItemDto[] }) {
  const summary = useMemo(() => {
    const guildIds = new Set<number>();
    return items.reduce(
      (accumulator, item) => {
        accumulator.imports += 1;
        accumulator.files += item.totalFilesRead;
        accumulator.members = Math.max(accumulator.members, item.membersSaved);
        accumulator.attacks += item.attacksSaved;
        accumulator.defenses += item.defensesSaved;
        if (item.guildId !== undefined) {
          guildIds.add(item.guildId);
        }
        return accumulator;
      },
      { imports: 0, files: 0, members: 0, attacks: 0, defenses: 0, guilds: guildIds },
    );
  }, [items]);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
        <p className="text-xs text-slate-400">Importações</p>
        <p className="text-lg font-semibold text-white">{summary.imports}</p>
      </div>
      <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
        <p className="text-xs text-slate-400">Arquivos lidos</p>
        <p className="text-lg font-semibold text-white">{summary.files}</p>
      </div>
      <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
        <p className="text-xs text-slate-400">Maior visão consolidada</p>
        <p className="text-lg font-semibold text-white">{summary.members} membros</p>
      </div>
      <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
        <p className="text-xs text-slate-400">Ataques acumulados</p>
        <p className="text-lg font-semibold text-white">{summary.attacks}</p>
      </div>
      <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
        <p className="text-xs text-slate-400">Defesas acumuladas</p>
        <p className="text-lg font-semibold text-white">{summary.defenses}</p>
      </div>
      <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
        <p className="text-xs text-slate-400">Guild IDs vistos</p>
        <p className="text-lg font-semibold text-white">{summary.guilds.size}</p>
      </div>
    </div>
  );
}

function HistoryDetailPanel({ detail }: { detail: GuildImportHistoryDetailDto }) {
  return (
    <Card className="border-2 border-sky-500/30 bg-slate-900/60 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-2">
            <ShieldCheck className="h-5 w-5 text-sky-300" />
          </div>
          <div>
            <CardTitle className="text-white">Detalhes da Importação</CardTitle>
            <CardDescription className="text-slate-300">
              Visão consolidada, fontes e contadores da importação selecionada.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/60">
            <TabsTrigger value="overview">Resumo</TabsTrigger>
            <TabsTrigger value="sources">Fontes</TabsTrigger>
            <TabsTrigger value="raw">JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Guilda</p>
                <p className="text-sm font-semibold text-white">
                  {detail.snapshot.guildName || "Não identificada"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Guild ID</p>
                <p className="text-sm font-semibold text-white">{formatOptionalNumber(detail.snapshot.guildId)}</p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Wizard ID atual</p>
                <p className="text-sm font-semibold text-white">
                  {formatOptionalNumber(detail.snapshot.currentUserWizardId)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Arquivos</p>
                <p className="text-sm font-semibold text-white">{detail.history.totalFilesRead}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Membros</p>
                <p className="text-sm font-semibold text-white">{detail.history.membersSaved}</p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Visão consolidada</p>
                <p className="text-sm font-semibold text-white">{formatDateTime(detail.history.generatedAt)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 text-sm text-slate-300">
              <p>
                <span className="text-slate-400">Importado em:</span> {formatDateTime(detail.history.importedAt)}
              </p>
              <p>
                <span className="text-slate-400">Origem:</span> {detail.history.sourceFolder}
              </p>
              <p>
                <span className="text-slate-400">Regra de consolidação:</span> {detail.snapshot.mergePolicy.duplicateResolution}
              </p>
              <p className="mt-2 text-xs text-slate-500">{detail.snapshot.mergePolicy.notes}</p>
            </div>
          </TabsContent>

          <TabsContent value="sources">
            <ScrollArea className="h-[28rem] rounded-xl border border-slate-700/60 bg-slate-950/30 p-4">
              <div className="space-y-2">
                {detail.importSources.map((source) => (
                  <div
                    key={`${source.priorityOrder}-${source.fileName}`}
                    className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-white">{source.fileName}</p>
                      <Badge className="border-sky-500/30 bg-sky-500/15 text-sky-200">
                        {source.command}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Ordem: {source.priorityOrder} • {source.usedInAggregation ? "Usado na consolidação" : "Ignorado"}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="raw">
            <ScrollArea className="h-[28rem] rounded-xl border border-slate-700/60 bg-slate-950/30 p-4">
              <pre className="whitespace-pre-wrap break-words text-xs text-slate-300">
                {JSON.stringify(detail, null, 2)}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function GuildImportHistoryPanel() {
  const [historyEndpoint, setHistoryEndpoint] = useState(DEFAULT_GUILD_IMPORT_HISTORY_ENDPOINT);
  const [history, setHistory] = useState<GuildImportHistoryItemDto[]>([]);
  const [selectedImportRunId, setSelectedImportRunId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<GuildImportHistoryDetailDto | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (preferredImportRunId?: string) => {
    setIsLoadingHistory(true);
    setError(null);

    try {
      const nextHistory = await fetchGuildImportHistory(historyEndpoint);
      setHistory(nextHistory);

      const storedImportRunId = readLastGuildImportRunId();
      const nextSelectedImportRunId = preferredImportRunId
        ?? storedImportRunId
        ?? nextHistory[0]?.importRunId
        ?? null;

      setSelectedImportRunId(nextSelectedImportRunId);

      if (nextSelectedImportRunId) {
        setIsLoadingDetail(true);
        try {
          const detail = await fetchGuildImportHistoryDetail(nextSelectedImportRunId, historyEndpoint);
          setSelectedDetail(detail);
          if (storedImportRunId === nextSelectedImportRunId) {
            clearLastGuildImportRunId();
          }
        } finally {
          setIsLoadingDetail(false);
        }
      } else {
        setSelectedDetail(null);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Falha inesperada ao carregar o histórico.",
      );
    } finally {
      setIsLoadingHistory(false);
    }
  }, [historyEndpoint]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const handleImportCompleted = (event: Event) => {
      const customEvent = event as CustomEvent<{ importRunId?: string }>;
      void loadHistory(customEvent.detail?.importRunId);
    };

    window.addEventListener(GUILD_IMPORT_COMPLETED_EVENT, handleImportCompleted as EventListener);

    return () => {
      window.removeEventListener(GUILD_IMPORT_COMPLETED_EVENT, handleImportCompleted as EventListener);
    };
  }, [loadHistory]);

  const handleSelectImport = async (importRunId: string) => {
    setSelectedImportRunId(importRunId);
    setIsLoadingDetail(true);
    setError(null);

    try {
      const detail = await fetchGuildImportHistoryDetail(importRunId, historyEndpoint);
      setSelectedDetail(detail);
      clearLastGuildImportRunId();
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Falha inesperada ao carregar os detalhes.",
      );
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-violet-500/30 bg-slate-900/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-2">
              <History className="h-5 w-5 text-violet-300" />
            </div>
            <div>
              <CardTitle className="text-white">Histórico de Importações</CardTitle>
              <CardDescription className="text-slate-300">
                Consulte as importações persistidas no backend Fastify. Cada execução mostra a visão consolidada salva, as fontes usadas na consolidação e a base que sincronizou as contas da guilda.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="history-endpoint" className="text-slate-200">
                Endpoint do histórico
              </Label>
              <Input
                id="history-endpoint"
                value={historyEndpoint}
                onChange={(event) => setHistoryEndpoint(event.target.value)}
                className="border-slate-700 bg-slate-800/70 text-slate-100"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={() => void loadHistory()}
                disabled={isLoadingHistory}
                className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white hover:from-violet-400 hover:to-fuchsia-500 lg:w-auto"
              >
                {isLoadingHistory ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Atualizar histórico
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Falha ao carregar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <HistorySummaryCards items={history} />

          <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <Card className="border border-slate-700/60 bg-slate-900/40">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-violet-300" />
                  <CardTitle className="text-base text-white">Execuções salvas</CardTitle>
                </div>
                <CardDescription className="text-slate-400">
                  Selecione uma importação para ver os detalhes, as fontes utilizadas e qual execução alimentou o estado atual da guilda.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[36rem] rounded-xl border border-slate-700/60 bg-slate-950/30 p-3">
                  <div className="space-y-2">
                    {history.length === 0 && !isLoadingHistory ? (
                      <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
                        Nenhuma importação encontrada ainda.
                      </div>
                    ) : (
                      history.map((item) => {
                        const isSelected = item.importRunId === selectedImportRunId;
                        return (
                          <button
                            key={item.importRunId}
                            type="button"
                            onClick={() => void handleSelectImport(item.importRunId)}
                            className={`w-full rounded-xl border p-4 text-left transition ${isSelected
                              ? "border-violet-500/50 bg-violet-500/10"
                              : "border-slate-800 bg-slate-900/70 hover:border-slate-600 hover:bg-slate-900"
                              }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {item.guildName || "Guilda não identificada"}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">{formatDateTime(item.importedAt)}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Guild ID {formatOptionalNumber(item.guildId)} • Wizard ID atual {formatOptionalNumber(item.currentUserWizardId)}
                                </p>
                              </div>
                              <Badge className="border-violet-500/30 bg-violet-500/15 text-violet-200">
                                {item.totalFilesRead} JSONs
                              </Badge>
                            </div>

                            <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                              <span>Membros: {item.membersSaved}</span>
                              <span>Ataques: {item.attacksSaved}</span>
                              <span>Defesas: {item.defensesSaved}</span>
                              <span>Times: {item.teamUsageSaved}</span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {isLoadingDetail && (
                <Card className="border border-slate-700/60 bg-slate-900/40">
                  <CardContent className="flex items-center gap-3 p-6 text-slate-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando detalhes da importação...
                  </CardContent>
                </Card>
              )}

              {!isLoadingDetail && selectedDetail && <HistoryDetailPanel detail={selectedDetail} />}

              {!isLoadingDetail && !selectedDetail && (
                <Card className="border border-dashed border-slate-700 bg-slate-900/20">
                  <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
                    <FileJson className="h-10 w-10 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-300">Selecione uma importação</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Os detalhes da visão consolidada e das fontes aparecem aqui.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GuildImportHistoryPanel;
