Owner : Product — Priorité : 🟡 — Mois 1

> **Dépendances :** Q-006 PRD (export pas requis pour « done »). *Priorité v0.1 avant PDF.*

# Export Markdown v0.1 — spec comportement

## Décision

| Format | Priorité v0.1 |
|--------|-----------------|
| **Markdown (.md)** | **P0** — fast follow |
| PDF | **P2** — après MD + demande concierge |

---

## Déclencheur UI

- Bouton existant `prd.exportMd` — actuellement visible ; comportement à aligner.
- Emplacement : PRD viewer toolbar + menu version.

---

## Contenu fichier exporté

```markdown
# {{title}}
*Zedos PRD v{{version_number}} · {{deliverable_kind}} · {{exported_at}}*

{{#if express}}
> **Express version — to be deepened.** (PD-002)
{{/if}}

## {{section.title}}
{{section.content}}

...
```

- Ordre sections : ordre canonique express (12) ou standard (8).
- Inclure `version_summary` en bloc quote sous le titre.

---

## Règles

| Règle | Détail |
|-------|--------|
| Crédits | Export MD = **0 crédit** (lecture locale) |
| Share | Export ≠ share link ; pas de sync auto |
| Historique | Export snapshot **version active** uniquement |
| Encodage | UTF-8, LF, nom fichier `{{slug}}-prd-v{{n}}.md` |

---

## Hors scope v0.1

- Export question history annexe
- Export decision graph (pas encore)
- Batch export multi-versions zip

---

## Critères done

- [x] Décision MD avant PDF + comportement spec.
- [ ] Slice WORK_QUEUE si fondateur priorise.
