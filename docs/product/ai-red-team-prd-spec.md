Owner : Product — Priorité : 🟡 — Trimestre 1

> **Dépendances :** share investisseur (`stakeholder-one-pager-templates.md`). *Peut attendre mois 2 du trimestre — spec prête.*

# AI Red Team PRD — spec (plan Pro)

## Objectif

Avant share **investisseur**, l’IA attaque le PRD (trous, hype, incohérences) — valeur Pro différenciante.

---

## Déclencheur

| Condition | Action |
|-----------|--------|
| Owner clique **Red team review** sur PRD version | Job async |
| Plan | **Pro** only (Builder = teaser 1x/mois optionnel) |

**Coût crédits :** 15 crédits (aligné tier « challenge ») ou inclus Pro quota.

---

## Prompt adversarial (structure sortie)

```json
{
  "severity_counts": { "high": 0, "medium": 0, "low": 0 },
  "findings": [
    {
      "category": "missing_risk|weak_metric|market_gap|internal_inconsistency|scope_creep",
      "section_id": "risks",
      "title": "...",
      "detail": "...",
      "suggested_fix": "..."
    }
  ],
  "investor_questions": ["...", "..."]
}
```

**Ton :** investisseur sceptique, pas encourageant.

---

## UX

| Élément | Détail |
|---------|--------|
| Rapport | Panel latéral liste findings |
| Clic finding | Scroll section + highlight |
| Export | Annexe PDF/MD optionnel v2 |

---

## Garde-fous

- Pas de conseil juridique / financier chiffré inventé
- Disclaimer : « AI review, not legal/financial advice »

---

## Métriques

| Métrique | Cible |
|----------|-------|
| % shares investisseur précédés red team | ≥ 20 % (Pro) |
| Finding resolved before share | Track |

---

## Critères done

- [x] Trigger + output + UX + garde-fous.
- [ ] Prioriser après 500 MRR ou mois 2 T1.
