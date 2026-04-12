import {
  AlertCircle,
  CheckCircle2,
  Files,
  Layers3,
  Loader2,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import React, { useMemo, useState } from "react";

import {
  buildImportGuildFilesRequest,
  DEFAULT_GUILD_IMPORT_BATCH_BYTES,
  DEFAULT_GUILD_IMPORT_ENDPOINT,
  importGuildFilesInBatches,
  notifyGuildImportCompleted,
  splitUploadedGuildFilesIntoBatches,
  type BatchUploadProgress,
  type GuildImportPayloadPreviewDto,
  type GuildImportPreviewMemberDto,
  type GuildImportResultDto,
} from "../../lib/guildImport";
import { formatTeamLabel } from "../../lib/monsterCatalog";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatPercent = (value?: number) => `${(value ?? 0).toFixed(1)}%`;

const roleLabelMap: Record<string, string> = {
  leader: "Líder",
  "vice-leader": "Vice-líder",
  senior: "Sênior",
  member: "Membro",
};

const formatRoleLabel = (role?: string) => roleLabelMap[role ?? "member"] ?? "Membro";
const formatOptionalNumber = (value?: number) => (value !== undefined ? String(value) : "Não identificado");

const getBatchStatusLabel = (batchProgress: BatchUploadProgress) => {
  if (batchProgress.stage === "completed") {
    return "Todos os lotes concluídos";
  }

  if (batchProgress.stage === "preparing") {
    return "Preparando envio do lote";
  }

  return "Lote em processamento no backend";
};

function MemberPreviewCard({ member }: { member: GuildImportPreviewMemberDto }) {
  const topGuildWarTeam = member.guildWar.teams[0];
  const topSiegeTeam = member.siege.teams[0];
  const activeCoverage = Object.entries(member.coverage).filter(([, enabled]) => enabled);

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-semibold text-white">{member.member.wizardName}</h4>
        {member.member.isCurrentUser && (
          <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-200">Você</Badge>
        )}
        {member.member.guildRole && (
          <Badge className="border-sky-500/30 bg-sky-500/15 text-sky-200">
            {formatRoleLabel(member.member.guildRole)}
          </Badge>
        )}
        {member.labyrinth.isMvp && (
          <Badge className="border-blue-500/30 bg-blue-500/15 text-blue-200">MVP Lab</Badge>
        )}
      </div>

      <div className="grid gap-3 text-xs text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-slate-500">Guild War</p>
          <p>{member.guildWar.attacks.length} ataques</p>
          <p>{member.guildWar.defenses.length} defesas</p>
        </div>
        <div>
          <p className="text-slate-500">Siege</p>
          <p>{member.siege.attacks.length} ataques</p>
          <p>{member.siege.defenses.length} defesas</p>
        </div>
        <div>
          <p className="text-slate-500">Labirinto</p>
          <p>Score: {member.labyrinth.score ?? 0}</p>
          <p>Rank: {member.labyrinth.rank ?? "-"}</p>
        </div>
        <div>
          <p className="text-slate-500">Subjugação</p>
          <p>Score: {member.subjugation.clearScore ?? 0}</p>
          <p>Rank: {member.subjugation.rank ?? "-"}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
          <p className="mb-1 text-xs font-medium text-slate-400">Melhor time GW</p>
          {topGuildWarTeam ? (
            <>
              <p className="text-sm text-white">{formatTeamLabel(topGuildWarTeam.team)}</p>
              <p className="text-xs text-slate-400">
                {topGuildWarTeam.totalBattles} usos • WR {formatPercent(topGuildWarTeam.winRate)}
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-500">Sem dados de time</p>
          )}
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
          <p className="mb-1 text-xs font-medium text-slate-400">Melhor time Siege</p>
          {topSiegeTeam ? (
            <>
              <p className="text-sm text-white">{formatTeamLabel(topSiegeTeam.team)}</p>
              <p className="text-xs text-slate-400">
                {topSiegeTeam.totalBattles} usos • WR {formatPercent(topSiegeTeam.winRate)}
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-500">Sem dados de time</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {activeCoverage.length === 0 ? (
          <span className="text-xs text-slate-500">Sem cobertura detectada.</span>
        ) : (
          activeCoverage.map(([key]) => (
            <Badge key={key} className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
              {key}
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}

function ImportPreview({ payload }: { payload: GuildImportPayloadPreviewDto }) {
  return (
    <Card className="border-2 border-sky-500/30 bg-slate-900/60 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-2">
            <ShieldCheck className="h-5 w-5 text-sky-300" />
          </div>
          <div>
            <CardTitle className="text-white">Prévia do retorno consolidado</CardTitle>
            <CardDescription className="text-slate-300">
              Visualização dos dados que voltaram do backend após a consolidação.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/60">
            <TabsTrigger value="overview">Resumo</TabsTrigger>
            <TabsTrigger value="members">Membros</TabsTrigger>
            <TabsTrigger value="sources">Fontes</TabsTrigger>
            <TabsTrigger value="raw">JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Guilda</p>
                <p className="text-sm font-semibold text-white">{payload.snapshot.guildName ?? "Não identificada"}</p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Guild ID</p>
                <p className="text-sm font-semibold text-white">
                  {formatOptionalNumber(payload.snapshot.guildId)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Wizard ID atual</p>
                <p className="text-sm font-semibold text-white">
                  {formatOptionalNumber(payload.snapshot.currentUserWizardId)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Membros</p>
                <p className="text-sm font-semibold text-white">{payload.members.length}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Ataques</p>
                <p className="text-sm font-semibold text-white">{payload.attacks.length}</p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Defesas</p>
                <p className="text-sm font-semibold text-white">{payload.defenses.length}</p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Composições rastreadas</p>
                <p className="text-sm font-semibold text-white">{payload.teamUsage.length}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 text-sm text-slate-300">
              <p>
                <span className="text-slate-400">Gerado em:</span>{" "}
                {new Date(payload.snapshot.generatedAt).toLocaleString()}
              </p>
              <p>
                <span className="text-slate-400">Origem:</span> {payload.importRun.sourceFolder}
              </p>
              <p>
                <span className="text-slate-400">Regra de consolidação:</span>{" "}
                {payload.snapshot.mergePolicy.duplicateResolution}
              </p>
              <p className="mt-2 text-xs text-slate-500">{payload.snapshot.mergePolicy.notes}</p>
            </div>
          </TabsContent>

          <TabsContent value="members">
            <ScrollArea className="h-[30rem] rounded-xl border border-slate-700/60 bg-slate-950/30 p-4">
              <div className="space-y-3">
                {payload.members.map((member) => (
                  <MemberPreviewCard key={member.wizardId} member={member} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sources">
            <ScrollArea className="h-[30rem] rounded-xl border border-slate-700/60 bg-slate-950/30 p-4">
              <div className="space-y-2">
                {payload.importSources.map((source) => (
                  <div
                    key={`${source.priorityOrder}-${source.fileName}`}
                    className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-white">{source.fileName}</p>
                      <Badge className="border-sky-500/30 bg-sky-500/15 text-sky-200">{source.command}</Badge>
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
            <ScrollArea className="h-[30rem] rounded-xl border border-slate-700/60 bg-slate-950/30 p-4">
              <pre className="whitespace-pre-wrap break-words text-xs text-slate-300">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function GuildImportPanel() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sourceLabel, setSourceLabel] = useState("upload://frontend");
  const [endpoint, setEndpoint] = useState(DEFAULT_GUILD_IMPORT_ENDPOINT);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<GuildImportResultDto | null>(null);
  const [payloadPreview, setPayloadPreview] = useState<GuildImportPayloadPreviewDto | null>(null);
  const [batchProgress, setBatchProgress] = useState<BatchUploadProgress | null>(null);

  const fileSummary = useMemo(() => {
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const jsonFiles = selectedFiles.filter((file) => file.name.toLowerCase().endsWith(".json"));
    const estimatedBatches = Math.max(1, Math.ceil(totalSize / DEFAULT_GUILD_IMPORT_BATCH_BYTES));

    return {
      totalSize,
      jsonCount: jsonFiles.length,
      estimatedBatches,
    };
  }, [selectedFiles]);

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    setSelectedFiles(nextFiles);
    setUploadError(null);
    setUploadResult(null);
    setPayloadPreview(null);
    setBatchProgress(null);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadError("Selecione ao menos um arquivo JSON antes de enviar.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);
    setPayloadPreview(null);
    setBatchProgress(null);

    try {
      const request = await buildImportGuildFilesRequest(selectedFiles, sourceLabel);
      const plannedBatches = splitUploadedGuildFilesIntoBatches(request.files, DEFAULT_GUILD_IMPORT_BATCH_BYTES);

      const batchResult = await importGuildFilesInBatches(
        request,
        endpoint,
        DEFAULT_GUILD_IMPORT_BATCH_BYTES,
        (progress) => setBatchProgress(progress),
      );

      const successfulResponses = batchResult.responses.filter((response) => response.result);
      const lastResponse = successfulResponses[successfulResponses.length - 1];

      if (!lastResponse?.result) {
        throw new Error("A API respondeu sem o resumo da importação.");
      }

      const aggregatedResult: GuildImportResultDto = {
        ...lastResponse.result,
        importRun: {
          ...lastResponse.result.importRun,
          totalFilesRead: successfulResponses.reduce(
            (sum, response) => sum + (response.result?.importRun.totalFilesRead ?? 0),
            0,
          ),
        },
        sourcesSaved: successfulResponses.reduce((sum, response) => sum + (response.result?.sourcesSaved ?? 0), 0),
        membersSaved: lastResponse.result.membersSaved,
        attacksSaved: successfulResponses.reduce((sum, response) => sum + (response.result?.attacksSaved ?? 0), 0),
        defensesSaved: successfulResponses.reduce((sum, response) => sum + (response.result?.defensesSaved ?? 0), 0),
        teamUsageSaved: successfulResponses.reduce((sum, response) => sum + (response.result?.teamUsageSaved ?? 0), 0),
        authSync: successfulResponses.reduce(
          (accumulator, response) => ({
            upserted: accumulator.upserted + (response.result?.authSync?.upserted ?? 0),
            removed: accumulator.removed + (response.result?.authSync?.removed ?? 0),
            defaultPasswordApplied:
              accumulator.defaultPasswordApplied || Boolean(response.result?.authSync?.defaultPasswordApplied),
          }),
          {
            upserted: 0,
            removed: 0,
            defaultPasswordApplied: false,
          },
        ),
      };

      setUploadResult(aggregatedResult);
      setPayloadPreview(lastResponse.payload ?? null);
      notifyGuildImportCompleted({
        importRunId: lastResponse.result.importRun.id,
        snapshotId: lastResponse.result.snapshot.id,
        importedAt: lastResponse.result.importRun.importedAt,
        guildId: lastResponse.result.snapshot.guildId,
        guildName: lastResponse.result.snapshot.guildName,
      });

      if (plannedBatches.length <= 1) {
        setBatchProgress({
          batchIndex: 1,
          totalBatches: 1,
          filesInBatch: request.files.length,
          batchFileNames: request.files.map((file) => file.fileName),
          completedFiles: request.files.length,
          completedFileNames: request.files.map((file) => file.fileName),
          stage: "completed",
        });
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Falha inesperada durante o upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const progressValue = selectedFiles.length > 0 ? (fileSummary.jsonCount / selectedFiles.length) * 100 : 0;
  const batchProgressValue = batchProgress
    ? (batchProgress.completedFiles / Math.max(fileSummary.jsonCount, 1)) * 100
    : 0;

  return (
    <div className="space-y-6">
      <Card className="mb-0 border-2 border-amber-500/30 bg-slate-900/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-2">
              <UploadCloud className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <CardTitle className="text-white">Importar JSONs da guilda</CardTitle>
              <CardDescription className="text-slate-300">
                Selecione os arquivos exportados na sua máquina e envie para o backend consolidar. A importação é a fonte de verdade dos dados e também sincroniza automaticamente as contas de acesso da guilda.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guild-json-files" className="text-slate-200">
                Arquivos JSON
              </Label>
              <Input
                id="guild-json-files"
                type="file"
                multiple
                accept=".json,application/json"
                onChange={handleFilesChange}
                className="border-slate-700 bg-slate-800/70 text-slate-100 file:mr-4 file:rounded-md file:border-0 file:bg-amber-500/20 file:px-3 file:py-2 file:text-amber-200"
              />
              <p className="text-xs text-slate-400">
                O navegador lê os arquivos locais e envia apenas o conteúdo para a API. Nenhum caminho local da sua máquina é enviado.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="source-label" className="text-slate-200">
                  Source label
                </Label>
                <Input
                  id="source-label"
                  value={sourceLabel}
                  onChange={(event) => setSourceLabel(event.target.value)}
                  className="border-slate-700 bg-slate-800/70 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="import-endpoint" className="text-slate-200">
                  Endpoint da API
                </Label>
                <Input
                  id="import-endpoint"
                  value={endpoint}
                  onChange={(event) => setEndpoint(event.target.value)}
                  className="border-slate-700 bg-slate-800/70 text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Files className="h-4 w-4 text-amber-300" />
                  <span className="text-sm font-medium text-white">Arquivos selecionados</span>
                </div>
                <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-200">
                  {fileSummary.jsonCount} JSONs
                </Badge>
              </div>

              <Progress value={progressValue} className="mb-3 bg-slate-700 [&_[data-slot=progress-indicator]]:bg-amber-500" />

              <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-400">
                <span>Total selecionado: {selectedFiles.length}</span>
                <span>Tamanho: {formatBytes(fileSummary.totalSize)}</span>
                <span>Lotes estimados: {fileSummary.estimatedBatches}</span>
              </div>

              <ScrollArea className="h-44 rounded-lg border border-slate-700/60 bg-slate-950/40 p-3">
                <div className="space-y-2">
                  {selectedFiles.length === 0 ? (
                    <p className="text-sm text-slate-500">Nenhum arquivo selecionado ainda.</p>
                  ) : (
                    selectedFiles.map((file) => (
                      <div
                        key={`${file.name}-${file.size}`}
                        className="flex items-center justify-between gap-3 rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-slate-100">{file.name}</p>
                          <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                        </div>
                        <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-200">
                          JSON
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
              <h3 className="mb-3 text-sm font-medium text-white">Ações</h3>
              <div className="space-y-3">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || fileSummary.jsonCount === 0}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 hover:from-amber-400 hover:to-orange-500"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando em lotes...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Enviar para o backend
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800"
                  onClick={() => {
                    setSelectedFiles([]);
                    setUploadError(null);
                    setUploadResult(null);
                    setPayloadPreview(null);
                    setBatchProgress(null);
                  }}
                  disabled={isUploading}
                >
                  Limpar seleção
                </Button>
              </div>
            </div>
          </div>

          <Alert className="border-cyan-500/30 bg-cyan-500/10 text-cyan-50">
            <Layers3 className="h-4 w-4 text-cyan-300" />
            <AlertTitle>Envio em lotes</AlertTitle>
            <AlertDescription>
              Quando o conjunto fica grande, o front divide automaticamente o upload. Cada lote vira uma importação separada no histórico, mas o estado atual e a sincronização das contas continuam sendo atualizados a cada envio concluído.
            </AlertDescription>
          </Alert>

          {batchProgress && (
            <Card className="border-slate-700/60 bg-slate-900/40">
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-200">
                  <span>Lote {batchProgress.batchIndex} de {batchProgress.totalBatches}</span>
                  <span>{getBatchStatusLabel(batchProgress)}</span>
                </div>
                <Progress value={batchProgressValue} className="bg-slate-700 [&_[data-slot=progress-indicator]]:bg-cyan-500" />
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-slate-700/60 bg-slate-950/40 p-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-cyan-200">
                      Arquivos do lote atual ({batchProgress.filesInBatch})
                    </p>
                    <ScrollArea className="h-32 pr-3">
                      <div className="space-y-2 text-xs text-slate-300">
                        {batchProgress.batchFileNames.map((fileName) => (
                          <div key={`current-${fileName}`} className="rounded-md border border-slate-800 bg-slate-900/70 px-2 py-1">
                            {fileName}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  <div className="rounded-lg border border-slate-700/60 bg-slate-950/40 p-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-emerald-200">
                      Arquivos concluídos ({batchProgress.completedFiles})
                    </p>
                    <ScrollArea className="h-32 pr-3">
                      <div className="space-y-2 text-xs text-slate-300">
                        {batchProgress.completedFileNames.length === 0 ? (
                          <p className="text-slate-500">Nenhum lote concluído ainda.</p>
                        ) : (
                          batchProgress.completedFileNames.map((fileName) => (
                            <div
                              key={`done-${fileName}`}
                              className="rounded-md border border-emerald-900/40 bg-emerald-500/10 px-2 py-1 text-emerald-100"
                            >
                              {fileName}
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {uploadError && (
            <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Falha no upload</AlertTitle>
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          {uploadResult && (
            <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              <AlertTitle>Importação concluída</AlertTitle>
              <AlertDescription>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <span>Arquivos: {uploadResult.importRun.totalFilesRead}</span>
                  <span>Membros: {uploadResult.membersSaved}</span>
                  <span>Ataques: {uploadResult.attacksSaved}</span>
                  <span>Defesas: {uploadResult.defensesSaved}</span>
                  <span>Times: {uploadResult.teamUsageSaved}</span>
                  <span>Fontes: {uploadResult.sourcesSaved}</span>
                  <span>Guild ID: {formatOptionalNumber(uploadResult.snapshot.guildId)}</span>
                  <span>Wizard ID atual: {formatOptionalNumber(uploadResult.snapshot.currentUserWizardId)}</span>
                  <span>Contas sincronizadas: {uploadResult.authSync?.upserted ?? 0}</span>
                  <span>Contas removidas: {uploadResult.authSync?.removed ?? 0}</span>
                </div>
                <div className="mt-2 text-xs text-emerald-100/80">
                  Última visão consolidada: {uploadResult.snapshot.guildName ?? "Guilda não identificada"} em {new Date(uploadResult.snapshot.generatedAt).toLocaleString()}
                </div>
                {uploadResult.authSync && (
                  <div className="mt-1 text-xs text-emerald-100/80">
                    As contas de acesso foram sincronizadas a partir do roster importado, usando o cargo atual na guilda e a senha padrão de importação.
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {payloadPreview && <ImportPreview payload={payloadPreview} />}
    </div>
  );
}

export default GuildImportPanel;
