// Textes d’interface. Les noms d’institutions et les titres de travaux restent dans leur langue d’origine.
export const textes = {
  fr: {
    locale: 'fr-FR', skip: 'Aller au contenu', navigation: 'Navigation principale',
    language: 'Langue du site', seminar: 'Séminaire', team: 'Bureau et équipe',
    description: 'Consultez le programme, les archives et l’équipe du séminaire.',
    programme: 'Programme', about: 'Présentation du séminaire', year: 'Année',
    yearHelp: ' universitaire (ouvre le programme sélectionné)', archive: 'Archives — année universitaire',
    dateTime: 'Date et horaire', session: 'Séance', pending: 'Séance à organiser',
    coming: 'Le programme sera annoncé prochainement.', years: 'Programmes par année',
    editions: 'Éditions du séminaire', current: '(année en cours)', abstract: 'Résumé',
    more: 'Plus d’informations', committee: 'Bureau / comité d’organisation',
    associated: 'Doctorantes et doctorants associés', personal: 'Page personnelle', of: 'de',
    archives: 'Archives du programme', notFound: 'Page introuvable',
    missing: 'Cette page n’existe pas.', back: 'Revenir au programme',
    contact: 'Pour rejoindre la liste de diffusion, proposer une présentation ou poser une question sur une séance, écrivez à',
  },
  en: {
    locale: 'en-GB', skip: 'Skip to content', navigation: 'Main navigation',
    language: 'Site language', seminar: 'Seminar', team: 'Organisers and team',
    description: 'Browse the seminar programme, archives and organising team.',
    programme: 'Programme', about: 'About the seminar', year: 'Year',
    yearHelp: ' (opens the selected academic year)', archive: 'Archives — academic year',
    dateTime: 'Date and time', session: 'Session', pending: 'Session to be arranged',
    coming: 'The programme will be announced shortly.', years: 'Programmes by year',
    editions: 'Seminar editions', current: '(current year)', abstract: 'Abstract',
    more: 'More information', committee: 'Organising committee',
    associated: 'Associated PhD students', personal: 'Personal page', of: 'of',
    archives: 'Programme archives', notFound: 'Page not found',
    missing: 'This page does not exist.', back: 'Back to the programme',
    contact: 'To join the mailing list, propose a talk, or ask about a session, write to',
  },
};

export function localise(item, field, lang) {
  return (lang === 'en' ? item[`${field}En`] : undefined) ?? item[field];
}

export function statut(membre, lang) {
  if (lang === 'en' && membre.statut === 'Doctorant en économie') return 'PhD student in Economics';
  return localise(membre, 'statut', lang);
}

export function lieu(seance, lang) {
  const room = localise(seance, 'lieu', lang);
  return [lang === 'en' ? room?.replace(/^Salle /, 'Room ') : room, localise(seance, 'adresse', lang)].filter(Boolean).join(' — ');
}
