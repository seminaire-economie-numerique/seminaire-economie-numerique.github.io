// La navigation principale, les archives et les résumés fonctionnent sans JavaScript.
// Ce sélecteur est une deuxième manière d’accéder aux éditions.
const edition = document.querySelector('#edition');
if (edition) {
  edition.closest('.year-picker').hidden = false;
  edition.addEventListener('change', () => {
    if ([...edition.options].some(option => option.value === edition.value)) {
      window.location.assign(edition.value);
    }
  });
}
