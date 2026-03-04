document.addEventListener('DOMContentLoaded', () => {
    // 1. Current Year in Footer
    document.getElementById('year').textContent = new Date().getFullYear();

    // 2. Language Toggle
    const langToggle = document.getElementById('lang-toggle');
    let currentLang = 'ru';

    function setLanguage(lang) {
        currentLang = lang;
        document.documentElement.lang = lang;

        // Update Title
        const titleEl = document.querySelector('title');
        titleEl.textContent = titleEl.getAttribute(`data-${lang}`);

        // Update all data-[lang] elements
        document.querySelectorAll(`[data-ru][data-ro]`).forEach(el => {
            const translatedText = el.getAttribute(`data-${lang}`);
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translatedText;
            } else if (el.tagName !== 'META' && el.tagName !== 'TITLE') {
                el.innerHTML = translatedText;
            }
        });

        // Update Toggle Labels UI
        const labelRu = document.querySelector('.lang-label.ru');
        const labelRo = document.querySelector('.lang-label.ro');
        if (lang === 'ro') {
            labelRo.classList.add('active');
            labelRu.classList.remove('active');
            langToggle.checked = true;
        } else {
            labelRu.classList.add('active');
            labelRo.classList.remove('active');
            langToggle.checked = false;
        }

        // Re-render quiz to update texts
        renderQuizStep();
    }

    langToggle.addEventListener('change', (e) => {
        setLanguage(e.target.checked ? 'ro' : 'ru');
    });

    // 3. Quiz Calculator Logic
    const quizSteps = [
        {
            ru: 'Какой тип работ требуется?',
            ro: 'Ce tip de lucrări este necesar?',
            type: 'radio',
            name: 'work_type',
            options: [
                { val: 'full', ru: 'Полный монтаж (квартира/дом)', ro: 'Montaj complet (apartament/casă)' },
                { val: 'partial', ru: 'Частичная замена', ro: 'Schimbare parțială' },
                { val: 'point', ru: 'Установка розеток/выключателей', ro: 'Instalare prize/întrerupătoare' }
            ]
        },
        {
            ru: 'Примерная длина кабеля (метры)?',
            ro: 'Lungimea aproximativă a cablului (metri)?',
            type: 'number',
            name: 'meters',
            placeholder_ru: 'Например: 50',
            placeholder_ro: 'De exemplu: 50',
            price: 20 // MDL per meter
        },
        {
            ru: 'Количество точек (розетки, выключатели)?',
            ro: 'Numărul de puncte (prize, întrerupătoare)?',
            type: 'number',
            name: 'points',
            placeholder_ru: 'Например: 15',
            placeholder_ro: 'De exemplu: 15',
            price: 150 // MDL per point
        },
        {
            ru: 'Нужна ли закупка материалов?',
            ro: 'Este necesară procurarea materialelor?',
            type: 'radio',
            name: 'materials',
            options: [
                { val: 'yes', ru: 'Да, мастер закупает', ro: 'Da, meșterul procură' },
                { val: 'no', ru: 'Нет, все куплено', ro: 'Nu, totul este cumpărat' }
            ]
        },
        {
            ru: 'Срочность выполнения?',
            ro: 'Urgența execuției?',
            type: 'radio',
            name: 'urgency',
            options: [
                { val: 'standard', ru: 'В плановом порядке (множитель x1)', ro: 'În regim normal (x1)', multiplier: 1 },
                { val: 'urgent', ru: 'Срочно (сегодня) (+50%)', ro: 'Urgent (astăzi) (+50%)', multiplier: 1.5 }
            ]
        }
    ];

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
            step.options.forEach((opt, idx) => {
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
            const placeholder = currentLang === 'ru' ? step.placeholder_ru : step.placeholder_ro;
            html += `<input type="number" class="quiz-input" name="${step.name}" value="${val}" placeholder="${placeholder}" min="0">`;
        }

        html += `</div></div>`;
        container.innerHTML = html;

        // Update progress and buttons
        const progressPercentage = ((currentStep + 1) / (quizSteps.length + 1)) * 100;
        progressEl.style.width = `${progressPercentage}%`;

        prevBtn.classList.toggle('hidden', currentStep === 0);

        const nextText = currentLang === 'ru' ? 'Далее' : 'Înainte';
        const finishText = currentLang === 'ru' ? 'Рассчитать' : 'Calculează';
        nextBtn.textContent = currentStep === quizSteps.length - 1 ? finishText : nextText;
    }

    function saveAnswer() {
        if (currentStep >= quizSteps.length) return true;

        const step = quizSteps[currentStep];
        if (step.type === 'radio') {
            const selected = document.querySelector(`input[name="${step.name}"]:checked`);
            if (selected) answers[step.name] = selected.value;
            // Allow skipping if not vital, but let's default to not empty
            if (!answers[step.name] && step.name === 'urgency') answers[step.name] = 'standard';
        } else if (step.type === 'number') {
            const input = document.querySelector(`input[name="${step.name}"]`);
            if (input) answers[step.name] = input.value || 0;
        }
        return true;
    }

    function showQuizResult() {
        // Calculate
        const meters = parseInt(answers.meters) || 0;
        const points = parseInt(answers.points) || 0;
        let total = (meters * quizSteps[1].price) + (points * quizSteps[2].price);

        if (total === 0) total = 200; // minimum callout fee

        let multiplier = 1;
        if (answers.urgency === 'urgent') multiplier = 1.5;

        total = Math.round(total * multiplier);

        // Render result
        const titleText = currentLang === 'ru' ? 'Примерная стоимость:' : 'Cost aproximativ:';
        const subtitleText = currentLang === 'ru' ? 'Окончательная цена после осмотра.' : 'Prețul final se stabilește după examinare.';
        const mdlText = currentLang === 'ru' ? 'лей' : 'lei';
        const ctaText = currentLang === 'ru' ? 'Оставить заявку' : 'Lăsați o cerere';

        const resultStr = `~ ${total} ${mdlText}`;
        calcResultHidden.value = `meters: ${meters}, points: ${points}, total: ${total}`;

        container.innerHTML = `
            <div class="quiz-step text-center">
                <h3>${titleText}</h3>
                <div style="font-size: 2.5rem; font-weight: 800; color: var(--primary); margin: 20px 0;">${resultStr}</div>
                <p>${subtitleText}</p>
                <a href="#contact" class="btn btn-primary mt-15" onclick="document.getElementById('form-problem').value='Расчет: ${resultStr} / Заявка с сайта';">${ctaText}</a>
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

    // Init Quiz
    renderQuizStep();

    // 4. Form Submit handler (Fetch to form.php)
    const form = document.getElementById('contactForm');
    const msgDiv = document.getElementById('form-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        const originalBtnText = btn.textContent;
        const waitText = currentLang === 'ru' ? 'Отправка...' : 'Se expediază...';

        btn.textContent = waitText;
        btn.disabled = true;

        const formData = new FormData(form);

        try {
            const resp = await fetch('form.php', {
                method: 'POST',
                body: formData
            });
            const text = await resp.text();

            if (resp.ok) {
                msgDiv.innerHTML = `<span style="color: green; font-weight: 600;">${currentLang === 'ru' ? 'Заявка успешно отправлена! Скоро свяжемся.' : 'Cererea a fost expediată! Vă vom contacta.'}</span>`;
                form.reset();
            } else {
                msgDiv.innerHTML = `<span style="color: red;">${currentLang === 'ru' ? 'Ошибка отправки.' : 'Eroare la expediere.'}</span>`;
            }
        } catch (err) {
            msgDiv.innerHTML = `<span style="color: red;">Network Error.</span>`;
        }

        btn.textContent = originalBtnText;
        btn.disabled = false;

        setTimeout(() => { msgDiv.innerHTML = ''; }, 5000);
    });

    // 5. Accordion Logic
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const body = header.nextElementSibling;
            const isVisible = body.style.display === 'block';
            document.querySelectorAll('.accordion-body').forEach(el => el.style.display = 'none');
            if (!isVisible) {
                body.style.display = 'block';
            }
        });
    });
    // 6. Floating Messenger Toggle
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
});
