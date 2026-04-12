import React from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

import GuildCurrentStatePanel from "../components/admin/GuildCurrentStatePanel";
import { Button } from "../components/ui/button";

export default function CurrentGuildState() {
  return (
    <div className="clandestino-shell p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <Link to="/admin">
          <Button variant="ghost" className="mb-6 text-slate-300 hover:bg-slate-800 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao admin
          </Button>
        </Link>

        <GuildCurrentStatePanel />
      </div>
    </div>
  );
}
