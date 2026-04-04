'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui';

type TextePrepare = {
  oeuvreAuteur: string;
  titreExtrait: string;
  incipit?: string;
  position?: number;
};

export default function DescriptifLecturePage() {
  const [textes, setTextes] = useState<TextePrepare[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Charger le descriptif existant
  useEffect(() => {
    loadDescriptif();
  }, []);

  const loadDescriptif = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/student/descriptif-lecture');
      if (res.ok) {
        const data = await res.json();
        setTextes(data.textes || []);
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors du chargement du descriptif' });
    } finally {
      setIsLoading(false);
    }
  };

  const addTexte = () => {
    if (textes.length >= 20) {
      setMessage({ type: 'error', text: 'Maximum 20 textes autorisés' });
      return;
    }
    setTextes([...textes, {
      oeuvreAuteur: '',
      titreExtrait: '',
      incipit: '',
      position: textes.length + 1,
    }]);
  };

  const updateTexte = (index: number, field: keyof TextePrepare, value: string) => {
    const newTextes = [...textes];
    newTextes[index] = { ...newTextes[index], [field]: value };
    setTextes(newTextes);
  };

  const removeTexte = (index: number) => {
    const newTextes = textes.filter((_, i) => i !== index);
    // Réindexer les positions
    setTextes(newTextes.map((t, i) => ({ ...t, position: i + 1 })));
  };

  const saveDescriptif = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/v1/student/descriptif-lecture', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textes }),
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Descriptif sauvegardé avec succès' });
      } else {
        const errorBody = await res.json();
        setMessage({ type: 'error', text: errorBody.error || 'Erreur lors de la sauvegarde' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Mon descriptif de lecture
        </h1>
        <p className="text-gray-600 mb-4">
          Saisis ici les textes de ton descriptif de lecture, tels que ton enseignant les a préparés avec toi.
          L'atelier oral ne tirera que dans CETTE liste.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Important :</strong> Tu peux ajouter jusqu'à 20 textes (16 en classe + lectures personnelles).
            Le tirage au sort pour l'atelier oral se fera uniquement dans ta liste.
          </p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <p>Chargement...</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {textes.map((texte, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium text-gray-500">
                    Texte #{texte.position || index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTexte(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Œuvre — Auteur *
                    </label>
                    <input
                      type="text"
                      value={texte.oeuvreAuteur}
                      onChange={(e) => updateTexte(index, 'oeuvreAuteur', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Cahier de Douai — Arthur Rimbaud"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Titre ou incipit de l'extrait *
                    </label>
                    <input
                      type="text"
                      value={texte.titreExtrait}
                      onChange={(e) => updateTexte(index, 'titreExtrait', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Le Bateau ivre"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Premiers mots de l'extrait (optionnel)
                    </label>
                    <textarea
                      value={texte.incipit || ''}
                      onChange={(e) => updateTexte(index, 'incipit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Ex: « Comme je descendais des Fleuves impassibles... »"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <Button
              onClick={addTexte}
              disabled={textes.length >= 20}
              variant="ghost"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter un texte
            </Button>
            
            <Button
              onClick={saveDescriptif}
              disabled={isSaving || textes.length === 0}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>

          {textes.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Commence par ajouter ton premier texte</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
