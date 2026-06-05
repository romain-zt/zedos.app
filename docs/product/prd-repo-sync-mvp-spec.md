Owner : Product — Priorité : 🟡 — Mois 1

> **Dépendances :** export MD v0.1 (`export-markdown-v0.1-spec.md`). *Peut attendre trimestre si concierge saturé — spec livrée.*

# Sync `docs/prd/` ↔ app — MVP spec

## Objectif

Pont **unidirectionnel** app → repo : une version PRD exportée en MD vers un chemin type `docs/prd/exports/` — **pas** de sync bidirectionnelle mois 1.

---

## User story

**En tant que** fondateur qui vit dans Cursor,  
**je veux** exporter la version PRD active vers un fichier MD dans mon repo,  
**afin d’** aligner agents et `docs/prd/` sans copier-coller.

---

## Comportement MVP

| Étape | Détail |
|-------|--------|
| 1 | Bouton **Export to repo path** (ou copie chemin suggéré) |
| 2 | Génère MD (même format `export-markdown-v0.1-spec.md`) |
| 3 | Téléchargement fichier **ou** instruction « Save as `docs/prd/{{project-slug}}-v{{n}}.md` » |

**v0 manual :** pas de commit Git automatique.

---

## Chemin canonique suggéré

```
docs/prd/
  exports/
    {{project-slug}}/
      v{{version}}.md
      LATEST.md          # copie symlink instruction (manuel)
```

---

## Hors scope MVP

- Webhook GitHub commit
- Import repo → app (slice séparée)
- Merge conflit deux sources

---

## Critères done

- [x] Spec MVP unidirectionnelle.
- [ ] Prioriser après MD export button shipped.
