document.addEventListener('DOMContentLoaded', () => {
    const langButtons = document.querySelectorAll('.lang-label[data-lang]');
    const titleEl = document.querySelector('title');
    const htmlEl = document.documentElement;
    const langCodeMap = {
        ru: 'ru',
        ro: 'sr-Latn-ME',
        en: 'en'
    };

    function setLanguage(lang) {
        htmlEl.lang = langCodeMap[lang] || 'ru';
        const title = titleEl.getAttribute(`data-${lang}`) || titleEl.getAttribute('data-ru');
        if (title) titleEl.textContent = title;

        document.querySelectorAll('[data-ru]').forEach(el => {
            const translated = el.getAttribute(`data-${lang}`) || el.getAttribute('data-ru');
            if (!translated) return;
            if (el.tagName === 'META') {
                el.setAttribute('content', translated);
            } else {
                el.innerHTML = translated;
            }
        });

        document.querySelectorAll('[data-alt-ru]').forEach(el => {
            const translatedAlt = el.getAttribute(`data-alt-${lang}`) || el.getAttribute('data-alt-ru');
            if (translatedAlt) el.setAttribute('alt', translatedAlt);
        });

        document.querySelectorAll('[data-title-ru]').forEach(el => {
            const translatedTitle = el.getAttribute(`data-title-${lang}`) || el.getAttribute('data-title-ru');
            if (translatedTitle) el.setAttribute('title', translatedTitle);
        });

        langButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.lang === lang);
        });
    }

    langButtons.forEach(button => {
        button.addEventListener('click', () => {
            setLanguage(button.dataset.lang);
        });
    });

    setLanguage('ru');
});
