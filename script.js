document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();

    const langButtons = document.querySelectorAll('.lang-label[data-lang]');
    let currentLang = 'ru';
    const langCodeMap = {
        ru: 'ru',
        ro: 'sr-Latn-ME',
        en: 'en'
    };

    function setLanguage(lang) {
        currentLang = lang;
        document.documentElement.lang = langCodeMap[lang] || 'ru';

        const titleEl = document.querySelector('title');
        const translatedTitle = titleEl.getAttribute(`data-${lang}`) || titleEl.getAttribute('data-ru');
        titleEl.textContent = translatedTitle;

        document.querySelectorAll('[data-ru]').forEach(el => {
            const translatedText = el.getAttribute(`data-${lang}`) || el.getAttribute('data-ru');
            if (!translatedText) return;

            if (el.tagName === 'META') {
                el.setAttribute('content', translatedText);
            } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translatedText;
            } else if (el.tagName !== 'TITLE') {
                el.innerHTML = translatedText;
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

        renderQuizStep();
    }

    langButtons.forEach(button => {
        button.addEventListener('click', () => {
            setLanguage(button.dataset.lang);
        });
    });

    const quizSteps = [
        {
            ru: 'Какой тип работ требуется?',
            ro: 'Koja vrsta radova je potrebna?',
            en: 'What type of work do you need?',
            type: 'radio',
            name: 'work_type',
            options: [
                { val: 'full', ru: 'Полный монтаж (квартира/дом)', ro: 'Kompletna instalacija (stan/kuća)', en: 'Full installation (apartment/house)' },
                { val: 'partial', ru: 'Частичная замена', ro: 'Djelimična zamjena', en: 'Partial replacement' },
                { val: 'point', ru: 'Установка розеток/выключателей', ro: 'Ugradnja utičnica/prekidača', en: 'Sockets and switches installation' }
            ]
        },
        {
            ru: 'Примерная длина кабеля (метры)?',
            ro: 'Približna dužina kabla (u metrima)?',
            en: 'Approximate cable length (meters)?',
            type: 'number',
            name: 'meters',
            placeholder_ru: 'Например: 50',
            placeholder_ro: 'Na primjer: 50',
            placeholder_en: 'For example: 50',
            price: 20
        },
        {
            ru: 'Количество точек (розетки, выключатели)?',
            ro: 'Broj tačaka (utičnice, prekidači)?',
            en: 'Number of points (sockets, switches)?',
            type: 'number',
            name: 'points',
            placeholder_ru: 'Например: 15',
            placeholder_ro: 'Na primjer: 15',
            placeholder_en: 'For example: 15',
            price: 150
        },
        {
            ru: 'Нужна ли закупка материалов?',
            ro: 'Da li je potrebna nabavka materijala?',
            en: 'Do you need help purchasing materials?',
            type: 'radio',
            name: 'materials',
            options: [
                { val: 'yes', ru: 'Да, мастер закупает', ro: 'Da, majstor nabavlja', en: 'Yes, electrician buys them' },
                { val: 'no', ru: 'Нет, все куплено', ro: 'Ne, sve je već kupljeno', en: 'No, everything is already bought' }
            ]
        },
        {
            ru: 'Срочность выполнения?',
            ro: 'Koliko je hitno izvođenje radova?',
            en: 'How urgent is the job?',
            type: 'radio',
            name: 'urgency',
            options: [
                { val: 'standard', ru: 'В плановом порядке (x1)', ro: 'Standardno (x1)', en: 'Standard (x1)', multiplier: 1 },
                { val: 'urgent', ru: 'Срочно (сегодня) (+50%)', ro: 'Hitno (danas) (+50%)', en: 'Urgent (today) (+50%)', multiplier: 1.5 }
            ]
        }
    ];

    const uiText = {
        next: { ru: 'Далее', ro: 'Dalje', en: 'Next' },
        finish: { ru: 'Рассчитать', ro: 'Izračunaj', en: 'Calculate' },
        resultTitle: { ru: 'Примерная стоимость:', ro: 'Okvirna cijena:', en: 'Estimated cost:' },
        resultSubtitle: {
            ru: 'Окончательная цена после осмотра.',
            ro: 'Konačna cijena se određuje nakon pregleda.',
            en: 'The final price is confirmed after inspection.'
        },
        currency: { ru: 'EUR', ro: 'EUR', en: 'EUR' },
        cta: { ru: 'Оставить заявку', ro: 'Pošalji upit', en: 'Send request' },
        lead: { ru: 'Расчет', ro: 'Izračun', en: 'Estimate' },
        request: { ru: 'Заявка с сайта', ro: 'Upit sa sajta', en: 'Request from website' },
        wait: { ru: 'Отправка...', ro: 'Slanje...', en: 'Sending...' },
        success: {
            ru: 'Заявка успешно отправлена! Скоро свяжемся.',
            ro: 'Upit je uspješno poslat. Uskoro vas kontaktiramo.',
            en: 'Your request has been sent successfully. We will contact you shortly.'
        },
        error: { ru: 'Ошибка отправки.', ro: 'Greška pri slanju.', en: 'Sending failed.' },
        network: { ru: 'Ошибка сети.', ro: 'Greška mreže.', en: 'Network error.' }
    };

    let currentStep = 0;
    const answers = {};

    const container = document.getElementById('quiz-container');
    const prevBtn = document.getElementById('quiz-prev');
    const nextBtn = document.getElementById('quiz-next');
    const progressEl = document.getElementById('quiz-progress');
    const calcResultHidden = document.getElementById('calc_result');

    function renderQuizStep() {
        if (currentStep >= quizSteps.length) {
            showQuizResult();
            return;
        }

        const step = quizSteps[currentStep];
        let html = `<div class="quiz-step" id="step-${currentStep}">`;
        html += `<h3>${step[currentLang]}</h3>`;
        html += `<div class="quiz-options">`;

        if (step.type === 'radio') {
            step.options.forEach(opt => {
                const checked = answers[step.name] === opt.val ? 'checked' : '';
                html += `
                    <label class="quiz-radio">
                        <input type="radio" name="${step.name}" value="${opt.val}" ${checked}>
                        <span>${opt[currentLang]}</span>
                    </label>
                `;
            });
        } else if (step.type === 'number') {
            const val = answers[step.name] || '';
            const placeholder = step[`placeholder_${currentLang}`] || step.placeholder_ru;
            html += `<input type="number" class="quiz-input" name="${step.name}" value="${val}" placeholder="${placeholder}" min="0">`;
        }

        html += `</div></div>`;
        container.innerHTML = html;

        const progressPercentage = ((currentStep + 1) / (quizSteps.length + 1)) * 100;
        progressEl.style.width = `${progressPercentage}%`;

        prevBtn.classList.toggle('hidden', currentStep === 0);
        nextBtn.textContent = currentStep === quizSteps.length - 1 ? uiText.finish[currentLang] : uiText.next[currentLang];
    }

    function saveAnswer() {
        if (currentStep >= quizSteps.length) return true;

        const step = quizSteps[currentStep];
        if (step.type === 'radio') {
            const selected = document.querySelector(`input[name="${step.name}"]:checked`);
            if (selected) answers[step.name] = selected.value;
            if (!answers[step.name] && step.name === 'urgency') answers[step.name] = 'standard';
        } else if (step.type === 'number') {
            const input = document.querySelector(`input[name="${step.name}"]`);
            if (input) answers[step.name] = input.value || 0;
        }
        return true;
    }

    function showQuizResult() {
        const meters = parseInt(answers.meters, 10) || 0;
        const points = parseInt(answers.points, 10) || 0;
        let total = (meters * quizSteps[1].price) + (points * quizSteps[2].price);

        if (total === 0) total = 20;
        if (answers.urgency === 'urgent') total = Math.round(total * 1.5);

        const resultStr = `~ ${total} ${uiText.currency[currentLang]}`;
        calcResultHidden.value = `meters: ${meters}, points: ${points}, total: ${total}`;

        container.innerHTML = `
            <div class="quiz-step text-center">
                <h3>${uiText.resultTitle[currentLang]}</h3>
                <div style="font-size: 2.5rem; font-weight: 800; color: var(--primary); margin: 20px 0;">${resultStr}</div>
                <p>${uiText.resultSubtitle[currentLang]}</p>
                <a href="#contact" class="btn btn-primary mt-15" onclick="document.getElementById('form-problem').value='${uiText.lead[currentLang]}: ${resultStr} / ${uiText.request[currentLang]}';">${uiText.cta[currentLang]}</a>
            </div>
        `;

        prevBtn.classList.remove('hidden');
        nextBtn.classList.add('hidden');
        progressEl.style.width = '100%';
    }

    nextBtn.addEventListener('click', () => {
        saveAnswer();
        if (currentStep < quizSteps.length) {
            currentStep++;
            renderQuizStep();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            nextBtn.classList.remove('hidden');
            renderQuizStep();
        }
    });

    renderQuizStep();

    const form = document.getElementById('contactForm');
    const msgDiv = document.getElementById('form-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        const originalBtnText = btn.textContent;

        btn.textContent = uiText.wait[currentLang];
        btn.disabled = true;

        const formData = new FormData(form);

        try {
            const resp = await fetch('form.php', {
                method: 'POST',
                body: formData
            });

            if (resp.ok) {
                msgDiv.innerHTML = `<span style="color: green; font-weight: 600;">${uiText.success[currentLang]}</span>`;
                form.reset();
            } else {
                msgDiv.innerHTML = `<span style="color: red;">${uiText.error[currentLang]}</span>`;
            }
        } catch (err) {
            msgDiv.innerHTML = `<span style="color: red;">${uiText.network[currentLang]}</span>`;
        }

        btn.textContent = originalBtnText;
        btn.disabled = false;

        setTimeout(() => {
            msgDiv.innerHTML = '';
        }, 5000);
    });

    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const body = header.nextElementSibling;
            const isVisible = body.style.display === 'block';
            document.querySelectorAll('.accordion-body').forEach(el => {
                el.style.display = 'none';
            });
            if (!isVisible) {
                body.style.display = 'block';
            }
        });
    });

    const fToggleBtn = document.getElementById('f-toggleBtn');
    const fContainer = document.querySelector('.floating-btn');
    if (fToggleBtn && fContainer) {
        const msgIcon = fToggleBtn.querySelector('.msg-icon');
        const closeIcon = fToggleBtn.querySelector('.close-icon');

        fToggleBtn.addEventListener('click', () => {
            fContainer.classList.toggle('active');
            msgIcon.classList.toggle('hidden');
            closeIcon.classList.toggle('hidden');
        });
    }

    setLanguage('ru');
});
