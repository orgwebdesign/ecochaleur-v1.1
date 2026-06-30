const CHATBOT_ANSWERS = {
    eligible: ["Pour vérifier votre éligibilité, cliquez sur le bouton \"Découvrir mon éligibilité\" en haut de page. Le test est gratuit et prend moins de 2 minutes !"],
    aide: ["Vous pouvez bénéficier de plusieurs aides : MaPrimeRénov', les CEE (Certificats d'Économies d'Énergie), et des subventions locales. Le montant dépend de vos revenus et de votre logement."],
    pompe: ["Une pompe à chaleur air/eau peut vous faire économiser jusqu'à 70% sur votre facture de chauffage. Elle fonctionne même par temps froid, jusqu'à -7°C."],
    prix: ["Le reste à charge peut être réduit à 1€ sous conditions d'éligibilité. Nous nous occupons de toutes les démarches administratives."],
    delai: ["L'installation se fait généralement en 1 à 2 journées selon la configuration de votre logement."],
    temps: ["L'installation se fait généralement en 1 à 2 journées selon la configuration de votre logement."],
    contact: ["Vous pouvez nous appeler au numéro gratuit affiché en haut de page ou utiliser le formulaire de contact."],
    hello: ["Bonjour ! Comment puis-je vous aider ? Vous avez des questions sur les pompes à chaleur, les aides financières, ou votre éligibilité ?"],
    default: ["Je suis désolé, je n'ai pas bien compris votre question. Voici ce que je peux vous expliquer :\n- Les aides financières disponibles\n- Le fonctionnement des pompes à chaleur\n- Les délais d'installation\n- Votre éligibilité\nPosez-moi une question simple !"]
};

