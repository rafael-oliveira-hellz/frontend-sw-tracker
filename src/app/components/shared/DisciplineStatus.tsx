import type {
  GuildWeeklyPunishmentDto,
  WeeklyPunishmentEventKey,
} from "../../lib/guildImport";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";

export type DisciplineState = "punished" | "cooldown" | "clear";
type DisciplineMode = "current" | "record";

type DisciplineLabels = {
  punished: string;
  cooldown: string;
  clear: string;
};

const defaultLabels: DisciplineLabels = {
  punished: "Suspenso",
  cooldown: "Em suspensão",
  clear: "Liberado",
};

const isSuspensionActiveNow = (punishment?: GuildWeeklyPunishmentDto | null) => {
  if (!punishment?.nextEligiblePenaltyAt) {
    return false;
  }

  return new Date(punishment.nextEligiblePenaltyAt).getTime() > Date.now();
};

const normalizeDisciplineText = (value?: string) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const indicatesWeeklySuspension = (
  eventKey: WeeklyPunishmentEventKey | undefined,
  value?: string,
) => {
  if (eventKey !== "guildWar" && eventKey !== "siege") {
    return false;
  }

  const normalized = normalizeDisciplineText(value);

  return (
    (eventKey === "guildWar" &&
      (normalized.includes("suspenso de gw") ||
        normalized.includes("suspenso em gw") ||
        normalized.includes("gw bloqueada por castigo"))) ||
    (eventKey === "siege" &&
      (normalized.includes("suspenso de siege") ||
        normalized.includes("suspenso em assalto") ||
        normalized.includes("assalto bloqueado por castigo"))) ||
    normalized.includes("punicao da semana anterior")
  );
};

export function resolveDisciplineState(
  punishment?: GuildWeeklyPunishmentDto | null,
  eventKey?: WeeklyPunishmentEventKey,
  mode: DisciplineMode = "current",
): DisciplineState {
  if (!punishment) {
    return "clear";
  }

  const suspensionActive = mode === "record" ? true : isSuspensionActiveNow(punishment);

  if (eventKey) {
    const event = punishment.events.find((entry) => entry.eventKey === eventKey);
    if (event?.punishmentApplied && suspensionActive) {
      return "punished";
    }

    if (
      suspensionActive &&
      ((event && !event.required && indicatesWeeklySuspension(eventKey, event.reason)) ||
        indicatesWeeklySuspension(eventKey, punishment.reasonSummary))
    ) {
      return "punished";
    }
  } else if (punishment.punishmentApplied && suspensionActive) {
    return "punished";
  }

  if (punishment.cooldownActive && suspensionActive) {
    return "cooldown";
  }

  return "clear";
}

export function resolveDisciplineCopy(
  punishment?: GuildWeeklyPunishmentDto | null,
  options?: {
    eventKey?: WeeklyPunishmentEventKey;
    labels?: Partial<DisciplineLabels>;
    mode?: DisciplineMode;
  },
) {
  const state = resolveDisciplineState(punishment, options?.eventKey, options?.mode);
  const labels = {
    ...defaultLabels,
    ...options?.labels,
  };
  const eventReason = options?.eventKey
    ? punishment?.events.find((entry) => entry.eventKey === options.eventKey)?.reason
    : undefined;

  return {
    state,
    label:
      state === "punished"
        ? labels.punished
        : state === "cooldown"
          ? labels.cooldown
          : labels.clear,
    reasonSummary: eventReason ?? punishment?.reasonSummary ?? "",
  };
}

export function DisciplineStatus({
  punishment,
  eventKey,
  labels,
  mode,
  showReason = false,
  hideWhenClear = false,
  className,
  reasonClassName,
}: {
  punishment?: GuildWeeklyPunishmentDto | null;
  eventKey?: WeeklyPunishmentEventKey;
  labels?: Partial<DisciplineLabels>;
  mode?: DisciplineMode;
  showReason?: boolean;
  hideWhenClear?: boolean;
  className?: string;
  reasonClassName?: string;
}) {
  const status = resolveDisciplineCopy(punishment, { eventKey, labels, mode });

  if (hideWhenClear && status.state === "clear") {
    return null;
  }

  const badgeClassName =
    status.state === "punished"
      ? "clandestino-badge clandestino-badge--danger"
      : status.state === "cooldown"
        ? "clandestino-badge clandestino-badge--warning"
        : "clandestino-badge clandestino-badge--success";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Badge className={badgeClassName}>{status.label}</Badge>
      {showReason && status.reasonSummary ? (
        <span className={cn("text-xs text-slate-400", reasonClassName)}>{status.reasonSummary}</span>
      ) : null}
    </div>
  );
}
