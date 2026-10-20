const stickyBar = document.getElementById('stickyBar');
const floatingCta = document.getElementById('floatingCta');

window.addEventListener('scroll', () => {
  const vh = window.innerHeight;
  stickyBar.classList.toggle('show', window.scrollY > vh * 0.8);
  floatingCta.classList.toggle('show', window.scrollY > 600);
});

document.querySelectorAll('#faq .acc-item').forEach((item) => {
  const trigger = item.querySelector('.acc-trigger');
  const content = item.querySelector('.acc-content');

  trigger.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');

    document.querySelectorAll('#faq .acc-item').forEach((i) => {
      i.classList.remove('open');
      i.querySelector('.acc-content').style.maxHeight = null;
    });

    if (!isOpen) {
      item.classList.add('open');
      content.style.maxHeight = content.scrollHeight + 'px';
    }
  });
});
