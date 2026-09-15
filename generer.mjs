import { mkdir, writeFile } from 'node:fs/promises';
import { seminaire, programmes, equipe } from './contenu.mjs';

// Un site de projet GitHub Pages est servi sous /nom-du-depot/.
// Sans option, les fichiers restent utilisables à la racine en aperçu local.
const basePathIndex = process.argv.indexOf('--base-path');
const basePath = basePathIndex === -1 ? '' : process.argv[basePathIndex + 1];
if (typeof basePath !== 'string' || !/^(\/[a-zA-Z0-9_-]+)*$/.test(basePath)) {
  throw new Error('Le chemin de base doit être vide ou de la forme /nom-du-depot.');
}

const e = (value) => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const annee = (value) => value.replace('-', '–');
const annees = Object.keys(programmes).sort().reverse();
const programmeUrl = (year) => year === seminaire.anneeCourante ? '/' : `/archives/${year}/`;
const favicon = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#fff"/><text x="24" y="35" text-anchor="middle" font-family="Times New Roman,serif" font-size="36" font-weight="bold" fill="#202020">S</text></svg>');

function layout(title, content, active = 'programme') {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${e(title)} — ${e(seminaire.nom)}</title>
  <meta name="description" content="${e(seminaire.introduction)} Consultez le programme, les archives et l’équipe du séminaire.">
  <meta name="theme-color" content="#ffffff">
  <link rel="icon" type="image/svg+xml" href="${favicon}">
  <link rel="stylesheet" href="/style.css">
  <script src="/navigation.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#contenu">Aller au contenu</a>
  <div class="page">
    <header class="site-header">
      <h1 class="site-title"><a href="/">${e(seminaire.nom).replace(' en économie numérique', '<br>en économie numérique')}</a></h1>
      <p class="site-description">${e(seminaire.introduction)}</p>
      <nav aria-label="Navigation principale"><a href="/" ${active === 'programme' ? 'aria-current="page"' : ''}>Séminaire</a><a href="/equipe/" ${active === 'equipe' ? 'aria-current="page"' : ''}>Bureau et équipe</a></nav>
    </header>
    <main id="contenu">${content}</main>
    <footer class="site-footer"><p>${e(seminaire.nom)}</p><a href="/#archives">Archives du programme</a></footer>
  </div>
</body>
</html>`.replace(/\b(href|src|value)="\/(?!\/)/g, (_, attribute) => `${attribute}="${basePath}/`);
}

function presentation(expose) {
  return `<div class="presentation"><h3${expose.langue ? ` lang="${e(expose.langue)}"` : ''}>${e(expose.titre)}</h3><p class="speaker">${e(expose.intervenant)}<span class="affiliation">${e(expose.affiliation)}</span></p>${expose.resume ? `<details><summary>Résumé</summary><p class="abstract">${e(expose.resume)}</p></details>` : ''}${expose.url ? `<p><a class="text-link" href="${e(safeUrl(expose.url))}">Plus d’informations</a></p>` : ''}</div>`;
}

function session(seance) {
  const moisSeul = /^\d{4}-\d{2}$/.test(seance.date);
  const date = new Date(seance.date + (moisSeul ? '-01' : '') + 'T12:00:00Z');
  const dateComplete = new Intl.DateTimeFormat('fr-FR', { ...(moisSeul ? {} : {day:'numeric'}), month:'long', year:'numeric', timeZone:'UTC'}).format(date);
  const horaire = value => value.replace(':', ' h ').replace(' h 00', ' h');
  const debut = seance.debut ?? seminaire.horaire;
  const lieu = [seance.lieu, seance.adresse].filter(Boolean).join(' — ');
  return `<li class="session">
    <div class="session-meta"><time class="session-date" datetime="${e(seance.date)}">${e(dateComplete)}</time>${debut ? `<p class="session-time">${e(horaire(debut))}${seance.fin ? ` – ${e(horaire(seance.fin))}` : ''}</p>` : ''}</div>
    <div class="session-main">${seance.presentations.length ? seance.presentations.map(presentation).join('') : `<h3>${e(seance.titre ?? 'Séance à organiser')}</h3>`}${seance.note ? `<p class="session-note">${e(seance.note)}</p>` : ''}${lieu ? `<p class="session-place">${e(lieu)}</p>` : ''}</div>
  </li>`;
}

