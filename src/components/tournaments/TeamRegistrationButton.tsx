"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { registerTeam, searchPlayers } from "@/app/actions/tournaments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Swords, Loader2, Search, X, Users, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TeamRegistrationButtonProps {
  tournamentId: string;
  userId: string;
  teamSize?: number;
  registrationStatus?: string | null;
  isRestricted?: boolean;
}

export default function TeamRegistrationButton({
  tournamentId,
  userId,
  teamSize = 2,
  registrationStatus,
  isRestricted = false
}: TeamRegistrationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(registrationStatus === "PENDING");
  const router = useRouter();

  // Form State
  const [teamName, setTeamName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<any[]>([{ id: userId, isMe: true }]); // Auto-include current user

  useEffect(() => {
    if (registrationStatus === "PENDING") {
      setShowPendingModal(true);
    }
  }, [registrationStatus]);

  // Debounced Search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchPlayers(searchQuery, userId);
      // Filter out already selected players
      const filtered = results.filter(p => !selectedPlayers.some(sp => sp.id === p.id));
      setSearchResults(filtered);
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedPlayers, userId]);

  function handleAddPlayer(player: any) {
    if (selectedPlayers.length >= teamSize) return;
    setSelectedPlayers([...selectedPlayers, player]);
    setSearchQuery("");
    setSearchResults([]);
  }

  function handleRemovePlayer(playerId: string) {
    if (playerId === userId) return; // Cant remove self
    setSelectedPlayers(selectedPlayers.filter(p => p.id !== playerId));
  }

  async function handleRegister() {
    if (!teamName.trim()) {
      toast.error("El nombre del equipo es obligatorio");
      return;
    }
    if (selectedPlayers.length !== teamSize) {
      toast.error(`El equipo debe tener exactamente ${teamSize} miembros`);
      return;
    }

    setIsLoading(true);
    try {
      const playerIds = selectedPlayers.map(p => p.id);
      const result = await registerTeam(tournamentId, teamName, playerIds);

      if (result.success) {
        toast.success(result.message);
        router.refresh();
        setShowModal(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  if (registrationStatus === "REJECTED") {
    return (
      <Button disabled className="w-full bg-red-900/50 text-red-200 border border-red-500/30 font-bold text-lg py-6 cursor-not-allowed">
        <AlertCircle className="w-6 h-6 mr-2" /> Inscripción Rechazada
      </Button>
    );
  }

  if (registrationStatus === "PENDING") {
    return (
      <>
        <Button onClick={() => setShowPendingModal(true)} className="w-full bg-gray-800 text-gray-400 border border-gray-700 font-bold text-lg py-6 hover:bg-gray-700 transition-colors">
          <Clock className="w-6 h-6 mr-2" /> Equipo Pendiente
        </Button>
        {showPendingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl space-y-5">
              <div className="text-center space-y-4">
                <Clock className="w-8 h-8 mx-auto text-yellow-500 animate-pulse" />
                <h3 className="text-xl font-bold text-white">Inscripción en Revisión</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  El equipo requiere aprobación manual del administrador.
                </p>
                <Button onClick={() => setShowPendingModal(false)} className="w-full bg-zinc-800 text-white hover:bg-zinc-700 font-bold">
                  Entendido
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        className="w-full bg-primary text-black hover:bg-yellow-400 font-bold text-lg py-6 shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all transform hover:-translate-y-1"
      >
        <Users className="w-6 h-6 mr-2" />
        Inscribir Equipo
      </Button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md my-auto shadow-2xl">
            
            <div className="flex justify-between items-start mb-6 border-b border-gray-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Crear y Unir Equipo
                </h3>
                <p className="text-sm text-gray-400 mt-1">Arma tu equipo de {teamSize} personas</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Team Name */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-300">Nombre del Equipo</label>
                <Input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Ej: Los Chimuchinas"
                  className="bg-gray-800 border-gray-700 text-white"
                  maxLength={50}
                />
              </div>

              {/* Roster */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-300 flex justify-between">
                  <span>Miembros</span>
                  <span className="text-primary">{selectedPlayers.length} / {teamSize}</span>
                </label>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {selectedPlayers.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-gray-800/50 border border-gray-700 p-2 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
                          {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <Users className="w-4 h-4 text-gray-400" />}
                        </div>
                        <span className="text-sm font-bold text-white">{p.alias || p.name} {p.isMe && <span className="text-xs text-primary font-normal">(Tú)</span>}</span>
                      </div>
                      {!p.isMe && (
                        <button onClick={() => handleRemovePlayer(p.id)} className="text-red-400 hover:text-red-300 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {/* Empty Slots */}
                  {Array.from({ length: Math.max(0, teamSize - selectedPlayers.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="flex items-center gap-3 border border-dashed border-gray-700 bg-gray-800/20 p-2 rounded-lg py-3">
                      <div className="w-8 h-8 rounded-full border border-dashed border-gray-600 flex items-center justify-center text-gray-600">?</div>
                      <span className="text-sm text-gray-500 italic">Esperando jugador...</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search Players */}
              {selectedPlayers.length < teamSize && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-300">Buscar Jugador</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por Alias o Nombre..."
                      className="bg-gray-800 border-gray-700 text-white pl-9"
                    />
                  </div>
                  
                  {isSearching && <p className="text-xs text-gray-400 flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-1" /> Buscando...</p>}
                  
                  {searchResults.length > 0 && (
                    <div className="mt-2 bg-gray-800 border border-gray-700 rounded-lg max-h-40 overflow-y-auto">
                      {searchResults.map(p => (
                        <button
                          key={p.id}
                          onClick={() => handleAddPlayer(p)}
                          className="w-full flex items-center gap-3 p-2 hover:bg-gray-700 transition-colors text-left border-b border-gray-700/50 last:border-0"
                        >
                          <div className="w-6 h-6 rounded-full bg-gray-600 overflow-hidden">
                            {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : null}
                          </div>
                          <span className="text-sm text-white">{p.alias || p.name}</span>
                          <span className="ml-auto text-xs text-primary">Agregar</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchQuery.length > 1 && !isSearching && searchResults.length === 0 && (
                     <p className="text-xs text-red-400 italic">No se encontraron jugadores.</p>
                  )}
                </div>
              )}

              <Button
                onClick={handleRegister}
                disabled={isLoading || selectedPlayers.length !== teamSize || !teamName.trim()}
                className="w-full bg-primary text-black hover:bg-yellow-400 font-bold h-12 mt-4"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                Confirmar Inscripción
              </Button>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}
