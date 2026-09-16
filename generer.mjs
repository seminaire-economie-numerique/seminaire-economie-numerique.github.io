import { mkdir, writeFile } from 'node:fs/promises';
import { seminaire, programmes, equipe } from './contenu.mjs';
import { textes, localise, statut, lieu } from './traductions.mjs';

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
const route = (path, lang) => lang === 'en' ? '/en' + path : path;
const programmePath = year => year === seminaire.anneeCourante ? '/' : `/archives/${year}/`;
const programmeUrl = (year, lang) => route(programmePath(year), lang);
const favicon = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#fff"/><text x="24" y="35" text-anchor="middle" font-family="Times New Roman,serif" font-size="36" font-weight="bold" fill="#202020">S</text></svg>');

function layout(title, content, lang, path = '/', active = 'programme') {
  const t = textes[lang];
  const nom = localise(seminaire, 'nom', lang);
  const intro = localise(seminaire, 'introduction', lang);
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${e(title)} — ${e(nom)}</title>
  <meta name="description" content="${e(intro)} ${e(t.description)}">
  <meta name="theme-color" content="#ffffff">
  <link rel="icon" type="image/svg+xml" href="${favicon}">
  <link rel="stylesheet" href="/style.css">
  <script src="/navigation.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#contenu">${e(t.skip)}</a>
  <div class="page">
    <header class="site-header">
      <nav class="language-switch" aria-label="${e(t.language)}">${['fr', 'en'].map(code => `<a href="${route(path, code)}" lang="${code}" hreflang="${code}" aria-label="${code === 'fr' ? 'Français' : 'English'}"${code === lang ? ' aria-current="page"' : ''}>${code.toUpperCase()}</a>`).join('<span aria-hidden="true">/</span>')}</nav>
      <h1 class="site-title"><a href="${route('/', lang)}">${lang === 'fr' ? e(nom).replace(' en économie numérique', '<br>en économie numérique') : e(nom)}</a></h1>
      <p class="site-description">${e(intro)}</p>
      <nav class="main-nav" aria-label="${e(t.navigation)}"><a href="${route('/', lang)}" ${active === 'programme' ? 'aria-current="page"' : ''}>${e(t.seminar)}</a><a href="${route('/equipe/', lang)}" ${active === 'equipe' ? 'aria-current="page"' : ''}>${e(t.team)}</a></nav>
    </header>
    <main id="contenu">${content}</main>
    <footer class="site-footer"><p class="contact-line">${e(t.contact)} <a href="mailto:${e(seminaire.contact)}">${e(seminaire.contact)}</a>.</p><div class="footer-meta"><p>${e(nom)}</p><a href="${route('/', lang)}#archives">${e(t.archives)}</a></div></footer>
  </div>
</body>
</html>`.replace(/\b(href|src|value)="\/(?!\/)/g, (_, attribute) => `${attribute}="${basePath}/`);
}

function presentation(expose, lang) {
  const t = textes[lang];
  return `<div class="presentation"><h3${expose.langue ? ` lang="${e(expose.langue)}"` : ''}>${e(expose.titre)}</h3><p class="speaker">${e(expose.intervenant)}<span class="affiliation">${e(expose.affiliation)}</span></p>${expose.resume ? `<details><summary>${e(t.abstract)}</summary><p class="abstract">${e(expose.resume)}</p></details>` : ''}${expose.url ? `<p><a class="text-link" href="${e(safeUrl(expose.url))}">${e(t.more)}</a></p>` : ''}</div>`;
}

function session(seance, lang) {
  const t = textes[lang];
  const moisSeul = /^\d{4}-\d{2}$/.test(seance.date);
  const date = new Date(seance.date + (moisSeul ? '-01' : '') + 'T12:00:00Z');
  const dateComplete = new Intl.DateTimeFormat(t.locale, { ...(moisSeul ? {} : {day:'numeric'}), month:'long', year:'numeric', timeZone:'UTC'}).format(date);
  const horaire = value => lang === 'en' ? value : value.replace(':', ' h ').replace(' h 00', ' h');
  const debut = seance.debut ?? seminaire.horaire;
  const place = lieu(seance, lang);
  return `<li class="session">
    <div class="session-meta"><time class="session-date" datetime="${e(seance.date)}">${e(dateComplete)}</time>${debut ? `<p class="session-time">${e(horaire(debut))}${seance.fin ? ` – ${e(horaire(seance.fin))}` : ''}</p>` : ''}</div>
    <div class="session-main">${seance.presentations.length ? seance.presentations.map(expose => presentation(expose, lang)).join('') : `<h3>${e(localise(seance, 'titre', lang) ?? t.pending)}</h3>`}${seance.note ? `<p class="session-note">${e(localise(seance, 'note', lang))}</p>` : ''}${place ? `<p class="session-place">${e(place)}</p>` : ''}</div>
  </li>`;
}

