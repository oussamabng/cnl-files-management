"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import type { UserWithRolesAndPermissions } from "@/types/authorization";
import { getUserPermissions } from "@/lib/auth/client/getUserPermissions";
import type { PermissionValue } from "@/lib/constants/permissions";
import type { ChatRoomSummary } from "@/types/chat";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LoaderIcon } from "lucide-react";
import { redirect } from "next/navigation";
import ChatRoomList from "@/components/chat-room.list";
import { ChatWindow } from "@/components/chat-window";

export default function ChatPage() {
  const [currentUser, setCurrentUser] =
    useState<UserWithRolesAndPermissions | null>(null);
  const [userPermissions, setUserPermissions] = useState<PermissionValue[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoomSummary[]>([]);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionUser = async () => {
      setUserLoading(true);
      setUserError(null);
      try {
        const res = await fetch("/api/users/me");
        const data = await res.json();

        if (data.success) {
          setCurrentUser(data.data);
          setUserPermissions(getUserPermissions(data.data));
        } else if (res.status === 401) {
          redirect("/login");
        } else {
          setUserError(
            data.message || "Erreur lors de la récupération de l'utilisateur"
          );
        }
      } catch (err) {
        setUserError("Erreur lors de la récupération de l'utilisateur");
      } finally {
        setUserLoading(false);
      }
    };
    fetchSessionUser();
  }, []);

  useEffect(() => {
    const fetchRoomsForHeader = async () => {
      if (!currentUser) return;
      try {
        const response = await fetch("/api/chatroom");
        const data = await response.json();
        if (data.success) {
          setChatRooms(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch chat rooms for header:", error);
      }
    };
    fetchRoomsForHeader();
  }, [currentUser]);

  const handleSelectRoom = (roomId: string | null) => {
    setSelectedRoomId(roomId);
  };

  const handleBackToRooms = () => {
    setSelectedRoomId(null);
  };

  if (userLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">Loading user session...</span>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Alert variant="destructive">
          <AlertDescription>{userError}</AlertDescription>
          <Button onClick={() => window.location.reload()} className="mt-2">
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Alert variant="destructive">
          <AlertDescription>
            User not authenticated. Please log in.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-1 gap-4 h-[calc(80vh)]">
      <Card
        className={`flex-col w-1/3 max-w-xs lg:max-w-sm ${
          selectedRoomId ? "hidden md:flex" : "flex flex-1"
        }`}
      >
        <ChatRoomList
          permissions={userPermissions}
          selectedRoomId={selectedRoomId}
          onSelectRoom={handleSelectRoom}
        />
      </Card>

      <ChatWindow
        roomId={selectedRoomId}
        currentUser={currentUser}
        onBack={handleBackToRooms}
        chatRooms={chatRooms}
      />
    </div>
  );
}
