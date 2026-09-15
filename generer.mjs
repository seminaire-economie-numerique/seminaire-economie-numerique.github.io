import { mkdir, writeFile } from 'node:fs/promises';
import { seminaire, programmes, equipe } from './contenu.mjs';

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
</html>`;
}

function session(seance) {
  const date = new Date(seance.date + 'T12:00:00Z');
  const dateComplete = new Intl.DateTimeFormat('fr-FR', {day:'numeric', month:'long', year:'numeric', timeZone:'UTC'}).format(date);
  const horaire = value => value.replace(':', ' h ').replace(' h 00', ' h');
  return `<li class="session">
    <div class="session-meta"><time class="session-date" datetime="${e(seance.date)}">${e(dateComplete)}</time><p class="session-time">${e(horaire(seance.debut))} – ${e(horaire(seance.fin))}</p></div>
    <div class="session-main"><h3>${e(seance.titre)}</h3><p class="speaker">${e(seance.intervenant)}<span class="affiliation">${e(seance.affiliation)}</span></p><p class="session-place">${e(seance.lieu)} — ${e(seance.adresse)}</p>${seance.resume ? `<details><summary>Résumé</summary><p class="abstract">${e(seance.resume)}</p>${seance.url ? `<p><a class="text-link" href="${e(safeUrl(seance.url))}">Plus d’informations</a></p>` : ''}</details>` : seance.url ? `<p><a class="text-link" href="${e(safeUrl(seance.url))}">Plus d’informations</a></p>` : ''}</div>
  </li>`;
}

function programmePage(year) {
  const sessions = programmes[year];
  const archived = year !== seminaire.anneeCourante;
  return layout(`Programme ${annee(year)}`, `
    <section class="programme" aria-labelledby="titre-programme">
      <div class="section-heading"><h2 id="titre-programme">Programme ${annee(year)}</h2><div class="year-picker" hidden><label for="edition">Année<span class="visually-hidden"> universitaire (ouvre le programme sélectionné)</span></label><select id="edition">${annees.map(y => `<option value="${programmeUrl(y)}"${y === year ? ' selected' : ''}>${annee(y)}</option>`).join('')}</select></div></div>
      ${archived ? '<p class="archive-note">Archives — année universitaire '+annee(year)+'.</p>' : ''}
      ${seminaire.demonstration ? '<p class="demo-note">Programme d’exemple : les séances, noms et lieux ci-dessous sont fictifs.</p>' : ''}
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
  return `<li class="personne"><h4>${e(membre.nom)}</h4><p>${e(membre.statut)}<span>${e(membre.affiliation)}</span></p>${membre.url ? `<a class="text-link" href="${e(safeUrl(membre.url))}">Page personnelle<span class="visually-hidden"> de ${e(membre.nom)}</span></a>` : ''}</li>`;
}

function equipePage() {
  return layout('Bureau et équipe', `
    <h2 class="team-heading">Bureau et équipe · ${annee(seminaire.anneeCourante)}</h2>
    ${seminaire.demonstration ? '<p class="demo-note">Équipe d’exemple : les noms et les affiliations ci-dessous sont fictifs.</p>' : ''}
    <section class="team-section" aria-labelledby="titre-bureau"><h3 id="titre-bureau">Bureau / comité d’organisation</h3><ul class="people">${equipe.bureau.map(personne).join('')}</ul></section>
    <section class="team-section" aria-labelledby="titre-doctorants"><h3 id="titre-doctorants">Doctorantes et doctorants associés</h3><ul class="people">${equipe.doctorants.map(personne).join('')}</ul></section>
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
