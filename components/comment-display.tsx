"use client";

import { useState } from "react";
import { MessageSquare, FileText, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CommentDisplayProps {
  commentaire: string | null;
  fileName?: string;
}

export function CommentDisplay({ commentaire, fileName }: CommentDisplayProps) {
  const [open, setOpen] = useState(false);

  if (!commentaire || commentaire.trim() === "") {
    return (
      <div className="flex items-center justify-center">
        <Badge
          variant="outline"
          className="text-xs text-muted-foreground border-dashed"
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          Aucun commentaire
        </Badge>
      </div>
    );
  }

  const previewText =
    commentaire.length > 25 ? `${commentaire.slice(0, 25)}...` : commentaire;

  return (
    <div className="flex items-center gap-2 max-w-[200px]">
      {/* Comment Preview Card */}
      <div
        className={cn(
          "flex-1 p-2 rounded-lg border transition-all duration-200 cursor-pointer group",
          "bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300",
          "hover:shadow-sm"
        )}
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0">
            <MessageCircle className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-900 leading-tight line-clamp-2">
              {previewText}
            </p>
          </div>
        </div>
      </div>

      {/* View Button */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild></DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              Commentaire
              {fileName && (
                <Badge variant="outline" className="ml-2">
                  <FileText className="h-3 w-3 mr-1" />
                  {fileName}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Comment Content */}
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="absolute top-2 right-2">
                  <MessageCircle className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed pr-6">
                  {commentaire}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-xs text-muted-foreground">
                Commentaire ajouté au fichier
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(commentaire);
                }}
                className="h-7 text-xs"
              >
                Copier le texte
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
