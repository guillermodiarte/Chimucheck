import { getUsers } from "@/app/actions/users";
import UsersManager from "@/components/admin/UsersManager";

export default async function SettingsPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Configuración</h1>
        <p className="text-gray-400">Ajustes generales del panel de administración.</p>
      </div>

      <UsersManager initialUsers={users} />
    </div>
  );
}
