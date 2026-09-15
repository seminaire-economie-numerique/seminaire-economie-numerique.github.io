import { mkdir, writeFile } from 'node:fs/promises';
import { seminaire, programmes, equipe } from './contenu.mjs';

const e = (value) => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const annee = (value) => value.replace('-', '–');
const annees = Object.keys(programmes).sort().reverse();
const programmeUrl = (year) => year === seminaire.anneeCourante ? '/' : `/archives/${year}/`;
const favicon = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#783c35"/><text x="24" y="34" text-anchor="middle" font-family="Georgia,serif" font-size="34" fill="#fff">é</text></svg>');

function layout(title, content, active = 'programme') {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${e(title)} — ${e(seminaire.nom)}</title>
  <meta name="description" content="${e(seminaire.introduction)} Consultez le programme, les archives et l’équipe du séminaire.">
  <meta name="theme-color" content="#fcfcfa">
  <link rel="icon" type="image/svg+xml" href="${favicon}">
  <link rel="stylesheet" href="/style.css">
  <script src="/navigation.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#contenu">Aller au contenu</a>
  <div class="page">
    <header class="site-header">
      <a class="identity" href="/" aria-label="${e(seminaire.nom)} — Accueil"><span class="monogram" aria-hidden="true">é<span>/</span>n</span><span class="identity-text">RECHERCHE DOCTORALE<br><span>ÉCONOMIE NUMÉRIQUE</span></span></a>
      <nav aria-label="Navigation principale"><a href="/" ${active === 'programme' ? 'aria-current="page"' : ''}>Le séminaire</a><a href="/equipe/" ${active === 'equipe' ? 'aria-current="page"' : ''}>Bureau & équipe</a></nav>
    </header>
    <main id="contenu">${content}</main>
    <footer class="site-footer"><p>${e(seminaire.nom)}</p><a href="/#archives">Les éditions du séminaire</a></footer>
  </div>
</body>
</html>`;
}

function session(seance) {
  const date = new Date(seance.date + 'T12:00:00Z');
  const mois = new Intl.DateTimeFormat('fr-FR', {month:'short', timeZone:'UTC'}).format(date);
  const jour = date.getUTCDate().toString().padStart(2, '0');
  const horaire = value => value.replace(':', ' h ').replace(' h 00', ' h');
  return `<li class="session">
    <time class="session-date" datetime="${e(seance.date)}"><span class="date-day">${jour}</span><span class="date-month">${e(mois)} ${date.getUTCFullYear()}</span></time>
    <div class="session-time">${e(horaire(seance.debut))}<span class="time-end">– ${e(horaire(seance.fin))}</span></div>
    <div class="session-main"><h3>${e(seance.titre)}</h3><p class="speaker">${e(seance.intervenant)}<span class="affiliation">${e(seance.affiliation)}</span></p>${seance.resume ? `<details><summary><span>Résumé de la séance</span><span class="disclosure" aria-hidden="true"></span></summary><p class="abstract">${e(seance.resume)}</p>${seance.url ? `<p><a class="text-link" href="${e(safeUrl(seance.url))}">Plus d’informations</a></p>` : ''}</details>` : seance.url ? `<p><a class="text-link" href="${e(safeUrl(seance.url))}">Plus d’informations</a></p>` : ''}</div>
    <p class="session-place">${e(seance.lieu)}<span>${e(seance.adresse)}</span></p>
  </li>`;
}

function programmePage(year) {
  const sessions = programmes[year];
  const archived = year !== seminaire.anneeCourante;
  return layout(`Programme ${annee(year)}`, `
    <section class="introduction" aria-labelledby="titre-seminaire">
      <div><p class="eyebrow">LE SÉMINAIRE</p><h1 id="titre-seminaire">${e(seminaire.nom).replace(' en économie numérique', '<br><em>en économie numérique</em>')}</h1><p class="intro-text">${e(seminaire.introduction)}</p></div>
      <div class="edition"><span class="eyebrow">ANNÉE UNIVERSITAIRE</span><p>${annee(year)}</p>${archived ? '<span class="archive-label">Édition archivée</span>' : ''}</div>
    </section>
    ${seminaire.demonstration ? '<p class="demo-note"><span>Édition de démonstration</span> — Les séances et les noms présentés sont fictifs.</p>' : ''}
    <section class="programme" aria-labelledby="titre-programme">
      <div class="section-heading"><div class="heading-group"><h2 id="titre-programme">Programme</h2><span class="session-count">${sessions.length} ${sessions.length === 1 ? 'séance' : 'séances'}</span></div><div class="year-picker" hidden><label class="visually-hidden" for="edition">Choisir une année universitaire (ouvre le programme sélectionné)</label><select id="edition">${annees.map(y => `<option value="${programmeUrl(y)}"${y === year ? ' selected' : ''}>${annee(y)}</option>`).join('')}</select><span class="select-chevron" aria-hidden="true"></span></div></div>
      <div class="table-heading" aria-hidden="true"><span>DATE</span><span>HORAIRE</span><span>SÉANCE & INTERVENANT·E</span><span>LIEU</span></div>
      ${sessions.length ? `<ol class="sessions">${sessions.map(session).join('\n')}</ol>` : '<p class="empty-programme">Le programme sera annoncé prochainement.</p>'}
    </section>
    <section class="archives" id="archives" aria-labelledby="titre-archives"><div><p class="eyebrow">AU FIL DES ANNÉES</p><h2 id="titre-archives">Les éditions du séminaire</h2></div><nav aria-label="Éditions du séminaire">${annees.map(y => `<a href="${programmeUrl(y)}"${y === year ? ' aria-current="page"' : ''}>${annee(y)}${y === seminaire.anneeCourante ? '<span>Édition en cours</span>' : '<span>Consulter le programme</span>'}</a>`).join('')}</nav></section>
  `);
}

function safeUrl(value) {
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Les liens doivent utiliser http ou https.');
  return url.href;
}

function personne(membre) {
  return `<li class="personne"><h3>${e(membre.nom)}</h3><p>${e(membre.statut)}<span>${e(membre.affiliation)}</span></p>${membre.url ? `<a class="text-link" href="${e(safeUrl(membre.url))}">Page personnelle <span aria-hidden="true">↗</span><span class="visually-hidden"> de ${e(membre.nom)}</span></a>` : ''}</li>`;
}

function equipePage() {
  return layout('Bureau & équipe', `
    <section class="introduction team-introduction" aria-labelledby="titre-equipe"><div><p class="eyebrow">LES PERSONNES</p><h1 id="titre-equipe">Bureau <em>& équipe</em></h1><p class="intro-text">Un collectif de doctorantes et doctorants pour faire vivre la discussion et les échanges autour de l’économie numérique.</p></div><div class="edition"><span class="eyebrow">ANNÉE UNIVERSITAIRE</span><p>${annee(seminaire.anneeCourante)}</p></div></section>
    ${seminaire.demonstration ? '<p class="demo-note"><span>Édition de démonstration</span> — Les noms et les affiliations présentés sont fictifs.</p>' : ''}
    <section class="team-section" aria-labelledby="titre-bureau"><div class="team-section-heading"><span class="eyebrow">LE BUREAU</span><h2 id="titre-bureau">Comité <br>d’organisation</h2><p>La coordination du séminaire et l’organisation des séances.</p></div><ul class="people">${equipe.bureau.map(personne).join('')}</ul></section>
    <section class="team-section" aria-labelledby="titre-doctorants"><div class="team-section-heading"><span class="eyebrow">LE COLLECTIF</span><h2 id="titre-doctorants">Doctorant·es <br>associé·es</h2><p>Des recherches et des perspectives qui nourrissent le séminaire.</p></div><ul class="people">${equipe.doctorants.map(personne).join('')}</ul></section>
    <div class="return-programme"><a class="text-link" href="/">Consulter le programme ${annee(seminaire.anneeCourante)} <span aria-hidden="true">→</span></a></div>
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
await writeFile('dist/404.html', layout('Page introuvable', '<section class="introduction"><div><p class="eyebrow">PAGE INTROUVABLE</p><h1>Cette page n’existe pas.</h1><p class="intro-text">Retrouvez les séances et les éditions du séminaire depuis le programme.</p><p class="return-programme"><a class="text-link" href="/">Revenir au programme</a></p></div></section>'));
console.log(`${annees.length} programmes, la page équipe et la page 404 générés.`);
