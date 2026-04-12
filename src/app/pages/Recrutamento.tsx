import { MessageCircle, ShieldCheck, Swords, Users } from "lucide-react";

import logo from "../../assets/logo.jpeg";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

const WHATSAPP_URL = "https://wa.me/5511947485240";

const worldGuildWarRules = [
  "Quem estiver inscrito precisa fazer os 2 ataques. Se fizer só 1, será tratado como quem não atacou e ficará fora da próxima GVG Mundial.",
  "Para ser escalado: mobs no level 40.",
  "Para ser escalado: todas as runas do slot 1 ao 6 no +15, sem exceções.",
  "Para ser escalado: todos os mobs com artefatos.",
  "Se ficar fora por não atender as condições, recebe OBS e fica fora do conteúdo.",
  "Na segunda semana pelo mesmo motivo, entra na lista de remanejamento.",
  "Na terceira chamada, sai da guilda e é remanejado para outro Clã Destino.",
];

const siegeRules = [
  "Os ataques estão temporariamente liberados sem limite enquanto a guilda ajusta a nova dinâmica da Siege.",
  "Para ser escalado: mobs no level 40.",
  "Para ser escalado: todas as runas do slot 1 ao 6 no +15, sem exceções.",
  "Para ser escalado: todos os mobs com artefatos.",
  "Para ser escalado: ter no mínimo 5 defesas preparadas, sem exceções.",
  "Se ficar fora por não atender as condições, recebe OBS e fica fora do conteúdo.",
  "Na segunda semana pelo mesmo motivo, entra na lista de remanejamento.",
  "Na terceira chamada, sai da guilda e é remanejado para outro Clã Destino.",
];

const labyrinthRules = [
  "Assim que o labirinto abrir, siga as casas marcadas para atacar.",
  "Se o caminho não estiver marcado, abra até o quadrado maior pelo menor trajeto possível.",
  "Não faça ataques fora da marcação só para registrar presença; isso pode gerar verificação e punição.",
  "Se a casa precisar de um ataque em hell ou hard e você não conseguir, avise no grupo para evitar desperdício.",
  "Mini bosses estão liberados quando encontrados, mas sempre guarde 1 ataque para o Tartarus.",
  "Após as 22h, o último ataque está liberado desde que siga a regra do caminho marcado.",
];

const punishmentRules = [
  "Conteúdo obrigatório: não atacar na GVG Mundial quando inscrito gera punição.",
  "Conteúdo obrigatório: não atacar na Siege quando inscrito gera punição.",
  "Conteúdo obrigatório: não atacar na Subjugação de mobs gera punição.",
  "Conteúdo obrigatório: não atacar no Labirinto gera punição.",
  "Ataques aleatórios no Labirinto podem gerar OBS e exclusão da Siege e da GVG Mundial na semana seguinte.",
  "Reincidência pode levar ao remanejamento para outra guilda da família Destino.",
  "Conteúdo farm: não atacar na GVG Farm gera sanção.",
  "Conteúdo farm: não atingir contribuição mensal mínima de 10.000 gera sanção.",
  "Na primeira ocorrência de falha em conteúdo farm, o membro fica fora da GVG Mundial e da Siege e entra em observação.",
];

const shutdownRules = [
  "Ficar 3 dias sem logar e sem avisar um líder gera desligamento sem aviso.",
  "Ficar 2 semanas seguidas sem cumprir conteúdos obrigatórios, sem motivo plausível, gera desligamento sem lista de remanejamento.",
];

function RulesCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <Card className="border border-slate-700/60 bg-slate-950/55 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        <CardDescription className="text-slate-300">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={`${title}-${index}`}
              className="rounded-xl border border-slate-800 bg-slate-900/65 px-4 py-3 text-sm leading-6 text-slate-200"
            >
              <span className="mr-2 font-semibold text-amber-300">{String(index + 1).padStart(2, "0")}.</span>
              {item}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Recrutamento() {
  return (
    <div className="clandestino-shell px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-amber-500/25 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-xl sm:p-10">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(89,192,255,0.22),transparent_46%),radial-gradient(circle_at_bottom_right,rgba(216,167,100,0.18),transparent_34%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-100">
                  Recrutamento aberto
                </Badge>
                <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-100">
                  Clã D9stino
                </Badge>
              </div>

              <div className="space-y-3">
                <h1 className="clandestino-brand-title text-4xl font-bold tracking-tight sm:text-5xl">
                  Junte-se ao Clã D9stino
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                  Procuramos jogadores comprometidos com conteúdo obrigatório, organização de guerra e evolução
                  constante. Se você quer uma guilda ativa, com regra clara e cobrança séria, esse espaço é para você.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                  <Button className="clandestino-action-button border-emerald-500/40 bg-gradient-to-b from-emerald-700/95 to-emerald-950/95 !text-emerald-50 hover:border-emerald-400/70 hover:from-emerald-600 hover:to-emerald-900">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chamar no WhatsApp
                  </Button>
                </a>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/65 p-4">
                  <div className="mb-3 inline-flex rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-2">
                    <ShieldCheck className="h-5 w-5 text-cyan-200" />
                  </div>
                  <p className="text-sm font-semibold text-white">Cobrança clara</p>
                  <p className="mt-2 text-sm text-slate-400">Regras objetivas para escalação, punição e permanência.</p>
                </div>
                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/65 p-4">
                  <div className="mb-3 inline-flex rounded-xl border border-red-500/30 bg-red-500/10 p-2">
                    <Swords className="h-5 w-5 text-red-200" />
                  </div>
                  <p className="text-sm font-semibold text-white">Foco competitivo</p>
                  <p className="mt-2 text-sm text-slate-400">GVG Mundial, Siege, Lab e Subjugação com acompanhamento real.</p>
                </div>
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="mb-3 inline-flex rounded-xl border border-amber-500/30 bg-slate-950/50 p-2">
                    <Users className="h-5 w-5 text-amber-200" />
                  </div>
                  <p className="text-sm font-semibold text-white">Remanejamento organizado</p>
                  <p className="mt-2 text-sm text-slate-400">Quem não encaixa no perfil pode ser realocado dentro da família Destino.</p>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle,rgba(89,192,255,0.18),transparent_55%)] blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-amber-400/30 bg-slate-900/80 p-5 shadow-[0_0_60px_rgba(0,0,0,0.35)]">
                <img
                  src={logo}
                  alt="Logo do Cla D9stino"
                  className="h-72 w-72 rounded-[1.5rem] object-cover sm:h-80 sm:w-80"
                />
                <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200">Contato direto - Hellz</p>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block text-2xl font-bold text-white transition-colors hover:text-emerald-200"
                  >
                    (11) 94748-5240
                  </a>
                  <p className="mt-2 text-sm text-emerald-100/80">Toque para abrir conversa no WhatsApp.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <RulesCard
            title="GVG Mundial"
            description="Escalação depende de preparo completo e execução das duas entradas obrigatórias."
            items={worldGuildWarRules}
          />
          <RulesCard
            title="Siege"
            description="Participação exige base preparada, mobs completos e atenção às regras de escalação."
            items={siegeRules}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <RulesCard
            title="Labirinto"
            description="O lab exige disciplina coletiva. Ataques fora da estratégia prejudicam toda a guilda."
            items={labyrinthRules}
          />
          <RulesCard
            title="Punições"
            description="Os conteúdos obrigatórios e farm têm consequência real em caso de ausência ou reincidência."
            items={punishmentRules}
          />
        </section>

        <RulesCard
          title="Desligamento da Guilda CD9"
          description="Regras finais de permanência para manter o clã ativo e comprometido."
          items={shutdownRules}
        />
      </div>
    </div>
  );
}
