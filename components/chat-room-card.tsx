"use client";

import type { ChatRoomSummary } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatRoomCardProps {
  room: ChatRoomSummary;
  isActive?: boolean;
  onClick?: (roomId: string) => void;
  onDeleteConfirm?: (roomId: string, roomName: string) => void;
  canDelete?: boolean;
}

export function ChatRoomCard({
  room,
  isActive,
  onClick,
  onDeleteConfirm,
  canDelete,
}: ChatRoomCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(room.id);
    }
  };

  const roomNameInitials = room.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer relative group",
        "hover:bg-muted transition-colors",
        isActive && "bg-muted"
      )}
    >
      <div
        onClick={handleClick}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <Avatar className="size-10 flex-shrink-0">
          <AvatarImage
            src={`/placeholder.svg?text=${roomNameInitials}`}
            alt={room.name}
          />
          <AvatarFallback>{roomNameInitials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{room.name}</div>
          <div className="text-sm text-muted-foreground truncate">
            {room.lastMessageSnippet}
          </div>
        </div>

        <div
          className={cn(
            "text-xs text-muted-foreground flex-shrink-0 transition-opacity",
            canDelete && "group-hover:opacity-0"
          )}
        >
          {room.lastMessageTime}
        </div>
      </div>

      {canDelete && onDeleteConfirm && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Room options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDeleteConfirm(room.id, room.name);
              }}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
