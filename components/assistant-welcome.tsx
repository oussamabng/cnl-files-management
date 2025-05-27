"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Search, Upload, Filter, Edit, Download } from "lucide-react";

export function utilisateurWelcome() {
  return (
    <div className="mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bienvenue utilisateur ! 👋
          </CardTitle>
          <CardDescription>
            Vous avez un accès complet aux fonctionnalités de gestion des
            fichiers et dossiers. Voici ce que vous pouvez faire :
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium">Recherche & Filtrage</h4>
                <p className="text-sm text-muted-foreground">
                  Trouvez des fichiers à l’aide de mots-clés et de filtres
                  avancés
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium">Téléverser des fichiers</h4>
                <p className="text-sm text-muted-foreground">
                  Ajoutez de nouveaux fichiers avec des mots-clés
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <Edit className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium">Modifier les fichiers</h4>
                <p className="text-sm text-muted-foreground">
                  Renommez les fichiers et mettez à jour leurs mots-clés
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <Filter className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium">Parcourir les dossiers</h4>
                <p className="text-sm text-muted-foreground">
                  Naviguez dans la structure des dossiers et organisez les
                  fichiers
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Download className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium">Télécharger & Prévisualiser</h4>
                <p className="text-sm text-muted-foreground">
                  Accédez aux fichiers et prévisualisez-les dans votre
                  navigateur
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium">Gestion des fichiers</h4>
                <p className="text-sm text-muted-foreground">
                  Effectuez toutes les opérations et l’organisation des fichiers
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Remarque :</strong> Vous pouvez parcourir les dossiers,
              téléverser des fichiers dans des dossiers spécifiques et utiliser
              les filtres par mots-clés. Seuls les administrateurs peuvent
              créer, modifier ou supprimer des dossiers et des mots-clés de
              filtre.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
