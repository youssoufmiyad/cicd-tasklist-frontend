# Runbook — Vulnérabilité détectée par Trivy sur l'image Docker

## Symptômes

Comment reconnaître cette situation ?

Un job CRON exécute un scan Trivy automatiquement **tous les jours à 00:00 et à 12:00** sur l'image en cours. En cas de détection d'une vulnérabilité, les signaux suivants apparaissent :

- Le job CRON se termine en échec et émet une notification (alerte CI/CD, email ou log selon la configuration du pipeline).
- Le rapport produit par le CRON liste une ou plusieurs CVE avec la sévérité `CRITICAL`, `HIGH`, `MEDIUM` ou `LOW`.
- Le champ **Fixed Version** dans le rapport indique qu'une version corrigée est disponible (ou est vide si aucun correctif n'existe encore).
- Les packages incriminés appartiennent à l'une des deux couches de l'image :
  - `node:22-alpine` (étape build)
  - `nginx:alpine` (image finale servie en production)

> Une vulnérabilité peut apparaître sans aucune modification du code : une nouvelle CVE publiée dans la NVD sera détectée au prochain scan CRON sur une image inchangée.

---

## Prérequis

### Accès nécessaires

- Accès en lecture/écriture au dépôt Git (`main` ou branche dédiée)
- Accès à l'environnement Docker local pour rebuilder et tester l'image
- Accès au pipeline CI/CD pour relancer un build de validation

### Outils requis

| Outil | Usage |
|-------|-------|
| `trivy` / `.\trivy.exe` | Scanner l'image et générer les rapports |
| `docker` | Rebuilder l'image après correction |
| `npm` | Auditer et mettre à jour les dépendances JavaScript |
| `git` | Commiter et pousser les correctifs |

Les templates de rapport sont disponibles dans [contrib/](contrib/) (`html.tpl`, `junit.tpl`, `gitlab.tpl`).

### Connaissances préalables

- Lire un rapport Trivy : chaque ligne indique le **Package**, la **Installed Version**, la **Fixed Version** et l'identifiant CVE.
- Distinguer les deux layers de l'image : seules les CVE présentes dans `nginx:alpine` (image finale) ont un impact en production. Les CVE dans `node:22-alpine` sont isolées à l'étape de build.
- Seuils de priorité :

| Sévérité | Délai de correction |
|----------|---------------------|
| CRITICAL | Immédiat (< 24 h) — bloque tout déploiement |
| HIGH | < 72 h |
| MEDIUM | < 2 semaines |
| LOW / NEGLIGIBLE | Prochain sprint ou acceptation documentée |

---

## Procédure

### 1. Reproduire le scan localement

```bash
# Résumé rapide dans le terminal
.\trivy.exe image <nom-image>:<tag>

# Filtrer uniquement CRITICAL et HIGH pour prioriser
.\trivy.exe image --severity CRITICAL,HIGH <nom-image>:<tag>

# Rapport HTML pour analyse détaillée
.\trivy.exe image --format template --template "@contrib/html.tpl" ^
  -o rapport-trivy.html <nom-image>:<tag>

# Rapport JUnit pour intégration CI
.\trivy.exe image --format template --template "@contrib/junit.tpl" ^
  -o rapport-trivy.xml <nom-image>:<tag>
```

### 2. Identifier l'origine de la CVE

Lire la colonne **Target** dans le rapport pour déterminer le layer concerné.

**CVE dans les paquets OS Alpine** (`node:22-alpine` ou `nginx:alpine`)

Mettre à jour l'image de base dans le [Dockerfile](Dockerfile) :

```dockerfile
# Option 1 — forcer la mise à jour des paquets Alpine au build
FROM nginx:alpine
RUN apk upgrade --no-cache

# Option 2 — pointer vers un tag de version explicite plus récent
FROM nginx:1.27-alpine
```

Consulter les advisories Alpine : https://security.alpinelinux.org/

**CVE dans les dépendances npm**

```bash
# Lister les vulnérabilités npm
npm audit

# Corriger automatiquement si possible
npm audit fix

# Mettre à jour un paquet spécifique
npm update <package-name>

# Commiter le lockfile mis à jour
git add package-lock.json
git commit -m "fix: mise à jour <package> suite CVE-XXXX-XXXX"
```

> Si le `node_modules` n'est pas copié dans l'image finale `nginx`, la CVE n'a **pas d'impact en production**. Dans ce cas, passer directement à l'étape 4 (acceptation documentée).

**CVE sans correctif disponible** (`Fixed Version` vide)

1. Évaluer l'exploitabilité réelle (frontend statique servi par nginx — vecteur d'attaque souvent limité).
2. Si le risque est acceptable, ajouter une exception :
   ```bash
   echo "CVE-XXXX-XXXX" >> .trivyignore
   git add .trivyignore
   git commit -m "trivy: ignore CVE-XXXX-XXXX (pas de correctif disponible, risque documenté)"
   ```
3. Documenter la décision dans le tableau de l'étape 4.

### 3. Rebuilder et rescanner l'image

```bash
# Reconstruire l'image avec le correctif
docker build -t cicd-tasklist-frontend:fix-CVE-XXXX-XXXX .

# Vérifier que les CVE CRITICAL/HIGH ont disparu
.\trivy.exe image --severity CRITICAL,HIGH cicd-tasklist-frontend:fix-CVE-XXXX-XXXX
```

### 4. Documenter la décision

Ajouter une ligne dans ce tableau pour chaque CVE traitée :

| CVE | Sévérité | Package | Layer | Action | Responsable | Date |
|-----|----------|---------|-------|--------|-------------|------|
| CVE-XXXX-XXXX (exemple) | HIGH | libssl | nginx:alpine | Mise à jour nginx:1.27-alpine | @pseudo | AAAA-MM-JJ |
| CVE-XXXX-YYYY (exemple) | MEDIUM | lodash | npm (build only) | Accepté — non présent en prod | @pseudo | AAAA-MM-JJ |

### 5. Pousser et valider le pipeline

```bash
git push origin <branche>
```

Vérifier que le step Trivy du pipeline CI/CD passe au vert. Si le pipeline utilise un seuil de blocage, s'assurer que la configuration est cohérente avec les exceptions déclarées dans `.trivyignore`.

---

## Vérification

La situation est résolue lorsque :

- [ ] `.\trivy.exe image --severity CRITICAL,HIGH <nom-image>:<tag>` ne retourne aucune CVE (ou uniquement celles présentes dans `.trivyignore` avec justification).
- [ ] L'image est rebuildée et le scan local est propre.
- [ ] Le pipeline CI/CD passe entièrement au vert sur la branche corrigée.
- [ ] Chaque CVE traitée figure dans le tableau de documentation (étape 4 de la procédure).
- [ ] Le commit de correctif est poussé sur le dépôt et référence l'identifiant CVE dans le message.

---

## Escalade

| Situation | Action |
|-----------|--------|
| CVE CRITICAL sans correctif disponible | Alerter le lead technique et le responsable sécurité **dans les 4 h** |
| Exploitabilité confirmée en production | Stopper immédiatement les déploiements et ouvrir une procédure d'incident |
| Incertitude sur l'impact réel | Ouvrir une issue GitHub avec le label `security` en joignant le rapport HTML Trivy |
| Blocage sur la correction après 48 h | Escalader au responsable du projet pour arbitrage (acceptation formelle ou contournement) |

---

## Historique

| Date | Modification |
|------|-------------|
| 2026-06-25 | Création du runbook |
