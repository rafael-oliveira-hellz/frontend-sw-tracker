import type {
  GuildWeeklyPunishmentDto,
  WeeklyPunishmentEventKey,
} from "../../lib/guildImport";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";

export type DisciplineState = "punished" | "cooldown" | "clear";

type DisciplineLabels = {
  punished: string;
  cooldown: string;
  clear: string;
};

const defaultLabels: DisciplineLabels = {
  punished: "Suspenso",
  cooldown: "Suspenso",
  clear: "Liberado",
};

export function resolveDisciplineState(
  punishment?: GuildWeeklyPunishmentDto | null,
  eventKey?: WeeklyPunishmentEventKey,
): DisciplineState {
  if (!punishment) {
    return "clear";
  }

  if (eventKey) {
    const event = punishment.events.find((entry) => entry.eventKey === eventKey);
    if (event?.punishmentApplied) {
      return "punished";
    }
  } else if (punishment.punishmentApplied) {
    return "punished";
  }

  if (punishment.cooldownActive) {
    return "cooldown";
  }

  return "clear";
}

export function resolveDisciplineCopy(
  punishment?: GuildWeeklyPunishmentDto | null,
  options?: {
    eventKey?: WeeklyPunishmentEventKey;
    labels?: Partial<DisciplineLabels>;
  },
) {
  const state = resolveDisciplineState(punishment, options?.eventKey);
  const labels = {
    ...defaultLabels,
    ...options?.labels,
  };

  return {
    state,
    label:
      state === "punished"
        ? labels.punished
        : state === "cooldown"
          ? labels.cooldown
          : labels.clear,
    reasonSummary: punishment?.reasonSummary ?? "",
  };
}

export function DisciplineStatus({
  punishment,
  eventKey,
  labels,
  showReason = false,
  hideWhenClear = false,
  className,
  reasonClassName,
}: {
  punishment?: GuildWeeklyPunishmentDto | null;
  eventKey?: WeeklyPunishmentEventKey;
  labels?: Partial<DisciplineLabels>;
  showReason?: boolean;
  hideWhenClear?: boolean;
  className?: string;
  reasonClassName?: string;
}) {
  const status = resolveDisciplineCopy(punishment, { eventKey, labels });

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
