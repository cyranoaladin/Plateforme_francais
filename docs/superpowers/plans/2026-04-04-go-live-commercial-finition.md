# Go-Live Commercial Finition Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finaliser les derniers correctifs structurels go-live en production sans laisser de dette technique active.

**Architecture:** Diagnostiquer d'abord l'état réel en local et sur le serveur, corriger uniquement les écarts confirmés, puis valider localement et redéployer pour aligner la prod sur le SHA final. Les changements touchent la persistance uploads, la documentation publique, la récupération de données legacy, la stabilité MCP et le monitoring minimal d'exploitation.

**Tech Stack:** Next.js 16, TypeScript, Prisma/PostgreSQL, PM2, bash deploy script, SSH production.

---
