import { getPendingRequests, getRejectedRequests, getPlayerRequests } from "@/app/actions/requests";
import { getGlobalSettings } from "@/app/actions/settings";
import { RequestsTable } from "@/components/admin/RequestsTable";
import { RejectedTable } from "@/components/admin/RejectedTable";
import { PlayersRequestsTable } from "@/components/admin/PlayersRequestsTable";
import { UserCheck, Users, Trophy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function RequestsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await props.searchParams;
  const activeTab = typeof resolvedParams?.tab === "string" ? resolvedParams.tab : "tournaments";

  const pendingRequests = await getPendingRequests();
  const rejectedRequests = await getRejectedRequests();
  const playerRequests = await getPlayerRequests();
  const settings = await getGlobalSettings();

  const tournamentContent = (
    <>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <RequestsTable initialRequests={pendingRequests} />
      </div>

      <RejectedTable initialRequests={rejectedRequests} />
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <UserCheck className="w-8 h-8 text-primary" />
            Solicitudes Pendientes
          </h1>
          <p className="text-gray-400 mt-1">
            Gestiona las inscripciones a torneos y registros de jugadores
          </p>
        </div>
      </div>

      {settings?.restrictPlayerRegistration ? (
        <Tabs defaultValue={activeTab} className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 mb-6">
            <TabsTrigger value="tournaments" className="text-gray-400 hover:text-white data-[state=active]:bg-zinc-700 data-[state=active]:text-white flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Torneos
            </TabsTrigger>
            <TabsTrigger value="players" className="text-gray-400 hover:text-white data-[state=active]:bg-zinc-700 data-[state=active]:text-white flex items-center gap-2">
              <Users className="w-4 h-4" /> Jugadores
              {playerRequests.length > 0 && (
                <span className="bg-primary text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {playerRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tournaments" className="mt-0 space-y-6">
            {tournamentContent}
          </TabsContent>

          <TabsContent value="players" className="mt-0">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <PlayersRequestsTable initialRequests={playerRequests} />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        tournamentContent
      )}
    </div>
  );
}
