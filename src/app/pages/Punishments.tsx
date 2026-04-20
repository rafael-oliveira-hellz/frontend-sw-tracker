import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  FileDown,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  ShieldMinus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { DisciplineStatus } from "../components/shared/DisciplineStatus";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useData } from "../context/DataContext";
import {
  fetchGuildWeeklyPunishments,
  runGuildWeeklyPunishmentEvaluation,
  type GuildWeeklyPunishmentDto,
} from "../lib/guildImport";

const roleLabelMap: Record<string, string> = {
  leader: "Líder",
  "vice-leader": "Vice-líder",
  senior: "Sênior",
  member: "Membro",
};

const eventLabelMap: Record<string, string> = {
  guildWar: "GW",
  siege: "Siege",
  guildWarDefenseSetup: "Setup GW",
  siegeDefenseSetup: "Setup Siege",
  guildWarDefenseCompliance: "Alerta GW",
  siegeDefenseCompliance: "Alerta Siege",
  labyrinth: "Labirinto",
  subjugation: "Subjugação",
};

const cleanMojibake = (value?: string) =>
  (value ?? "")
    .replaceAll("ÃƒÂ§", "ç")
    .replaceAll("ÃƒÂ£", "ã")
    .replaceAll("ÃƒÂ¡", "á")
    .replaceAll("ÃƒÂ©", "é")
    .replaceAll("ÃƒÂª", "ê")
    .replaceAll("ÃƒÂ­", "í")
    .replaceAll("ÃƒÂ³", "ó")
    .replaceAll("ÃƒÂµ", "õ")
    .replaceAll("ÃƒÂº", "ú")
    .replaceAll("Ãƒâ€¡", "Ç")
    .replaceAll("Ã¢â‚¬Â¢", "•")
    .replaceAll("Ã§", "ç")
    .replaceAll("Ã£", "ã")
    .replaceAll("Ã¡", "á")
    .replaceAll("Ã©", "é")
    .replaceAll("Ãª", "ê")
    .replaceAll("Ã­", "í")
    .replaceAll("Ã³", "ó")
    .replaceAll("Ãµ", "õ")
    .replaceAll("Ãº", "ú")
    .replaceAll("Ã‡", "Ç")
    .replaceAll("â€¢", "•");

const formatRole = (role?: string) => roleLabelMap[role ?? "member"] ?? "Membro";

const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      })
    : "Não informado";

