# /audit-doc-commercial — Audit commercial & viabilité (documentation)

## Usage

```txt
/audit-doc-commercial
/audit-doc-commercial <focus optionnel>
```

Exemples de focus optionnel : `gtm`, `pricing`, `retention`, `express`, `phase-1`, `moat`.

Lead : agent principal (pas de sous-agent obligatoire). Lecture **read-only** sur `docs/**` ; le code source n’est consulté que si un document y renvoie explicitement et qu’une affirmation « shipped » doit être recoupée.

---

## Purpose

`/audit-doc-commercial` produit un **audit critique** de la viabilité commerciale, produit, UX et rétention du projet **uniquement à partir de la documentation** (`docs/` et annexes listées ci-dessous).

Ce n’est **pas** un audit technique de code, **pas** un `/plan`, **pas** un `/prd update`. Aucune modification de fichier sauf si l’utilisateur demande explicitement de **persister** le rapport (voir § Persistance optionnelle).

**Ton attendu :** extrêmement critique, honnête, précis — remettre en question les choix documentés si cela améliore les chances de succès.

**Langue de sortie :** **français** (sauf citations verbatim de docs EN).

---

## Pre-flight

1. Lire `docs/README.md` — carte des dossiers et hiérarchie de vérité.
2. Lire **obligatoirement** (au minimum) :
   - `docs/prd/PRD.md` + `docs/prd/state.md`
   - `docs/prd/questions/open-questions.md`
   - `docs/product-decisions/` (tous les PD-*.md)
   - `docs/WORK_QUEUE.md` + `docs/TODO.md`
   - `docs/gtm/` (positionnement, pricing, entretiens, fake door, viral, PH, etc.)
   - `docs/product/feature-areas/` (toutes les FA)
   - `docs/product/scope-slices/` (échantillon représentatif : **toutes** les slices `ready-for-user-stories` ou `shipped`, plus les slices citées dans le PRD Flow Inventory)
   - `docs/execution/user-stories/` et `docs/execution/plans/` — au moins les entrées liées aux flows **Shipped** et **Phase 1** du PRD
   - Specs produit racine : `docs/product/*-spec.md`, `docs/product/*-brief.md`, diagnostics (`product-hics-diagnostic.md`, `under-construction-inventory.md`, etc.)
   - `docs/ops/` (go-live, PostHog, métriques)
   - `docs/state/HANDOFF.md` si présent
3. **Inventaire exhaustif :** lister via `Glob` tous les fichiers sous `docs/**` (hors binaires). Pour chaque dossier majeur, noter ce qui a été lu vs ignoré (avec raison : doublon, brouillon vide, template seul).
4. Si `<focus>` est fourni, prioriser les chemins liés au focus tout en gardant le PRD et les gates Phase 1 en contexte.
5. **Recoupement shipped vs doc :** si le PRD ou `WORK_QUEUE` affirme **Shipped**, vérifier au plus une fois dans `apps/web/` que la surface existe (grep ciblé) — signaler tout **écart doc ↔ réalité** comme risque critique.
6. **SISO :** classification EXECUTION (read-only). Pas d’ORANGE/RED pour la lecture doc seule.

---

## Rôles à incarner (lens combiné)

Agir en expert cumulant :

- Chef de produit SaaS
- Entrepreneur startup
- Directeur commercial
- UX/UI Designer
- Consultant marketing
- Investisseur capital-risque
- Client final exigeant

Objectif : déterminer si le projet est **viable**, **vendable** et capable de **fidéliser** durablement.

---

## Comportement — analyse en 8 blocs

Produire **tous** les blocs suivants. Chaque affirmation importante doit citer au moins une source : `chemin/doc.md` ou section nommée.

### 1. Compréhension du projet

- Résumé en quelques phrases
- Proposition de valeur (claire, testable)
- Problème résolu
- Cible client idéale (ICP) — précision : solo founder ? équipe ? marché EN/FR ?

### 2. Audit fonctionnel

Pour **chaque** Feature Area / flow majeur du PRD (Flow Inventory + FAs) :

| Dimension | Contenu |
|-----------|---------|
| Utilité | Pourquoi ça existe |
| Pertinence | Forte / moyenne / faible pour l’ICP |
| Valeur réelle | Oui / partielle / marketing-only |
| Verdict | Garder / simplifier / reporter / couper |

Synthèse transversale :

- Fonctionnalités **inutiles ou secondaires** (sur-découpage, moat prématuré, « under construction » qui brouille)
- Fonctionnalités **manquantes** pour vendre ou retenir

### 3. Analyse de marché

- Besoin réel vs nice-to-have
- Concurrents potentiels (directs et substituts : Notion, Linear, Cursor seul, ChatGPT, etc. — justifier)
- Avantages concurrentiels **défendables** vs **narratif seulement**
- Risques de marché
- Potentiel commercial (TAM/SAM qualitatif — pas de chiffres inventés sans source doc)

### 4. Analyse de rétention client

- Pourquoi un client **reste**
- Pourquoi un client **part**
- Points de friction (doc : express checklist, crédits, gates, share, export)
- Dépendance positive (lock-in sain : versions, décisions, drift, data room…)
- Mécanismes de fidélisation **à ajouter**

