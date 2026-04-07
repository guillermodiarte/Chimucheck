"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Users, Trash2, CheckSquare, Square, Loader2, Image as ImageIcon, Edit } from "lucide-react";
import { adminCreateTeam, adminUpdateTeam, adminDeleteTeam, adminResetTournamentScores } from "@/app/actions/tournaments";
import { MediaSelectorModal } from "@/components/admin/MediaSelectorModal";
import Image from "next/image";
import { AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminTeamBuilderProps {
  tournamentId: string;
  teamSize: number;
  teams: any[];
  registrations: any[];
  tournamentStatus: string;
  totalScore: number;
}

export function AdminTeamBuilder({ tournamentId, teamSize, teams, registrations, tournamentStatus, totalScore }: AdminTeamBuilderProps) {
  const [teamName, setTeamName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Edit state
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editSelectedPlayers, setEditSelectedPlayers] = useState<string[]>([]);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [showEditMediaSelector, setShowEditMediaSelector] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);

  const [isEditEnabled, setIsEditEnabled] = useState(totalScore === 0);
  const [showEnableEditModal, setShowEnableEditModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const router = useRouter();

  // Find players not in any team
  const playersInTeams = new Set<string>();
  teams.forEach(t => t.players.forEach((p: any) => playersInTeams.add(p.id)));

  const availablePlayers = registrations
    .map(r => r.player)
    .filter(p => !playersInTeams.has(p.id));

  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayers(prev => {
      if (prev.includes(playerId)) return prev.filter(id => id !== playerId);
      if (prev.length < teamSize) return [...prev, playerId];
      return prev;
    });
  };

  const openEditModal = (team: any) => {
    setEditingTeam(team);
    setEditTeamName(team.name);
    setEditImageUrl(team.image || "");
    setEditSelectedPlayers(team.players.map((p: any) => p.id));
  };

  const closeEditModal = () => {
    setEditingTeam(null);
    setEditTeamName("");
    setEditImageUrl("");
    setEditSelectedPlayers([]);
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast.error("Ingresa un nombre para el equipo");
      return;
    }
    if (selectedPlayers.length === 0 || selectedPlayers.length > teamSize) {
      toast.error(`Selecciona entre 1 y ${teamSize} jugadores`);
      return;
    }

    setIsLoading(true);
    const result = await adminCreateTeam(tournamentId, teamName, selectedPlayers, imageUrl);
    setIsLoading(false);

    if (result.success) {
      toast.success(result.message);
      setTeamName("");
      setImageUrl("");
      setSelectedPlayers([]);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    const result = await adminDeleteTeam(teamToDelete);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
    setTeamToDelete(null);
  };

  const handleDeleteTeam = (teamId: string) => {
    setTeamToDelete(teamId);
  };

  const handleUpdateTeam = async () => {
    if (!editTeamName.trim()) {
      toast.error("Ingresa un nombre para el equipo");
      return;
    }
    if (editSelectedPlayers.length === 0 || editSelectedPlayers.length > teamSize) {
      toast.error(`Selecciona entre 1 y ${teamSize} jugadores`);
      return;
    }

    setIsEditLoading(true);
    const result = await adminUpdateTeam(editingTeam.id, editTeamName, editSelectedPlayers, editImageUrl);
    setIsEditLoading(false);

    if (result.success) {
      toast.success(result.message);
      closeEditModal();
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  const handleEnableEdit = async () => {
    setIsResetting(true);
    const result = await adminResetTournamentScores(tournamentId);
    setIsResetting(false);
    
    if (result.success) {
      toast.success("Puntos reseteados correctamente. Edición habilitada.");
      setIsEditEnabled(true);
      setShowEnableEditModal(false);
      router.refresh();
    } else {
      toast.error(result.message || "Error al resetear puntos.");
    }
  };

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 md:p-6 flex flex-col mb-4 relative" style={{ minHeight: 'calc(100vh - 12rem)' }}>
      {/* OVERLAY FOR NON-INSCRIPCION STATUS */}
      {tournamentStatus !== "INSCRIPCION" && (
        <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Edición Desactivada</h3>
          <p className="text-gray-400 max-w-md">
            La gestión de equipos no está disponible porque el torneo se encuentra en estado "{tournamentStatus}". Para editar los equipos, el torneo debe estar en modo INSCRIPCIÓN.
          </p>
        </div>
      )}

      {/* OVERLAY FOR NOT ENABLED (HAS SCORES) */}
      {tournamentStatus === "INSCRIPCION" && !isEditEnabled && (
        <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Equipos con Puntuación</h3>
          <p className="text-gray-400 max-w-md mb-6">
            Los equipos ya tienen puntos asignados. Si decides modificar, armar o desarmar equipos, <strong>todos los puntos se restablecerán a 0</strong> para mantener la consistencia.
          </p>
          <Button 
            onClick={() => setShowEnableEditModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-2"
          >
            Habilitar Edición y Resetear Puntos
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-white/10 pb-4 shrink-0">
        <Users className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold text-white">Armador de Equipos</h2>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 min-h-0 pt-4">
        {/* Left Col: Create Team */}
        <div className="flex flex-col space-y-4">
          <h3 className="font-semibold text-gray-300 shrink-0">Nuevo Equipo ({selectedPlayers.length}/{teamSize})</h3>
          
          <div className="flex gap-2">
            <Input 
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Nombre del Equipo"
              className="bg-black/40 border-white/10 text-white flex-1"
            />
            <Button
              variant="outline"
              className="bg-black/40 border-white/10 text-gray-300 hover:text-white shrink-0"
              onClick={() => setShowMediaSelector(true)}
              title="Foto de Perfil del Equipo"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
          </div>

          {imageUrl && (
            <div className="flex items-center gap-4 bg-black/20 border border-white/5 p-2 rounded-lg shrink-0">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0">
                <Image src={imageUrl} alt="Team" fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-400 truncate tracking-tight">{imageUrl.split('/').pop()}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setImageUrl("")} className="text-red-400 hover:text-red-300">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="bg-black/30 border border-white/10 rounded-lg p-3 flex-1 overflow-y-auto space-y-2 min-h-[300px]">
            {availablePlayers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No hay jugadores disponibles.</p>
            ) : (
              availablePlayers.map(p => {
                const isSelected = selectedPlayers.includes(p.id);
                const isDisabled = !isSelected && selectedPlayers.length >= teamSize;

                return (
                  <button
                    key={p.id}
                    onClick={() => handleTogglePlayer(p.id)}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-3 p-2 rounded transition-colors text-left ${
                      isSelected ? "bg-primary/20 hover:bg-primary/30" : "hover:bg-white/5"
                    } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                {isSelected ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5 text-gray-500" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{p.alias || p.name}</p>
                </div>
              </button>
            );
          })
        )}
      </div>

      <Button 
        onClick={handleCreateTeam}
        disabled={isLoading || selectedPlayers.length === 0 || !teamName.trim()}
        className="w-full bg-primary hover:bg-primary/80 text-black font-bold shrink-0 mt-4"
      >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Crear Equipo
          </Button>
        </div>

        {/* Right Col: Existing Teams */}
        <div className="flex flex-col space-y-4">
          <h3 className="font-semibold text-gray-300 shrink-0">Equipos Formados ({teams.length})</h3>
          
          <div className="bg-black/20 border border-white/5 rounded-lg p-3 flex-1 overflow-y-auto space-y-3 min-h-[300px] pr-2">
            {teams.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-white/10 rounded-lg">
                Ningún equipo armado aún.
              </p>
            ) : (
              teams.map((team) => (
                <div key={team.id} className="bg-black/40 border border-white/10 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {team.image ? (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                          <Image src={team.image} alt={team.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 border border-white/10 shrink-0">
                          <Users className="w-4 h-4 text-zinc-500" />
                        </div>
                      )}
                      <h4 className="font-bold text-primary truncate">{team.name}</h4>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => openEditModal(team)}
                        className="text-gray-500 hover:text-blue-400 transition-colors p-1"
                        title="Editar equipo"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTeam(team.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1"
                        title="Desarmar equipo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {team.players.map((p: any) => (
                      <span key={p.id} className="text-xs bg-black/40 text-gray-300 px-2 py-1 rounded border border-white/5">
                        {p.alias || p.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showEnableEditModal} onOpenChange={setShowEnableEditModal}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Habilitar Edición de Equipos</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Estás a punto de habilitar la edición de equipos. <strong className="text-white">Esta acción restablecerá los puntos de TODOS los jugadores/equipos a 0.</strong> ¿Quieres continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-700 hover:bg-gray-800 text-white" disabled={isResetting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={(e) => {
                e.preventDefault();
                handleEnableEdit();
              }}
              disabled={isResetting}
            >
              {isResetting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Sí, Resetear Puntos y Editar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!teamToDelete} onOpenChange={(open) => !open && setTeamToDelete(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desarmar este equipo?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Los jugadores volverán a estar disponibles para formar otros equipos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-700 hover:bg-gray-800 text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={confirmDeleteTeam}
            >
              Desarmar Equipo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <MediaSelectorModal
        open={showMediaSelector}
        onOpenChange={setShowMediaSelector}
        onSelect={(url) => {
          setImageUrl(url);
          setShowMediaSelector(false);
        }}
      />

      <MediaSelectorModal
        open={showEditMediaSelector}
        onOpenChange={setShowEditMediaSelector}
        onSelect={(url) => {
          setEditImageUrl(url);
          setShowEditMediaSelector(false);
        }}
      />

      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-xl w-full max-w-md space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Editar Equipo</h3>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  placeholder="Nombre del Equipo"
                  className="bg-black/40 border-white/10 text-white flex-1"
                />
                <Button
                  variant="outline"
                  className="bg-black/40 border-white/10 text-gray-300 hover:text-white shrink-0"
                  onClick={() => setShowEditMediaSelector(true)}
                  title="Foto de Perfil del Equipo"
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
              </div>

              {editImageUrl && (
                <div className="flex items-center gap-4 bg-black/20 border border-white/5 p-2 rounded-lg">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0">
                    <Image src={editImageUrl} alt="Team" fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-400 truncate tracking-tight">{editImageUrl.split('/').pop()}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setEditImageUrl("")} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-400">Integrantes ({editSelectedPlayers.length}/{teamSize})</p>
                <div className="bg-black/30 border border-white/10 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {[...editingTeam.players, ...availablePlayers].map((p: any) => {
                    const isSelected = editSelectedPlayers.includes(p.id);
                    const isDisabled = !isSelected && editSelectedPlayers.length >= teamSize;

                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setEditSelectedPlayers(prev => {
                            if (prev.includes(p.id)) return prev.filter(id => id !== p.id);
                            if (prev.length < teamSize) return [...prev, p.id];
                            return prev;
                          });
                        }}
                        disabled={isDisabled}
                        className={`w-full flex items-center gap-3 p-2 rounded transition-colors text-left ${
                          isSelected ? "bg-primary/20 hover:bg-primary/30" : "hover:bg-white/5"
                        } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {isSelected ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5 text-gray-500" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{p.alias || p.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
              <Button variant="ghost" onClick={closeEditModal} className="text-white hover:bg-white/10">
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateTeam}
                disabled={isEditLoading || editSelectedPlayers.length === 0 || !editTeamName.trim()}
                className="bg-primary hover:bg-primary/80 text-black font-bold min-w-[120px]"
              >
                {isEditLoading ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
