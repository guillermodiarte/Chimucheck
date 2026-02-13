
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Medal } from "lucide-react";

interface Player {
  rank: number;
  name: string;
  avatar: string;
  score: string;
  medal: string;
}

interface TopPlayersTableProps {
  data: Player[];
}

export function TopPlayersTable({ data }: TopPlayersTableProps) {
  return (
    <Card className="bg-gray-900 border-gray-800 text-white mt-6">
      <CardHeader>
        <CardTitle>Top Jugadores</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-800 hover:bg-gray-800/50">
              <TableHead className="w-[100px] text-gray-400">Rank</TableHead>
              <TableHead className="text-gray-400">Jugador</TableHead>
              <TableHead className="text-right text-gray-400">Puntaje</TableHead>
              <TableHead className="text-right text-gray-400">Medalla</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((player) => (
              <TableRow key={player.rank} className="border-gray-800 hover:bg-gray-800/50">
                <TableCell className="font-medium text-gray-300">#{player.rank}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player.avatar} alt={player.name} />
                      <AvatarFallback className="bg-gray-700 text-gray-300">
                        {player.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-white">{player.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-yellow-500">
                  {player.score}
                </TableCell>
                <TableCell className="text-right">
                  {player.medal === "gold" && <Medal className="w-5 h-5 text-yellow-400 ml-auto" />}
                  {player.medal === "silver" && <Medal className="w-5 h-5 text-gray-400 ml-auto" />}
                  {player.medal === "bronze" && <Medal className="w-5 h-5 text-amber-700 ml-auto" />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
