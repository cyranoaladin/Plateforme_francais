#!/usr/bin/env python3
"""
Script de configuration de la base de données PostgreSQL
Crée l'utilisateur et la base de données pour EAF Platform
"""

import subprocess
import os

def run_psql(command, db="postgres"):
    """Exécute une commande psql en tant que user courant"""
    try:
        result = subprocess.run(
            ["psql", "-d", db, "-c", command],
            capture_output=True,
            text=True,
            timeout=10
        )
        return result.returncode == 0, result.stdout + result.stderr
    except Exception as e:
        return False, str(e)

def main():
    print("=== Configuration PostgreSQL pour EAF Platform ===\n")
    
    # 1. Créer utilisateur si n'existe pas
    print("1. Création utilisateur 'eaf_user'...")
    success, output = run_psql("CREATE USER eaf_user WITH PASSWORD 'eaf_password';")
    if success:
        print("   ✅ Utilisateur créé")
    elif "already exists" in output:
        print("   ℹ️  Utilisateur existe déjà")
    else:
        print(f"   ❌ Erreur: {output}")
    
    # 2. Créer base de données
    print("\n2. Création base de données 'eaf_local'...")
    success, output = run_psql("CREATE DATABASE eaf_local OWNER eaf_user;")
    if success:
        print("   ✅ Base créée")
    elif "already exists" in output:
        print("   ℹ️  Base existe déjà")
    else:
        print(f"   ❌ Erreur: {output}")
    
    # 3. Activer pgvector
    print("\n3. Activation extension pgvector...")
    success, output = run_psql("CREATE EXTENSION IF NOT EXISTS vector;", db="eaf_local")
    if success:
        print("   ✅ Extension activée")
    else:
        print(f"   ⚠️  pgvector non disponible: {output}")
    
    # 4. Vérifier connexion
    print("\n4. Test de connexion...")
    success, output = run_psql("SELECT 1;", db="eaf_local")
    if success:
        print("   ✅ Connexion OK")
    else:
        print(f"   ❌ Échec: {output}")
    
    print("\n=== Configuration terminée ===")
    print("\nPour utiliser cette base, mettez à jour .env:")
    print('DATABASE_URL="postgresql://eaf_user:eaf_password@localhost:5432/eaf_local"')
    print('DIRECT_URL="postgresql://eaf_user:eaf_password@localhost:5432/eaf_local"')

if __name__ == "__main__":
    main()