function getChatbotAnswer(message) {
    const msg = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (/eligibil|eligible|test|puis.je/.test(msg)) return CHATBOT_ANSWERS.eligible[0];
    if (/aide|subvention|financement|maPrime|CEE|credit/.test(msg)) return CHATBOT_ANSWERS.aide[0];
    if (/pompe|chaleur|PAC|chauffage|economi|facture/.test(msg)) return CHATBOT_ANSWERS.pompe[0];
    if (/prix|cout|€|euro|1.?€|tarif/.test(msg)) return CHATBOT_ANSWERS.prix[0];
    if (/delai|duree|temps|jour|installation/.test(msg)) return CHATBOT_ANSWERS.delai[0];
    if (/contact|appel|telephone|joindre/.test(msg)) return CHATBOT_ANSWERS.contact[0];
    if (/bonjour|salut|hello|bonsoir|coucou/.test(msg)) return CHATBOT_ANSWERS.hello[0];
    return CHATBOT_ANSWERS.default;
}

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    
    // Popup Elements
    const popupOverlay = document.getElementById('popup-overlay');
    const btnClosePopup = document.getElementById('btn-close-popup');
    
    // Form Elements
    const form = document.getElementById('eligibility-form');
    const steps = Array.from(document.querySelectorAll('.form-step'));
    const nextBtns = document.querySelectorAll('.btn-next');
    const prevBtns = document.querySelectorAll('.btn-prev');
    const progressBar = document.getElementById('progress-bar');
    
    const totalInputSteps = 7;
    let currentStep = 0;

    // ----- DYNAMIC REVENUE OPTIONS CONFIGURATION (2026) -----

    const REVENUE_THRESHOLDS = {
        ile_de_france: {
            1: [24031, 29253, 40851],
            2: [35270, 42933, 60051],
            3: [42357, 51594, 71846],
            4: [49455, 60208, 84562],
            5: [56580, 68877, 96817]
        },
        province: {
            1: [17363, 22259, 31185],
            2: [25393, 32553, 45842],
            3: [30540, 39148, 55196],
            4: [35676, 45735, 64550],
            5: [40835, 52348, 73907]
        }
    };

    const formatThreshold = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    const getActiveRegion = () => {
        const step5 = document.getElementById('step-5');
        if (step5.querySelector('input[name="region"][value="ile_de_france"]:checked')) {
            return 'ile_de_france';
        }
        if (step5.querySelector('input[name="region"][value="province"]:checked')) {
            return 'province';
        }
        return null;
    };

    const getHouseholdSize = () => {
        const checked = document.querySelector('input[name="household_size"]:checked');
        if (!checked) return null;
        return checked.value === '5_plus' ? 5 : parseInt(checked.value, 10);
    };

    const updateRevenueOptions = () => {
        const step5 = document.getElementById('step-5');
        const revenueInput = step5.querySelector('input[name="tax_income"]');
        if (!revenueInput) return;

        const revenueGroup = revenueInput.closest('.radio-group');
        const region = getActiveRegion();
        const householdSize = getHouseholdSize();

        if (!region || !householdSize) return;

        const thresholds = REVENUE_THRESHOLDS[region]?.[householdSize];
        if (!thresholds) return;

        revenueGroup.querySelectorAll('.radio-card').forEach(card => card.remove());

        thresholds.forEach((threshold, i) => {
            const isUpper = i === thresholds.length - 1;
            const labelText = isUpper
                ? `Plus de ${formatThreshold(threshold)} €`
                : `Moins de ${formatThreshold(threshold)} €`;
            const inputValue = isUpper ? `plus_${threshold}` : `moins_${threshold}`;

            const label = document.createElement('label');
            label.className = 'radio-card';
            label.innerHTML = `
                <input type="radio" name="tax_income" value="${inputValue}" ${i === 0 ? 'required' : ''}>
                <span class="radio-content">${labelText}</span>
            `;
            revenueGroup.appendChild(label);
        });

        const staticOptions = [
            { value: 'je_ne_sais_pas', label: "Je ne sais pas" },
            { value: 'plus_tard', label: "Je ne souhaite pas le communiquer" }
        ];

        staticOptions.forEach(opt => {
            const label = document.createElement('label');
            label.className = 'radio-card';
            label.innerHTML = `
                <input type="radio" name="tax_income" value="${opt.value}">
                <span class="radio-content">${opt.label}</span>
            `;
            revenueGroup.appendChild(label);
        });
    };

    // ----- POPUP MANAGEMENT -----

    const openPopup = () => {
        currentStep = 0;
        form.reset();
        showStep(currentStep);
        popupOverlay.classList.remove('hidden');
        document.body.classList.add('popup-open');
    };

    const closePopup = () => {
        popupOverlay.classList.add('hidden');
        document.body.classList.remove('popup-open');
    };

    // Event delegation — catches ALL .btn-open-popup buttons on the page
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-open-popup')) {
            e.preventDefault();
            openPopup();
        }
    });

    btnClosePopup.addEventListener('click', closePopup);

    // Close on click outside
    popupOverlay.addEventListener('click', (e) => {
        if(e.target === popupOverlay) {
            closePopup();
        }
    });

    // ----- FORM NAVIGATION -----

    const updateProgress = () => {
        if(currentStep < totalInputSteps) {
            const progressPercentage = ((currentStep + 1) / totalInputSteps) * 100;
            progressBar.style.width = `${progressPercentage}%`;
        } else {
            progressBar.style.width = '100%';
        }
    };

    const showStep = (stepIndex) => {
        steps.forEach((step, index) => {
            if (index === stepIndex) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        updateProgress();
        // Scroll popup to top
        document.querySelector('.popup-container').scrollTo(0, 0);
    };

    // ----- VALIDATION -----

    const validateStep = (stepIndex) => {
        const currentStepEl = steps[stepIndex];
        const inputs = Array.from(currentStepEl.querySelectorAll('input[required], select[required], textarea[required]'));
        
        let isValid = true;

        inputs.forEach(input => {
            if (input.type === 'radio' || input.type === 'checkbox') {
                const name = input.name;
                const checked = currentStepEl.querySelector(`input[name="${name}"]:checked`);
                if (!checked) {
                    isValid = false;
                    const group = input.closest('.form-group');
                    if(group) {
                        group.style.animation = 'shake 0.5s';
                        setTimeout(() => group.style.animation = '', 500);
                    }
                }
            } else {
                if (!input.value.trim() || !input.checkValidity()) {
                    isValid = false;
                    input.style.borderColor = 'red';
                    setTimeout(() => input.style.borderColor = '', 2000);
                }
            }
        });

        return isValid;
    };

    // Next Button Click
    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                currentStep++;
                showStep(currentStep);
            }
        });
    });

    // Prev Button Click
    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentStep--;
            showStep(currentStep);
        });
    });

    // ----- FORM SUBMIT -----
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (validateStep(currentStep)) {
            // Simulate API call
            const submitBtn = form.querySelector('.btn-submit');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Envoi en cours...';
            submitBtn.disabled = true;

            setTimeout(() => {
                // Move to success step
                currentStep = totalInputSteps;
                showStep(currentStep);
                
                // Close popup automatically after 3 seconds
                setTimeout(() => {
                    closePopup();
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }, 3000);
                
            }, 1000);
        }
    });

    // ----- FAQ ACCORDION -----

    const faqItems = Array.from(document.querySelectorAll('.faq-item'));

    faqItems.forEach((item) => {
        const trigger = item.querySelector('.faq-question');
        if (!trigger) return;

        trigger.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            faqItems.forEach((faqItem) => {
                faqItem.classList.remove('active');
                const faqButton = faqItem.querySelector('.faq-question');
                if (faqButton) {
                    faqButton.setAttribute('aria-expanded', 'false');
                }
            });

            if (!isActive) {
                item.classList.add('active');
                trigger.setAttribute('aria-expanded', 'true');
            }
        });
    });

    const step5 = document.getElementById('step-5');
    step5.querySelectorAll('input[name="region"]').forEach(input => {
        input.addEventListener('change', updateRevenueOptions);
    });
    step5.querySelectorAll('input[name="household_size"]').forEach(input => {
        input.addEventListener('change', updateRevenueOptions);
    });

    // Dynamic validation animation style
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }
    `;
    document.head.appendChild(style);

    // ----- REVIEWS ANIMATION -----
    const reviewsCard = document.querySelector('.reviews-card');
    if (reviewsCard) {
        const bars = reviewsCard.querySelectorAll('.dist-bar-fill');
        const reviewsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    reviewsCard.classList.add('visible');
                    setTimeout(() => {
                        bars.forEach(bar => {
                            bar.style.width = bar.dataset.width + '%';
                        });
                    }, 200);
                    reviewsObserver.unobserve(reviewsCard);
                }
            });
        }, { threshold: 0.1 });
        setTimeout(() => reviewsObserver.observe(reviewsCard), 100);
    }

    // ----- CHATBOT -----
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotPanel = document.getElementById('chatbot-panel');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSend = document.getElementById('chatbot-send');
    const chatbotMessages = document.getElementById('chatbot-messages');

    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `chatbot-msg ${sender}`;
        div.innerHTML = `<div class="chat_m">${text.replace(/\n/g, '<br>')}</div>`;
        chatbotMessages.appendChild(div);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function showTyping() {
        const div = document.createElement('div');
        div.className = 'chatbot-msg bot';
        div.id = 'typing-indicator';
        div.innerHTML = '<div class="chat_m"><div class="typing-indicator"><span></span><span></span><span></span></div></div>';
        chatbotMessages.appendChild(div);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function hideTyping() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    }

    function handleSend() {
        const text = chatbotInput.value.trim();
        if (!text) return;
        addMessage(text, 'user');
        chatbotInput.value = '';
        showTyping();
        setTimeout(() => {
            hideTyping();
            const answer = getChatbotAnswer(text);
            addMessage(answer, 'bot');
        }, 800 + Math.random() * 600);
    }

    chatbotToggle.addEventListener('click', () => {
        chatbotPanel.classList.toggle('open');
        if (chatbotPanel.classList.contains('open')) {
            chatbotInput.focus();
        }
    });

    chatbotClose.addEventListener('click', () => {
        chatbotPanel.classList.remove('open');
    });

    chatbotSend.addEventListener('click', handleSend);

    chatbotInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSend();
    });
});
