"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logoutPlayer } from "@/app/actions/player-auth";
import { User, LogOut } from "lucide-react";

export function UserNav({ player }: { player: any }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 text-white hover:text-primary transition-colors group cursor-pointer outline-none">
          <div className="p-1.5 rounded-full border border-primary/50 bg-primary/10 group-hover:bg-primary/20 transition-all">
            {player.image ? (
              <Avatar className="h-5 w-5">
                <AvatarImage src={player.image} alt={player.alias || "Player"} />
                <AvatarFallback className="bg-transparent text-primary text-xs">
                  {player.alias?.charAt(0) || "P"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <User size={16} className="text-primary" />
            )}
          </div>
          <span className="font-bold text-sm tracking-wide max-w-[120px] truncate">
            {player.alias || player.name || "Jugador"}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-zinc-900 border-white/10 text-white rounded-xl shadow-2xl" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none text-white">{player.alias}</p>
            <p className="text-xs leading-none text-gray-400">
              {player.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuGroup>
          <DropdownMenuItem className="hover:bg-white/5 focus:bg-white/5 cursor-pointer">
            <User size={14} className="mr-2" />
            Mi Perfil
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          className="hover:bg-white/5 text-red-400 focus:bg-white/5 focus:text-red-400 cursor-pointer"
          onClick={() => logoutPlayer()}
        >
          <LogOut size={14} className="mr-2" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