function programmePage(year) {
  const sessions = [...programmes[year]].sort((a, b) => b.date.localeCompare(a.date));
  const archived = year !== seminaire.anneeCourante;
  return layout(`Programme ${annee(year)}`, `
    ${!archived ? `<section class="seminar-concept" aria-label="Présentation du séminaire"><p>${e(seminaire.concept)}</p><p>${e(seminaire.accueil)}</p></section>` : ''}
    <section class="programme" aria-labelledby="titre-programme">
      <div class="section-heading"><h2 id="titre-programme">Programme ${annee(year)}</h2><div class="year-picker" hidden><label for="edition">Année<span class="visually-hidden"> universitaire (ouvre le programme sélectionné)</span></label><select id="edition">${annees.map(y => `<option value="${programmeUrl(y)}"${y === year ? ' selected' : ''}>${annee(y)}</option>`).join('')}</select></div></div>
      ${archived ? '<p class="archive-note">Archives — année universitaire '+annee(year)+'.</p>' : ''}
      <div class="table-heading" aria-hidden="true"><span>Date et horaire</span><span>Séance</span></div>
      ${sessions.length ? `<ol class="sessions">${sessions.map(session).join('\n')}</ol>` : '<p class="empty-programme">Le programme sera annoncé prochainement.</p>'}
    </section>
    <section class="archives" id="archives" aria-labelledby="titre-archives"><h2 id="titre-archives">Programmes par année</h2><nav aria-label="Éditions du séminaire">${annees.map(y => `<a href="${programmeUrl(y)}"${y === year ? ' aria-current="page"' : ''}>${annee(y)}${y === seminaire.anneeCourante ? ' <span>(année en cours)</span>' : ''}</a>`).join('')}</nav></section>
  `);
}

function safeUrl(value) {
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Les liens doivent utiliser http ou https.');
  return url.href;
}

function personne(membre) {
  return `<li class="personne"><h4>${e(membre.nom)}</h4><p>${e(membre.statut)}${membre.domaines ? `<span class="research-fields" lang="en">${e(membre.domaines)}</span>` : ''}<span>${e(membre.affiliation)}</span></p>${membre.url ? `<a class="text-link" href="${e(safeUrl(membre.url))}">Page personnelle<span class="visually-hidden"> de ${e(membre.nom)}</span></a>` : ''}</li>`;
}

function equipePage() {
  return layout('Bureau et équipe', `
    <h2 class="team-heading">Bureau et équipe · ${annee(seminaire.anneeCourante)}</h2>
    <section class="team-section" aria-labelledby="titre-bureau"><h3 id="titre-bureau">Bureau / comité d’organisation</h3><ul class="people">${equipe.bureau.map(personne).join('')}</ul></section>
    ${equipe.doctorants.length ? `<section class="team-section" aria-labelledby="titre-doctorants"><h3 id="titre-doctorants">Doctorantes et doctorants associés</h3><ul class="people">${equipe.doctorants.map(personne).join('')}</ul></section>` : ''}
    <div class="return-programme"><a class="text-link" href="/">Programme ${annee(seminaire.anneeCourante)}</a></div>
  `, 'equipe');
}

if (!programmes[seminaire.anneeCourante]) throw new Error('Le programme de l’année courante est absent.');
await mkdir('dist', { recursive: true });
for (const year of annees) {
  const directory = year === seminaire.anneeCourante ? 'dist' : `dist/archives/${year}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/index.html`, programmePage(year));
}
await mkdir('dist/equipe', { recursive: true });
await writeFile('dist/equipe/index.html', equipePage());
await writeFile('dist/404.html', layout('Page introuvable', '<section class="not-found"><h2>Page introuvable</h2><p>Cette page n’existe pas.</p><a class="text-link" href="/">Revenir au programme</a></section>'));
console.log(`${annees.length} programmes, la page équipe et la page 404 générés.`);
