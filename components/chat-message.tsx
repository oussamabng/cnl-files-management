"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Message } from "@/lib/generated/prisma"
import { format } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash2 } from "lucide-react"

// Extend the Message type to include sender details
type MessageWithSender = Message & {
  sender: {
    id: string
    firstName: string | null
    lastName: string | null
  } | null
}

interface ChatMessageProps {
  message: MessageWithSender
  isCurrentUser: boolean
  onDeleteConfirm?: (messageId: string, messageContent: string) => void
  canDelete?: boolean
}

export function ChatMessage({ message, isCurrentUser, onDeleteConfirm, canDelete }: ChatMessageProps) {
  const senderName = message.sender
    ? `${message.sender.firstName || ""} ${message.sender.lastName || ""}`.trim() || "Unknown User"
    : "Unknown User"
  const senderInitials = senderName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className={cn("flex items-start gap-3 mb-4 group", isCurrentUser ? "justify-end" : "justify-start")}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={`/placeholder.svg?text=${senderInitials}`} alt={senderName} />
          <AvatarFallback>{senderInitials}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn("flex flex-col max-w-[70%]", isCurrentUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-lg p-3 text-sm relative", // Added relative for dropdown positioning
            isCurrentUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none",
          )}
        >
          <p>{message.content}</p>
          <span className={cn("text-xs mt-1", isCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground")}>
            {senderName} &bull; {format(new Date(message.createdAt), "p")}
          </span>

          {canDelete && onDeleteConfirm && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity bg-amber-300",
                    isCurrentUser ? "-left-8" : "-right-8",
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Message options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isCurrentUser ? "end" : "start"}>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteConfirm(message.id, message.content)
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
      </div>
      {isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={`/placeholder.svg?text=${senderInitials}`} alt={senderName} />
          <AvatarFallback>{senderInitials}</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
