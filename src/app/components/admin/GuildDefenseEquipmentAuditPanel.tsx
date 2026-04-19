import { AlertTriangle, Download, Shield, ShieldOff, Swords } from "lucide-react";
import { useMemo } from "react";

import type { DefenseDeckSummaryDto, GuildCurrentStateDto } from "../../lib/guildImport";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

const formatContextLabel = (context: DefenseDeckSummaryDto["context"]) =>
  context === "guildWar" ? "GvG" : "Siege";

const formatDefenseLocation = (defense: DefenseDeckSummaryDto) => {
  if (defense.context === "guildWar") {
    return `Rodada ${defense.round ?? "-"}`;
  }

  return `Base ${defense.assignedBase ?? "-"}`;
};

const exportEquipmentAlerts = (
  rows: Array<{
    memberName: string;
    role?: string;
    summary: string;
    contexts: string[];
    locations: string[];
    warningDeadlineAt?: string;
  }>,
) => {
  const header = [
    "Membro",
    "Cargo",
    "Problema",
    "Contextos",
    "Defesas afetadas",
    "Prazo para correcao",
  ];
  const body = rows.map((row) => [
    row.memberName,
    row.role ?? "",
    row.summary,
    row.contexts.join(" | "),
    row.locations.join(" | "),
    row.warningDeadlineAt
      ? new Date(row.warningDeadlineAt).toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
        })
      : "",
  ]);
  const csv = [header, ...body]
    .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `defesas-problematicas-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function GuildDefenseEquipmentAuditPanel({
  currentState,
}: {
  currentState: GuildCurrentStateDto | null;
}) {
  const equipmentOverview = useMemo(() => {
    if (!currentState) {
      return {
        affectedMembers: 0,
        incompleteDefenses: 0,
        flaggedIssues: 0,
        guildWarUnknown: 0,
        rows: [] as Array<{
          wizardId: number;
          memberName: string;
          role?: string;
          summary: string;
          contexts: string[];
          locations: string[];
          warningDeadlineAt?: string;
        }>,
      };
    }

    const warningDefenses = currentState.members.flatMap((member) =>
      [...member.guildWar.defenses, ...member.siege.defenses]
        .filter((defense) => defense.complianceAudit?.status === "warning")
        .map((defense) => ({
          wizardId: member.wizardId,
          memberName: member.member.wizardName,
          role: member.member.guildRole,
          contextLabel: formatContextLabel(defense.context),
          location: `${formatContextLabel(defense.context)} ${formatDefenseLocation(defense)}`,
          warningDeadlineAt: defense.complianceAudit?.warningDeadlineAt,
          issues: defense.complianceAudit?.issues ?? [],
        })),
    );

    const groupedIssues = new Map<
      string,
      {
        wizardId: number;
        memberName: string;
        role?: string;
        summary: string;
        contexts: Set<string>;
        locations: Set<string>;
        warningDeadlineAt?: string;
      }
    >();

    for (const defense of warningDefenses) {
      for (const issue of defense.issues) {
        const key = `${defense.wizardId}::${issue.code}::${issue.summary}`;
        const existing = groupedIssues.get(key);

        if (existing) {
          existing.contexts.add(defense.contextLabel);
          existing.locations.add(defense.location);
          if (
            defense.warningDeadlineAt &&
            (!existing.warningDeadlineAt ||
              new Date(defense.warningDeadlineAt).getTime() >
                new Date(existing.warningDeadlineAt).getTime())
          ) {
            existing.warningDeadlineAt = defense.warningDeadlineAt;
          }
          continue;
        }

        groupedIssues.set(key, {
          wizardId: defense.wizardId,
          memberName: defense.memberName,
          role: defense.role,
          summary: issue.summary,
          contexts: new Set([defense.contextLabel]),
          locations: new Set([defense.location]),
          warningDeadlineAt: defense.warningDeadlineAt,
        });
      }
    }

    const rows = [...groupedIssues.values()].map((row) => ({
      wizardId: row.wizardId,
      memberName: row.memberName,
      role: row.role,
      summary: row.summary,
      contexts: [...row.contexts],
      locations: [...row.locations],
      warningDeadlineAt: row.warningDeadlineAt,
    }));

    return {
      affectedMembers: new Set(rows.map((row) => row.wizardId)).size,
      incompleteDefenses: warningDefenses.length,
      flaggedIssues: rows.length,
      guildWarUnknown: currentState.members.reduce(
        (total, member) =>
          total +
          member.guildWar.defenses.filter(
            (defense) => defense.equipmentAudit?.status === "unknown",
          ).length,
        0,
      ),
      rows,
    };
  }, [currentState]);

  return (
    <Card className="border border-amber-500/30 bg-slate-900/50">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-white">Auditoria de runas e artefatos</CardTitle>
            <CardDescription className="text-slate-300">
              Lista administrativa das defesas com equipamento incompleto detectado no snapshot atual.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-100">
              {equipmentOverview.incompleteDefenses} defesa(s) com alerta
            </Badge>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-slate-700 bg-slate-950/40 text-slate-100 hover:bg-slate-800"
              onClick={() => exportEquipmentAlerts(equipmentOverview.rows)}
              disabled={equipmentOverview.rows.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar alertas
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Membros afetados</p>
            <p className="mt-2 text-2xl font-semibold text-white">{equipmentOverview.affectedMembers}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Defesas incompletas</p>
            <p className="mt-2 text-2xl font-semibold text-white">{equipmentOverview.incompleteDefenses}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Alertas consolidados</p>
            <p className="mt-2 text-2xl font-semibold text-white">{equipmentOverview.flaggedIssues}</p>
          </div>
        </div>

        <Alert className="border-slate-700/60 bg-slate-950/40 text-slate-200">
          <ShieldOff className="h-4 w-4" />
          <AlertTitle>Limite atual do export</AlertTitle>
          <AlertDescription>
            Siege traz contagem total de runas e artefatos por unidade, exibida como `x/6 runas` e
            `y/2 artefatos`. Em GvG, o export continua limitado, mas o sistema reaproveita o alerta
            quando o mesmo monstro tambem aparece incompleto em uma defesa de Siege do membro.
          </AlertDescription>
        </Alert>

        {equipmentOverview.guildWarUnknown > 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
            {equipmentOverview.guildWarUnknown} defesa(s) de GvG estao no snapshot sem resumo direto de
            equipamento no export atual.
          </div>
        ) : null}

        {equipmentOverview.rows.length === 0 ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm text-emerald-100">
            Nenhuma defesa com falta de runa ou artefato foi detectada no snapshot atual.
          </div>
        ) : (
          <div className="space-y-3">
            {equipmentOverview.rows.map((row) => (
              <div
                key={`${row.wizardId}-${row.summary}`}
                className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white">{row.memberName}</p>
                  {row.role ? (
                    <Badge className="border-slate-700 bg-slate-800/80 text-slate-200">{row.role}</Badge>
                  ) : null}
                  <Badge className="border-red-500/30 bg-red-500/10 text-red-100">
                    <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                    incompleto
                  </Badge>
                  {row.contexts.map((context) => (
                    <Badge
                      key={`${row.wizardId}-${row.summary}-${context}`}
                      className="border-slate-700 bg-slate-800/80 text-slate-200"
                    >
                      {context === "GvG" ? (
                        <Shield className="mr-1 h-3.5 w-3.5" />
                      ) : (
                        <Swords className="mr-1 h-3.5 w-3.5" />
                      )}
                      {context}
                    </Badge>
                  ))}
                </div>

                <p className="mt-3 text-sm text-slate-300">{row.summary}</p>
                <p className="mt-2 text-xs text-slate-400">Aparece em: {row.locations.join(" • ")}</p>
                {row.warningDeadlineAt ? (
                  <p className="mt-2 text-xs text-amber-200">
                    Prazo para correção:{" "}
                    {new Date(row.warningDeadlineAt).toLocaleString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                    })}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
