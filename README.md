# Séminaire des doctorants en économie numérique

Site académique sobre, en français, sans dépendance externe : programme annuel,
archives et équipe. La typographie utilise les polices disponibles sur l’appareil.

## Publication sur GitHub Pages

Le dépôt dédié est `seminaire-economie-numerique/seminaire-economie-numerique.github.io`. À chaque modification
enregistrée sur la branche `main`, GitHub Actions régénère et publie le site.
Le workflow est défini dans `.github/workflows/pages.yml` et publie uniquement
le dossier `dist`. Aucun nom de domaine personnalisé n’est configuré pour ce dépôt.

Le site est publié à la racine de https://seminaire-economie-numerique.github.io/.
Le compte personnel reste indépendant de cet espace dédié au séminaire.

La commande utilisée pour la publication est :

```powershell
node generer.mjs
```

Pour mettre le programme à jour, modifier `contenu.mjs`, enregistrer la
modification sur GitHub, puis attendre la réussite de « Publier le séminaire »
dans l’onglet Actions. Aucun secret ou jeton personnel n’est nécessaire au workflow.

## Personnaliser le contenu

Le site est disponible en français à la racine et en anglais sous `/en/`.
Le sélecteur FR / EN conserve la page (programme, équipe ou archive).
Les traductions éditoriales se trouvent dans les champs suffixés `En` de `contenu.mjs` ;
les libellés d’interface sont regroupés dans `traductions.mjs`.
Les titres des présentations et les noms des institutions sont conservés dans leur langue d’origine.
L’adresse `seminaire.contact` alimente le lien de contact en bas de chaque page.

Tout le contenu éditorial se trouve dans `contenu.mjs` :

- `seminaire` : nom, présentation du concept, remerciements aux lieux d’accueil,
  année courante et horaire habituel (15 h) ;
- `programmes` : séances classées par année universitaire ;
- `equipe.bureau` et `equipe.doctorants` : nom, statut, domaines de recherche,
  affiliation et URL facultative. La section des doctorants associés est masquée
  tant que cette liste est vide.

Le site contient les informations fournies par les organisateurs : l’archive
2025–2026 et le programme 2026–2027. Le lieu du 7 septembre 2026 n’a pas encore
été renseigné. La séance d’octobre reste à organiser.

Chaque séance accepte les champs `date` (AAAA-MM-JJ, ou AAAA-MM lorsque seul
le mois est fixé), `debut`, `fin` (HH:MM), `lieu`, `adresse`, `note` et
`presentations`. En l’absence de `debut`, l’horaire habituel est utilisé.
L’heure de fin et le lieu sont affichés uniquement lorsqu’ils sont renseignés.

`presentations` est une liste de communications, chacune avec `titre`,
`intervenant`, `affiliation`, et éventuellement `langue`, `resume` ou `url`.
Les résumés se déplient lorsqu’ils sont fournis. Les URL doivent être des
adresses HTTP(S). Une séance à organiser peut avoir une liste vide et un `titre`.
La séance du 19 juin 2026 regroupe ainsi trois présentations sous la même date.
Les séances sont affichées de la plus récente à la plus ancienne dans chaque
édition, indépendamment de leur ordre dans le fichier. L’ordre des présentations
au sein d’une séance est conservé.

Après une modification, exécuter depuis ce dossier :

```powershell
node generer.mjs
```

Ajouter une clé telle que `2027-2028` dans `programmes`, puis renseigner
`anneeCourante` avec cette valeur pour ouvrir une nouvelle édition. Les autres
années restent accessibles dans les archives. Les pages sont pré-générées et
fonctionnent sans JavaScript ; seul le sélecteur rapide d’année l’utilise.

## Aperçu local

```powershell
node serveur.mjs
```

Ouvrir `http://127.0.0.1:4173` dans un navigateur. Arrêter avec Ctrl+C.

## Structure

- `contenu.mjs` : contenu à modifier ;
- `generer.mjs` : génération des pages HTML ;
- `dist/style.css` : présentation, adaptation mobile et impression ;
- `dist/navigation.js` : sélecteur d’année ;
- `dist/index.html` : programme de l’année courante ;
- `dist/archives/` : éditions précédentes ;
- `dist/equipe/index.html` : bureau et doctorants associés ;
- `.github/workflows/pages.yml` : publication automatique sur GitHub Pages.

Pour un autre hébergement statique, publier uniquement le dossier `dist` après
génération sans `--base-path` si le site est à la racine du domaine. Ce projet ne comprend pas
d’interface d’administration : les mises à jour passent par `contenu.mjs`.