Propositions concrètes pour augmenter : rétention, fréquence d’usage, valeur perçue, bouche-à-oreille.

### 5. Analyse commerciale

- Facilement vendable vs difficile à vendre
- Objections clients probables + réponses recommandées
- Arguments commerciaux à mettre en avant (preuves doc : entretiens, fake door, pricing copy)
- Fonctionnalités **premium** crédibles (Builder, packs, moat T1…)

### 6. Analyse UX et expérience client

- Simplicité d’utilisation (standard vs express)
- Clarté de l’offre (crédits vs abonnement vs packs — confusion ?)
- Parcours utilisateur (onboarding → PRD → share → export → post-PRD)
- Risques d’abandon (où et pourquoi)
- Améliorations UX **prioritaires** (top 5)

### 7. Rentabilité

- Sources de revenus possibles (doc : Stripe packs, Builder Phase 1, concierge…)
- Coûts probables (IA, infra, support, conformité)
- Risques financiers
- Opportunités de monétisation non exploitées

### 8. Plan d'amélioration (priorisé)

Classer **toutes** les recommandations :

#### Critique

À corriger **avant** toute commercialisation agressive.

#### Important

Améliore fortement les ventes ou la rétention.

#### Bonus

Avantage concurrentiel différenciant mais non bloquant.

---

## Livrables obligatoires (scores)

Fournir **avec justification** (2–4 phrases par note, liées aux sections ci-dessus) :

| Métrique | Format |
|----------|--------|
| Note globale | /100 |
| Potentiel commercial | /100 |
| Rétention client | /100 |
| Différenciation | /100 |
| Chances de succès | **Faibles** \| **Moyennes** \| **Bonnes** \| **Très bonnes** |

**Échelle indicative (ne pas s’en écarter sans expliquer) :**

- 0–39 : fondamentalement fragile
- 40–59 : prometteur mais gaps majeurs
- 60–79 : viable avec exécution disciplinée
- 80–100 : forte cohérence doc + marché + rétention (rare — justifier si >75)

---

## Conclusion obligatoire

1. **5 plus gros points forts** (factuels, cités)
2. **5 plus gros risques** (factuels, cités — inclure incohérences doc, gates non remplies, scope creep)
3. **10 actions prioritaires** (ordonnées, actionnables, liées aux gates PRD si pertinent : Gate A/B/C)
4. **Stratégie concrète** (3–6 paragraphes) : rendre le projet plus attractif, plus vendable, plus fidélisant — alignée sur `docs/gtm/` et Phase 1 wedge

---

## Format de réponse

Utiliser cette structure markdown (titres exacts) :

```txt
# Audit commercial — Zedos
Date: <YYYY-MM-DD>
Périmètre lu: <N fichiers> — focus: <all|focus>
Écarts doc/code signalés: <oui/non — liste>

## 1. Compréhension du projet
...

## 2. Audit fonctionnel
### <Feature / Flow>
...

## 3. Analyse de marché
...

## 4. Rétention client
...

## 5. Analyse commerciale
...

## 6. UX & expérience client
...

## 7. Rentabilité
...

## 8. Plan d'amélioration
### Critique
### Important
### Bonus

## Scores
| Métrique | Note | Justification courte |
...

## Conclusion
### Points forts (5)
### Risques (5)
### Actions prioritaires (10)
### Stratégie
```

Pour les tableaux larges (≥8 lignes comparatives features/concurrents), préférer une **Cursor canvas** (`.cursor/canvases/audit-doc-commercial-<date>.canvas.tsx`) plutôt qu’un mur markdown.

---

## Persistance optionnelle

Par défaut : **réponse chat uniquement**.

Si l’utilisateur demande de sauvegarder :

- Proposer `docs/audit/commercial-audit-YYYY-MM-DD.md`
- Ne pas écraser un fichier existant sans confirmation
- Append une ligne dans `docs/EXECUTION_LOG.md` uniquement si l’utilisateur le demande

---

## Hard rules

- **Read-only** sur le repo (sauf persistance explicitement demandée).
- Ne pas lancer `/implement`, `/plan`, `/prd update` automatiquement.
- Ne pas lire `.env*` — uniquement `.env.example` si besoin de variables.
- Ne pas inventer de métriques business (MRR, churn, NPS) absentes des docs.
- Signaler explicitement les **contradictions** entre PRD, WORK_QUEUE, GTM et slices.
- Traiter les **gates Phase 1** (interviews, express <45 min, fake door, MRR) comme contraintes réelles — pas comme décor.
- Distinguer **v0 shipped**, **Phase 1 documenté**, **moat T1** et **under construction** — ne pas vendre au client ce qui est grayed ou gated.
- Être **plus sévère** qu’un pitch deck : un investisseur ou un fondateur sceptique doit pouvoir utiliser ce rapport tel quel.

---

## Après l'audit (suggestions utilisateur)

Proposer **une seule** ligne de suite, sans exécuter :

- `/prd challenge` — si le narratif produit est incohérent
- `/prd prioritize` — si le scope doit être re-ranké
- Mettre à jour `docs/gtm/` ou `docs/product/` — si gaps commerciaux identifiés (avec `/prd update` si changement de loi produit)
