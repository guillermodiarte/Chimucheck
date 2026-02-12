import { getPrizes, getPrizesPageConfig } from "@/app/actions/prizes";
import PrizesView from "@/components/prizes/PrizesView";

export const dynamic = "force-dynamic";

export default async function PrizesPage() {
  const prizes = await getPrizes(true);
  const config = await getPrizesPageConfig();

  return <PrizesView prizes={prizes} config={config} />;
}
