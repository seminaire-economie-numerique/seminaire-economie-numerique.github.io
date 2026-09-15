# Séminaire des doctorants en économie numérique

Site académique sobre, en français, sans dépendance externe : programme annuel,
archives et équipe. La typographie utilise les polices disponibles sur l’appareil.

## Personnaliser le contenu

Tout le contenu éditorial se trouve dans `contenu.mjs` :

- `seminaire` : nom, phrase de présentation, année courante, indication de démonstration ;
- `programmes` : séances classées par année universitaire ;
- `equipe.bureau` et `equipe.doctorants` : nom, statut, affiliation et URL facultative.

Les séances, les personnes, les affiliations et les lieux sont **fictifs**.
Après avoir remplacé les exemples par des informations vérifiées, passer
`demonstration` à `false` pour retirer la mention de démonstration.

Chaque séance accepte les champs `date` (AAAA-MM-JJ), `debut`, `fin` (HH:MM),
`titre`, `intervenant`, `affiliation`, `lieu`, `adresse`, `resume` et `url`.
`resume` et `url` sont facultatifs. Les URL doivent être des adresses HTTP(S).

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
- `.openai/hosting.json` : identité du site et dossier publié.

Pour un hébergement statique, publier uniquement le dossier `dist`. Les chemins
sont prévus pour un site à la racine de son domaine. Ce projet ne comprend pas
d’interface d’administration : les mises à jour passent par `contenu.mjs`.