const formatStoredWeekDate = (value?: string) => {
  if (!value) {
    return "--/--";
  }

  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}`;
};

const formatWeekLabel = (punishment: GuildWeeklyPunishmentDto) =>
  `${formatStoredWeekDate(punishment.weekStart)} a ${formatStoredWeekDate(punishment.weekEnd)}`;

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const sanitizeFileName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "-")
    .replace(/_+/g, "_")
    .replace(/^[-_.]+|[-_.]+$/g, "");

export default function Punishments() {
  const { userData, isAdmin, accessToken } = useData();
  const [punishments, setPunishments] = useState<GuildWeeklyPunishmentDto[]>([]);
  const [selectedWeekKey, setSelectedWeekKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadPunishments = async (weekKey?: string) => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const next = await fetchGuildWeeklyPunishments(accessToken, weekKey);
      setPunishments(next);
      if (!selectedWeekKey && next[0]?.weekKey) {
        setSelectedWeekKey(next[0].weekKey);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar as punições.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPunishments();
  }, [accessToken]);

  useEffect(() => {
    if (!selectedWeekKey) {
      return;
    }

    void loadPunishments(selectedWeekKey);
  }, [selectedWeekKey]);

  const availableWeekKeys = useMemo(
    () => [...new Set(punishments.map((punishment) => punishment.weekKey))],
    [punishments],
  );

  const visiblePunishments = useMemo(
    () =>
      selectedWeekKey
        ? punishments.filter((punishment) => punishment.weekKey === selectedWeekKey)
        : punishments,
    [punishments, selectedWeekKey],
  );

  const summary = useMemo(
    () =>
      visiblePunishments.reduce(
        (accumulator, punishment) => {
          accumulator.total += 1;
          if (punishment.punishmentApplied) {
            accumulator.punished += 1;
          } else if (punishment.cooldownActive) {
            accumulator.cooldown += 1;
          } else {
            accumulator.clear += 1;
          }
          if (punishment.markedForRemoval) {
            accumulator.markedForRemoval += 1;
          }
          return accumulator;
        },
        { total: 0, punished: 0, cooldown: 0, clear: 0, markedForRemoval: 0 },
      ),
    [visiblePunishments],
  );

  const punishedThisWeek = useMemo(
    () => visiblePunishments.filter((punishment) => punishment.punishmentApplied),
    [visiblePunishments],
  );

  const handleRunEvaluation = async () => {
    if (!accessToken) {
      return;
    }

    setIsRunning(true);
    setError(null);
    setMessage(null);

    try {
      const run = await runGuildWeeklyPunishmentEvaluation(accessToken);
      setSelectedWeekKey(run.weekKey);
      await loadPunishments(run.weekKey);
      setMessage(
        run.skipped
          ? `Avaliação semanal verificada: ${cleanMojibake(run.reason)}`
          : `Avaliação semanal concluída para ${run.weekKey}. ${run.saved} registro(s) persistido(s).`,
      );
    } catch (runError) {
      setError(
        runError instanceof Error
          ? runError.message
          : "Falha ao executar a avaliação semanal de punições.",
      );
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportPdf = () => {
    if (punishedThisWeek.length === 0) {
      setError("Não há membros punidos na semana selecionada para exportar.");
      return;
    }

    const weekLabel = formatWeekLabel(punishedThisWeek[0]);
    const fileTitle = sanitizeFileName(`CD9_lista_punidos_semana_${punishedThisWeek[0].weekKey}`);
    const rows = punishedThisWeek
      .map((punishment) => {
        const punishedEvents = punishment.punishedEventKeys.length
          ? punishment.punishedEventKeys
              .map((eventKey) => eventLabelMap[eventKey] ?? eventKey)
              .join(" • ")
          : "Nenhum";
        const details = punishment.events
          .filter((event) => event.punishmentApplied)
          .map(
            (event) => `
                <tr>
                  <td>${escapeHtml(cleanMojibake(event.label))}</td>
                  <td>${event.completed}/${event.expected}</td>
                  <td>${escapeHtml(cleanMojibake(event.reason))}</td>
                </tr>
              `,
          )
          .join("");

        return `
          <section class="card">
            <div class="card-header">
              <div>
                <h2>${escapeHtml(punishment.memberName)}</h2>
                <p class="muted">Punido na semana ${escapeHtml(weekLabel)}</p>
              </div>
              <div class="pill">${escapeHtml(formatRole(punishment.role))}</div>
            </div>

            <div class="facts">
              <div class="fact">
                <span class="fact-label">Conteúdos</span>
                <span class="fact-value">${escapeHtml(punishedEvents)}</span>
              </div>
              <div class="fact">
                <span class="fact-label">Avaliado em</span>
                <span class="fact-value">${escapeHtml(formatDateTime(punishment.evaluatedAt))}</span>
              </div>
              <div class="fact">
                <span class="fact-label">Próxima elegibilidade</span>
                <span class="fact-value">${escapeHtml(
                  punishment.nextEligiblePenaltyAt
                    ? formatDateTime(punishment.nextEligiblePenaltyAt)
                    : "Sem bloqueio de carência",
                )}</span>
              </div>
            </div>

            <div class="summary-box">
              <div class="summary-title">Resumo</div>
              <p>${escapeHtml(cleanMojibake(punishment.reasonSummary))}</p>
              ${
                punishment.removalReasonSummary
                  ? `<p class="removal"><strong>Remoção:</strong> ${escapeHtml(cleanMojibake(punishment.removalReasonSummary))}</p>`
                  : ""
              }
            </div>

            <table>
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Status</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>${details}</tbody>
            </table>
          </section>
        `;
      })
      .join("");

    const printableHtml = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" /><meta name="viewport" content="width=1024, initial-scale=1" /><title>${escapeHtml(fileTitle)}</title></head><body><main><h1>Lista de punidos da semana</h1><p>Semana ${escapeHtml(weekLabel)} • ${punishedThisWeek.length} membro(s)</p>${rows}</main></body></html>`;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const iframeDocument = iframe.contentWindow?.document;
    if (!iframeDocument || !iframe.contentWindow) {
      iframe.remove();
      setError("Não foi possível preparar a impressão do PDF.");
      return;
    }

    iframeDocument.open();
    iframeDocument.write(printableHtml);
    iframeDocument.close();

    iframe.onload = () => {
      const frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        return;
      }
      frameWindow.onafterprint = () => window.setTimeout(() => iframe.remove(), 1000);
      frameWindow.focus();
      frameWindow.print();
    };
  };

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
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/admin">
            <Button variant="ghost" className="text-slate-300 hover:bg-slate-800 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao admin
            </Button>
          </Link>

          <div className="clandestino-toolbar">
            <Button
              type="button"
              onClick={() => void handleRunEvaluation()}
              disabled={isRunning || !accessToken}
              className="clandestino-action-button border-red-500/40 bg-gradient-to-b from-red-900/95 to-rose-950/95 !text-red-50 hover:border-red-400/70 hover:from-red-800 hover:to-rose-900"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Avaliando
                </>
              ) : (
                <>
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Rodar avaliação semanal
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={() => void loadPunishments(selectedWeekKey)}
              disabled={isLoading || !accessToken}
              className="clandestino-action-button clandestino-action-button--refresh !text-cyan-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Atualizar punições
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleExportPdf}
              disabled={punishedThisWeek.length === 0}
              className="clandestino-action-button border-amber-500/40 bg-gradient-to-b from-amber-900/95 to-orange-950/95 !text-amber-50 hover:border-amber-400/70 hover:from-amber-800 hover:to-orange-900"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exportar em PDF
            </Button>
          </div>
        </div>

        <Card className="border-2 border-red-500/30 bg-slate-900/60 backdrop-blur-sm">
          <CardHeader>
            <div className="clandestino-page-header">
              <div className="clandestino-page-header__eyebrow">Disciplina semanal</div>
              <CardTitle className="clandestino-page-header__title text-white">Punições e carência</CardTitle>
              <CardDescription className="clandestino-page-header__description text-slate-300">
                Esta página mostra o registro histórico da semana avaliada. Aqui a liderança vê quem foi
                punido naquela semana, quem estava em carência naquela mesma semana e quais conteúdos
                causaram o bloqueio.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-5">
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                <p className="text-xs text-slate-400">Membros avaliados</p>
                <p className="text-lg font-semibold text-white">{summary.total}</p>
              </div>
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <p className="text-xs text-red-200">Punidos na semana</p>
                <p className="text-lg font-semibold text-white">{summary.punished}</p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-xs text-amber-200">Em carência na semana</p>
                <p className="text-lg font-semibold text-white">{summary.cooldown}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="text-xs text-emerald-200">Sem punição</p>
                <p className="text-lg font-semibold text-white">{summary.clear}</p>
              </div>
              <div className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-4">
                <p className="text-xs text-fuchsia-200">Marcados para remoção</p>
                <p className="text-lg font-semibold text-white">{summary.markedForRemoval}</p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[18rem_1fr]">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Semana avaliada</p>
                <Select value={selectedWeekKey} onValueChange={setSelectedWeekKey}>
                  <SelectTrigger className="border-slate-700 bg-slate-800/70 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
                    {availableWeekKeys.length === 0 ? (
                      <SelectItem value="">Nenhuma avaliação disponível</SelectItem>
                    ) : (
                      availableWeekKeys.map((weekKey) => (
                        <SelectItem key={weekKey} value={weekKey}>
                          {weekKey}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-950/20 p-4 text-sm text-slate-300">
                Todo domingo às 22:00 de Brasília o backend avalia a participação da semana fechada.
                A partir de segunda às 12:00 de Brasília ele também avalia setup de defesa, exigindo
                5 defesas de GW e ao menos 3 de Siege. A suspensão semanal vale até sábado às 23:59.
              </div>
            </div>

            {error ? (
              <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Falha ao carregar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {message ? (
              <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-50">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                <AlertTitle>Avaliação concluída</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-3">
              {visiblePunishments.length === 0 ? (
                <Card className="border border-slate-700/60 bg-slate-900/50">
                  <CardContent className="pt-6 text-center text-slate-400">
                    Nenhuma punição semanal foi registrada ainda. Rode a avaliação manual ou aguarde
                    as janelas automáticas de domingo às 22:00 e segunda às 12:00.
                  </CardContent>
                </Card>
              ) : (
                visiblePunishments.map((punishment) => (
                  <Card
                    key={`${punishment.weekKey}-${punishment.wizardId}`}
                    className="border border-slate-700/60 bg-slate-900/50"
                  >
                    <CardContent className="space-y-4 pt-6">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-white">{punishment.memberName}</p>
                            <Badge className="clandestino-badge border-sky-500/30 bg-sky-500/10 text-sky-200">
                              {formatRole(punishment.role)}
                            </Badge>
                            <DisciplineStatus
                              punishment={punishment}
                              mode="record"
                              labels={{
                                punished: "Punido na semana",
                                cooldown: "Em carência na semana",
                                clear: "Sem punição",
                              }}
                            />
                            {punishment.markedForRemoval ? (
                              <Badge className="border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-100">
                                Marcado para remoção
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-slate-400">
                            Semana {formatWeekLabel(punishment)} • avaliado em{" "}
                            {formatDateTime(punishment.evaluatedAt)}
                          </p>
                          <p className="text-sm text-slate-300">{cleanMojibake(punishment.reasonSummary)}</p>
                          {punishment.removalReasonSummary ? (
                            <p className="text-sm text-fuchsia-200">
                              {cleanMojibake(punishment.removalReasonSummary)}
                            </p>
                          ) : null}
                        </div>

                        <div className="rounded-xl border border-slate-700/60 bg-slate-950/30 p-4 text-sm text-slate-300 xl:min-w-72">
                          <div className="flex items-center gap-2 text-slate-200">
                            <CalendarDays className="h-4 w-4 text-cyan-300" />
                            <span className="font-medium">Próxima elegibilidade</span>
                          </div>
                          <p className="mt-2 text-white">
                            {punishment.nextEligiblePenaltyAt
                              ? formatDateTime(punishment.nextEligiblePenaltyAt)
                              : "Sem bloqueio de carência"}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            Conteúdos punidos:{" "}
                            {punishment.punishedEventKeys.length > 0
                              ? punishment.punishedEventKeys
                                  .map((eventKey) => eventLabelMap[eventKey] ?? eventKey)
                                  .join(" • ")
                              : "nenhum"}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {punishment.events.map((event) => (
                          <div
                            key={`${punishment.wizardId}-${event.eventKey}`}
                            className="rounded-xl border border-slate-700/60 bg-slate-950/30 p-4"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-white">
                                {cleanMojibake(event.label)}
                              </p>
                              {event.punishmentApplied ? (
                                <ShieldAlert className="h-4 w-4 text-red-300" />
                              ) : event.required ? (
                                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                              ) : (
                                <ShieldMinus className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                            <p className="mt-2 text-sm text-slate-300">
                              {event.completed}/{event.expected}
                            </p>
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              {cleanMojibake(event.reason)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
