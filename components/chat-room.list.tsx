"use client";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "./ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { ChatRoomSummary } from "@/types/chat";
import { Skeleton } from "./ui/skeleton";
import { PERMISSIONS, type PermissionValue } from "@/lib/constants/permissions";
import { Button } from "./ui/button";
import Link from "next/link";
import { ChatRoomCard } from "./chat-room-card";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Search } from "lucide-react";
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

interface ChatRoomListProps {
  permissions: PermissionValue[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string | null) => void;
}

const ChatRoomList = ({
  permissions,
  selectedRoomId,
  onSelectRoom,
}: ChatRoomListProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [chatRooms, setChatRooms] = useState<ChatRoomSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const fetchChatRooms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/chatroom");
      const data = await response.json();

      if (data.success) {
        setChatRooms(data.data);
      } else {
        setError(
          data.message ||
            "Une erreur est survenue lors de la récupération des salons de discussion"
        );
      }
    } catch (error: any) {
      setError(error?.message ?? "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, []);

  const handleDeleteConfirm = (roomId: string, roomName: string) => {
    setRoomToDelete({ id: roomId, name: roomName });
    setShowDeleteConfirm(true);
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;

    try {
      const response = await fetch(`/api/chatroom/${roomToDelete.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      console.log(data);

      if (data.success) {
        fetchChatRooms();
        if (selectedRoomId === roomToDelete.id) {
          onSelectRoom(null);
        }
      } else {
      }
    } catch (err) {
      console.error("Error deleting chat room:", err);
    } finally {
      setShowDeleteConfirm(false);
      setRoomToDelete(null);
    }
  };

  const filteredChatRooms = chatRooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.lastMessageSnippet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!permissions.includes(PERMISSIONS.CHAT_VIEW)) {
    return (
      <Card className="p-4">
        <CardHeader>
          <CardTitle>
            Vous n'avez pas accès à la section de discussion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Vous n'avez pas accès à la section de discussion. Contactez votre
            administrateur pour obtenir l'accès.
          </p>
          <Link href={"/"}>
            <Button variant="outline" className="mt-4 bg-transparent">
              Retour à l'accueil
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const canDeleteChat = permissions.includes(PERMISSIONS.CHAT_DELETE);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center gap-2">
        <Search className="size-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          className="flex-1 border-0 focus-visible:ring-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isLoading ? (
            <div className="grid gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="flex items-center gap-3 p-3 rounded-lg"
                >
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            filteredChatRooms.map((room) => (
              <ChatRoomCard
                key={room.id}
                room={room}
                isActive={selectedRoomId === room.id}
                onClick={onSelectRoom}
                onDeleteConfirm={handleDeleteConfirm}
                canDelete={canDeleteChat}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              chat room "
              <span className="font-semibold">{roomToDelete?.name}</span>" and
              all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoom}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatRoomList;
