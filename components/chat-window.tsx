"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeftIcon,
  SendIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  LoaderIcon,
} from "lucide-react";
import { ChatMessage } from "@/components/chat-message";
import type { Message } from "@/lib/generated/prisma";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PERMISSIONS, PermissionValue } from "@/lib/constants/permissions";
import type { UserWithRolesAndPermissions } from "@/types/authorization";
import { getUserPermissions } from "@/lib/auth/client/getUserPermissions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ChatRoomSummary } from "@/types/chat";
import { MessageSquare } from "lucide-react";
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
import { MessageWithSender } from "@/types/message";


interface ChatWindowProps {
  roomId: string | null;
  currentUser: UserWithRolesAndPermissions | null;
  onBack: () => void;
  chatRooms: ChatRoomSummary[];
}

export function ChatWindow({
  roomId,
  currentUser,
  onBack,
  chatRooms,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<MessageWithSender[] | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [permissions, setPermissions] = useState<PermissionValue[]>([]);


  const [showDeleteMessageConfirm, setShowDeleteMessageConfirm] =
    useState(false);
  const [messageToDelete, setMessageToDelete] = useState<{
    id: string;
    content: string;
  } | null>(null);

  const [loadingState, setLoadingState] = useState({
    messages: false,
    sendingMessage: false,
  });

  const currentRoom = chatRooms.find((room) => room.id === roomId);

  useEffect(() => {
    if (currentUser) {
      setPermissions(getUserPermissions(currentUser));
    }
  }, [currentUser]);

  const fetchMessages = async () => {
    if (!roomId || !currentUser?.id) {
      setMessages(null);
      return;
    }

    setLoadingState((prev) => ({ ...prev, messages: true }));
    setError(null);

    try {
      const response = await fetch(`/api/chatroom/${roomId}`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.data);
      } else if (data.status === 204) {
        setMessages([]);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Échec de la récupération des messages");
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingState((prev) => ({ ...prev, messages: false }));
    }
  };

  useEffect(() => {
    if (roomId && currentUser?.id) {
      fetchMessages();
    } else {
      setMessages(null);
    }
  }, [roomId, currentUser?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newMessage.trim() ||
      loadingState.sendingMessage ||
      !currentUser?.id ||
      !roomId
    )
      return;

    setLoadingState((prev) => ({ ...prev, sendingMessage: true }));
    const messageToSend = newMessage;
    setNewMessage("");

    try {
      const response = await fetch(`/api/chatroom/${roomId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageToSend,
          senderId: currentUser.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const newMessageWithSender: MessageWithSender = {
          ...data.data,
          sender: {
            id: currentUser.id,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
          },
        };
        setMessages((prev) =>
          prev ? [...prev, newMessageWithSender] : [newMessageWithSender]
        );
      } else {
        setError(data.message);
        setNewMessage(messageToSend);
      }
    } catch (err) {
      setError("Échec de l'envoi du message");
      setNewMessage(messageToSend);
    } finally {
      setLoadingState((prev) => ({ ...prev, sendingMessage: false }));
    }
  };

  const handleDeleteMessageConfirm = (
    messageId: string,
    messageContent: string
  ) => {
    setMessageToDelete({ id: messageId, content: messageContent });
    setShowDeleteMessageConfirm(true);
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete || !roomId) return;

    try {
      const response = await fetch(
        `/api/chatroom/${roomId}/message/${messageToDelete.id}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();

      if (data.success) {

        setMessages(
          (prev) => prev?.filter((msg) => msg.id !== messageToDelete.id) || []
        );
      } else {

      }
    } catch (err) {

      console.error("Error deleting message:", err);
    } finally {
      setShowDeleteMessageConfirm(false);
      setMessageToDelete(null);
    }
  };

  if (!roomId) {
    return (
      <Card className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground p-4">
        <MessageSquare className="size-12 mb-4" />
        <p className="text-lg font-semibold">
          Sélectionnez une conversation pour commencer à envoyer des messages.
        </p>
        <p className="text-sm">
          Sélectionnez une conversation dans le panneau de gauche ou créez-en une nouvelle.
        </p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex flex-1 flex-col items-center justify-center p-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircleIcon className="h-5 w-5" />
            Erreur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={fetchMessages} className="flex items-center gap-2">
            <RefreshCwIcon className="h-4 w-4" />
            Réessayer
          </Button>
          <Button variant="outline" onClick={onBack}>
            Retour aux salons
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const isLoadingContent = loadingState.messages || !messages;

  const roomNameInitials =
    currentRoom?.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "UN";

  const canDeleteMessages = permissions.includes(PERMISSIONS.MESSAGE_DELETE);

  return (
    <Card className="flex flex-1 flex-col">
      <div className="p-4 border-b flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="md:hidden"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="sr-only">Retour aux salons de chat</span>
        </Button>
        <Avatar className="size-10">
          <AvatarImage
            src={`/placeholder.svg?text=${roomNameInitials}`}
            alt={currentRoom?.name || "Chat Room"}
          />
          <AvatarFallback>{roomNameInitials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="font-semibold">
            {currentRoom?.name || "Loading..."}
          </div>
          <div className="text-sm text-muted-foreground">Online</div>{" "}
        </div>
        {loadingState.messages && (
          <LoaderIcon className="h-4 w-4 animate-spin text-gray-500 ml-auto" />
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4">
          {isLoadingContent ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-16 w-full max-w-xs rounded-lg ml-10" />
                </div>
              ))}
            </div>
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-lg">Aucun message pour le moment</p>
              <p className="text-sm">Commencez la conversation !</p>
            </div>
          ) : (
            <>
              {messages?.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isCurrentUser={message.senderId === currentUser?.id}
                  onDeleteConfirm={handleDeleteMessageConfirm}
                  canDelete={
                    canDeleteMessages && message.senderId === currentUser?.id
                  } // Only allow sender to delete their own message
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      <CardFooter className="p-4 border-t">
        {permissions.includes(PERMISSIONS.MESSAGE_SEND) ? (
          <form className="flex w-full space-x-2" onSubmit={handleSendMessage}>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                loadingState.messages
                  ? "Chargement..."
                  : loadingState.sendingMessage
                  ? "Envoi..."
                  : "Tapez votre message..."
              }
              className="flex-grow"
              disabled={
                loadingState.messages ||
                loadingState.sendingMessage ||
                !currentUser?.id
              }
            />
            <Button
              type="submit"
              size="icon"
              disabled={
                loadingState.messages ||
                loadingState.sendingMessage ||
                !currentUser?.id ||
                !newMessage.trim()
              }
            >
              {loadingState.sendingMessage ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : (
                <SendIcon className="h-5 w-5" />
              )}
              <span className="sr-only">Envoyer le message</span>
            </Button>
          </form>
        ) : (
          <div className="text-center text-muted-foreground w-full">
            You do not have permission to send messages.
          </div>
        )}
      </CardFooter>

      {/* Message Delete Confirmation AlertDialog */}
      <AlertDialog
        open={showDeleteMessageConfirm}
        onOpenChange={setShowDeleteMessageConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this message?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The message will be permanently
              removed.
              <br />
              <span className="font-semibold italic">
                "{messageToDelete?.content}"
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessage}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Message
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
