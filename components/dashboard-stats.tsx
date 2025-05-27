"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Filter,
  Clock,
  AlertTriangle,
  TrendingUp,
  Folder,
} from "lucide-react";
import { StatsLoading, CardLoading } from "@/components/ui/loading";

interface DashboardStats {
  totalFiles: number;
  totalKeywords: number;
  totalFolders: number;
  recentFiles: number;
  filesWithoutKeywords: number;
  unusedKeywords: number;
  emptyFolders: number;
  topKeywords: Array<{
    id: string;
    name: string;
    fileCount: number;
  }>;
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/dashboard/stats");

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const errorData = await response.json();
        setError(
          errorData.error || "Échec de la récupération des statistiques"
        );
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <StatsLoading />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardLoading />
          </Card>
          <Card>
            <CardLoading />
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Cartes de synthèse */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fichiers totaux
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFiles}</div>
            <p className="text-xs text-muted-foreground">
              Fichiers dans votre système
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Dossiers totaux
            </CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFolders}</div>
            <p className="text-xs text-muted-foreground">
              Dossiers pour l’organisation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mots-clés totaux
            </CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalKeywords}</div>
            <p className="text-xs text-muted-foreground">Filtres disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fichiers récents
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentFiles}</div>
            <p className="text-xs text-muted-foreground">
              Ajoutés ces 7 derniers jours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fichiers sans mots-clés
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.filesWithoutKeywords}
            </div>
            <p className="text-xs text-muted-foreground">
              Fichiers non étiquetés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques détaillées */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Mots-clés les plus utilisés */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Mots-clés les plus utilisés
            </CardTitle>
            <CardDescription>
              Mots-clés associés au plus grand nombre de fichiers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topKeywords.length > 0 ? (
              <div className="space-y-3">
                {stats.topKeywords.map((keyword, index) => (
                  <div
                    key={keyword.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="font-medium">{keyword.name}</span>
                    </div>
                    <Badge variant="secondary">
                      {keyword.fileCount} fichiers
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun mot-clé trouvé
              </p>
            )}
          </CardContent>
        </Card>

        {/* Santé du système */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Santé du système
            </CardTitle>
            <CardDescription>Zones nécessitant une attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Fichiers sans mots-clés</span>
                <Badge
                  variant={
                    stats.filesWithoutKeywords > 0 ? "destructive" : "secondary"
                  }
                >
                  {stats.filesWithoutKeywords}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Dossiers vides</span>
                <Badge
                  variant={stats.emptyFolders > 0 ? "outline" : "secondary"}
                >
                  {stats.emptyFolders}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Mots-clés inutilisés</span>
                <Badge
                  variant={stats.unusedKeywords > 0 ? "outline" : "secondary"}
                >
                  {stats.unusedKeywords}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
