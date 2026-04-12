import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useGuildWeek } from "../../context/GuildWeekContext";
import {
  buildGuildCalendarMonth,
  guildCalendarWeekdays,
} from "../../lib/guildEventsCalendar";
import type { GuildCurrentStateDto } from "../../lib/guildImport";
import { getGuildActivityWeekOptions } from "../../lib/guildActivity";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const addMonths = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth() + amount, 1);

export default function GuildEventsCalendarPanel({ currentState }: { currentState: GuildCurrentStateDto | null }) {
  const { selectedWeekKey, setSelectedWeekKey } = useGuildWeek();
  const weekOptions = useMemo(
    () => getGuildActivityWeekOptions(currentState, "2026-04-05"),
    [currentState],
  );
  const selectedWeek = useMemo(
    () => weekOptions.find((week) => week.key === selectedWeekKey) ?? weekOptions[weekOptions.length - 1],
    [selectedWeekKey, weekOptions],
  );
  const [referenceDate, setReferenceDate] = useState(() => new Date());

  useEffect(() => {
    if (selectedWeek && !selectedWeekKey) {
      setSelectedWeekKey(selectedWeek.key);
    }
  }, [selectedWeek, selectedWeekKey, setSelectedWeekKey]);

  useEffect(() => {
    if (selectedWeek) {
      setReferenceDate(new Date(selectedWeek.startDate));
    }
  }, [selectedWeek]);

  const month = useMemo(
    () => buildGuildCalendarMonth(referenceDate, selectedWeek ? new Date(selectedWeek.startDate) : undefined),
    [referenceDate, selectedWeek],
  );

  return (
    <Card className="border-2 border-violet-500/30 bg-slate-900/60 backdrop-blur-sm">
      <CardHeader>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-2">
              <CalendarDays className="h-5 w-5 text-violet-300" />
            </div>
            <div>
              <CardTitle className="text-white">Eventos do mês</CardTitle>
              <CardDescription className="text-slate-300">
                Calendário operacional com GW, assalto, subjugação e labirinto, sincronizado com a semana selecionada.
              </CardDescription>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[18rem_auto] sm:items-center">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Semana sincronizada</p>
              <Select value={selectedWeek?.key ?? ""} onValueChange={setSelectedWeekKey}>
                <SelectTrigger className="border-slate-700 bg-slate-900/70 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
                  {weekOptions.map((week) => (
                    <SelectItem key={week.key} value={week.key}>
                      {week.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 sm:pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReferenceDate((current) => addMonths(current, -1))}
                className="border-slate-700 bg-slate-900/70 text-slate-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-40 text-center text-sm font-semibold capitalize text-white">
                {month.monthLabel}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReferenceDate((current) => addMonths(current, 1))}
                className="border-slate-700 bg-slate-900/70 text-slate-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
          {guildCalendarWeekdays.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {month.days.map((day) => (
            <div
              key={day.date.toISOString()}
              className={`min-h-32 rounded-xl border p-2 ${
                day.inCurrentMonth
                  ? "border-slate-700/60 bg-slate-950/30"
                  : "border-slate-800/40 bg-slate-950/10 opacity-50"
              } ${day.isToday ? "ring-2 ring-amber-400/40" : ""} ${day.isInSelectedWeek ? "ring-2 ring-cyan-400/30" : ""}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className={`text-sm font-semibold ${day.inCurrentMonth ? "text-white" : "text-slate-500"}`}>
                  {day.dayNumber}
                </span>
                {day.isToday && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-200">
                    Hoje
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {day.events.map((event) => (
                  <div
                    key={`${day.date.toISOString()}-${event.key}-${event.shortLabel}`}
                    className={`rounded-lg border px-2 py-1 text-[11px] ${event.colorClassName}`}
                    title={event.detail}
                  >
                    <p className="font-medium">{event.shortLabel}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-xs text-slate-300">
            <p className="font-semibold text-white">Batalha de Guilda</p>
            <p className="mt-1">GW 1: quarta e quinta</p>
            <p>GW 2: sexta e sábado</p>
            <p className="mt-1 text-slate-500">Meta: no mínimo 80% de WR em cada janela.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-xs text-slate-300">
            <p className="font-semibold text-white">Batalha de Assalto</p>
            <p className="mt-1">Siege 1: segunda e terça</p>
            <p>Siege 2: quinta e sexta</p>
            <p className="mt-1 text-slate-500">Meta: no mínimo 80% de WR em cada rodada.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-xs text-slate-300">
            <p className="font-semibold text-white">Subjugação</p>
            <p className="mt-1">Quarta: início às 21:30 (Brasília)</p>
            <p>Quinta: boss aparece</p>
            <p>Sexta: encerramento</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-xs text-slate-300">
            <p className="font-semibold text-white">Labirinto</p>
            <p className="mt-1">Ciclo a cada 15 dias</p>
            <p>Duração média de 3 a 4 dias</p>
            <p className="mt-1 text-slate-500">Início de referência atual: 04/04/2026.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

