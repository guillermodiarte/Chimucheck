import { getUsers } from "@/app/actions/users";
import { getGlobalSettings } from "@/app/actions/settings";
import UsersManager from "@/components/admin/UsersManager";
import BackupManager from "@/components/admin/BackupManager";
import GlobalSettingsManager from "@/components/admin/GlobalSettingsManager";

export default async function SettingsPage() {
  const users = await getUsers();
  const globalSettings = await getGlobalSettings();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Configuración</h1>
        <p className="text-gray-400">Ajustes generales del panel de administración.</p>
      </div>

      <GlobalSettingsManager initialSettings={globalSettings} />

      <UsersManager initialUsers={users} />

      <div className="border-t border-gray-800 pt-8">
        <BackupManager />
      </div>
    </div>
  );
}