function programmePage(year, lang) {
  const t = textes[lang];
  const sessions = [...programmes[year]].sort((a, b) => b.date.localeCompare(a.date));
  const archived = year !== seminaire.anneeCourante;
  return layout(`${t.programme} ${annee(year)}`, `
    ${!archived ? `<section class="seminar-concept" aria-label="${e(t.about)}"><p>${e(localise(seminaire, 'concept', lang))}</p><p>${e(localise(seminaire, 'accueil', lang))}</p></section>` : ''}
    <section class="programme" aria-labelledby="titre-programme">
      <div class="section-heading"><h2 id="titre-programme">${e(t.programme)} ${annee(year)}</h2><div class="year-picker" hidden><label for="edition">${e(t.year)}<span class="visually-hidden">${e(t.yearHelp)}</span></label><select id="edition">${annees.map(y => `<option value="${programmeUrl(y, lang)}"${y === year ? ' selected' : ''}>${annee(y)}</option>`).join('')}</select></div></div>
      ${archived ? '<p class="archive-note">'+e(t.archive)+' '+annee(year)+'.</p>' : ''}
      <div class="table-heading" aria-hidden="true"><span>${e(t.dateTime)}</span><span>${e(t.session)}</span></div>
      ${sessions.length ? `<ol class="sessions">${sessions.map(seance => session(seance, lang)).join('\n')}</ol>` : '<p class="empty-programme">'+e(t.coming)+'</p>'}
    </section>
    <section class="archives" id="archives" aria-labelledby="titre-archives"><h2 id="titre-archives">${e(t.years)}</h2><nav aria-label="${e(t.editions)}">${annees.map(y => `<a href="${programmeUrl(y, lang)}"${y === year ? ' aria-current="page"' : ''}>${annee(y)}${y === seminaire.anneeCourante ? ' <span>'+e(t.current)+'</span>' : ''}</a>`).join('')}</nav></section>
  `, lang, programmePath(year));
}

function safeUrl(value) {
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Les liens doivent utiliser http ou https.');
  return url.href;
}

function personne(membre, lang) {
  const t = textes[lang];
  return `<li class="personne"><h4>${e(membre.nom)}</h4><p>${e(statut(membre, lang))}${membre.domaines ? `<span class="research-fields" lang="en">${e(membre.domaines)}</span>` : ''}<span>${e(membre.affiliation)}</span></p>${membre.url ? `<a class="text-link" href="${e(safeUrl(membre.url))}">${e(t.personal)}<span class="visually-hidden"> ${e(t.of)} ${e(membre.nom)}</span></a>` : ''}</li>`;
}

function equipePage(lang) {
  const t = textes[lang];
  return layout(t.team, `
    <h2 class="team-heading">${e(t.team)} · ${annee(seminaire.anneeCourante)}</h2>
    <section class="team-section" aria-labelledby="titre-bureau"><h3 id="titre-bureau">${e(t.committee)}</h3><ul class="people">${equipe.bureau.map(membre => personne(membre, lang)).join('')}</ul></section>
    ${equipe.doctorants.length ? `<section class="team-section" aria-labelledby="titre-doctorants"><h3 id="titre-doctorants">${e(t.associated)}</h3><ul class="people">${equipe.doctorants.map(membre => personne(membre, lang)).join('')}</ul></section>` : ''}
    <div class="return-programme"><a class="text-link" href="${route('/', lang)}">${e(t.programme)} ${annee(seminaire.anneeCourante)}</a></div>
  `, lang, '/equipe/', 'equipe');
}

if (!programmes[seminaire.anneeCourante]) throw new Error('Le programme de l’année courante est absent.');

for (const lang of ['fr', 'en']) {
  const root = lang === 'en' ? 'dist/en' : 'dist';
  await mkdir(root, { recursive: true });
  for (const year of annees) {
    const directory = year === seminaire.anneeCourante ? root : root + '/archives/' + year;
    await mkdir(directory, { recursive: true });
    await writeFile(directory + '/index.html', programmePage(year, lang));
  }
  await mkdir(root + '/equipe', { recursive: true });
  await writeFile(root + '/equipe/index.html', equipePage(lang));
  const t = textes[lang];
  await writeFile(root + '/404.html', layout(t.notFound, '<section class="not-found"><h2>'+e(t.notFound)+'</h2><p>'+e(t.missing)+'</p><a class="text-link" href="'+route('/', lang)+'">'+e(t.back)+'</a></section>', lang, '/404.html'));
}
console.log('Programmes, équipe et pages 404 générés en français et en anglais.');
