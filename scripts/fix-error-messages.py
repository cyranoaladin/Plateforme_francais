import os
import re

files_to_fix = [
    'src/app/api/v1/oral/session/[sessionId]/start-passage/route.ts',
    'src/app/api/v1/oral/session/[sessionId]/end-prep/route.ts',
    'src/app/api/v1/enseignant/corrections/[copieId]/comment/route.ts',
    'src/app/api/v1/epreuves/[epreuveId]/copie/route.ts',
    'src/app/api/v1/epreuves/copies/[copieId]/report/route.ts',
    'src/app/api/v1/media/[id]/route.ts',
]

for filepath in files_to_fix:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace specific error messages with generic one
        content = re.sub(r"error: 'Session introuvable\.'", "error: 'Ressource non disponible.'", content)
        content = re.sub(r"error: 'Copie introuvable\.'", "error: 'Ressource non disponible.'", content)
        content = re.sub(r"error: 'Épreuve introuvable\.'", "error: 'Ressource non disponible.'", content)
        content = re.sub(r"error: 'Ressource introuvable\.'", "error: 'Ressource non disponible.'", content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {filepath}")
    else:
        print(f"NotFound: {filepath}")

print("Done!")
