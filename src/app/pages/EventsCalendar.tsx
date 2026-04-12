import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

import GuildEventsCalendarPanel from "../components/admin/GuildEventsCalendarPanel";
import { Button } from "../components/ui/button";
import { useGuildCurrentState } from "../lib/useGuildCurrentState";
import { useData } from "../context/DataContext";

export default function EventsCalendar() {
  const { userData } = useData();
  const { currentState } = useGuildCurrentState({
    currentUserName: userData?.user.username,
    currentWizardId: userData?.user.wizardId,
  });

  return (
    <div className="clandestino-shell p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link to="/">
          <Button variant="ghost" className="text-slate-300 hover:bg-slate-800 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao dashboard
          </Button>
        </Link>

        <GuildEventsCalendarPanel currentState={currentState} />
      </div>
    </div>
  );
}
