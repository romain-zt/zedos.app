Owner : Product — Priorité : 🟡 — Mois 1

> **Dépendances :** `docs/product/onboarding-three-intentions-spec.md` (carte I3), FA `prd-import`. *Peut attendre après playbook express — doc livré mois 1.*

# Guide utilisateur — Importer un PRD externe

## Pour qui

Tu as déjà un PRD dans **ChatGPT, Claude, Notion, Google Doc exporté**, ou un fichier `.md` / `.txt`.

---

## Étapes (création projet)

1. **New project** → carte **I already have a document**.
2. Active **Import existing PRD** (toggle).
3. **Coller** le texte **ou** **uploader** `.md` / `.txt`.
4. *(Optionnel)* Coche **Also fast-track (express)** si tu dois partager aujourd’hui.
5. **Create** → le contenu devient **version 1** in-app.

**Crédits :** l’import seul **ne consomme pas** de crédits IA (parcours app).

---

## Formats acceptés (v0)

| Source | Comment |
|--------|---------|
| ChatGPT | Copier la réponse → coller (titres `#` conservés) |
| Claude | Idem |
| Notion | Export Markdown ou copier la page |
| Fichier | `.md`, `.txt` — pas PDF v0 |

---

## Après import

| Situation | Action recommandée |
|-----------|-------------------|
| Doc déjà structuré | Partager ou passer en **standard** pour enrichir |
| Doc brut | 1–2 tours clarify ciblés **ou** regen section par section |
| Deadline | Activer **express** + regen livrable 12 sections |

---

## Combo import + express

| Ordre | Résultat |
|-------|----------|
| Import puis express | v1 = ton texte ; livrable express = regen **lean** sur base import |
| Express puis import | Éviter — préférer import à la création |

---

## Limites (honnêtes)

- Pas de sync Notion live.
- Pas d’import après création projet en v0 (futur slice).
- Qualité regen = qualité du texte collé (garbage in → garbage out).

---

## FAQ

**Q : ChatGPT suffit ?**  
R : Pour un doc jetable oui. Zedos ajoute **versions, historique décisions, share, Cursor export**.

**Q : Puis-je inviter mon associé ?**  
R : v0 : **share link** ; commentaires équipe = bientôt (PD-003).

---

## Critères done

- [x] Guide fondateur complet.
- [ ] Lien help center / in-app tooltip import.
