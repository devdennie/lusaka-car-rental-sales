import '../styles/main.css';

const page = document.body.dataset.page;
document.querySelectorAll('[data-nav]').forEach((link) => {
  if (link.dataset.nav === page) link.setAttribute('aria-current', 'page');
});

const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());
