// Flag para prevenir re-animação dos números
let numbersAnimated = false;

// Animação dos números na seção de prova social
function animateNumbers() {
    if (numbersAnimated) return;
    
    const numbers = document.querySelectorAll('.proof-number');
    numbersAnimated = true;
    
    numbers.forEach(number => {
        const target = parseInt(number.getAttribute('data-target'));
        const duration = 2000;
        const start = performance.now();
        
        function updateNumber(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(target * easeOut);
            
            number.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        }
        
        requestAnimationFrame(updateNumber);
    });
}

// Função consolidada para todas as animações
const AnimationController = {
    animateSlide() {
        const elements = document.querySelectorAll('.animate-slide');
        
        elements.forEach((element, index) => {
            try {
                setTimeout(() => {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, index * 200);
            } catch (error) {
                console.error('Slide animation error:', error);
            }
        });
    },
    
    animateFade() {
        const headline = document.querySelector('.animate-fade');
        if (headline) {
            try {
                setTimeout(() => {
                    headline.style.opacity = '1';
                    headline.style.transform = 'translateY(0)';
                }, 500);
            } catch (error) {
                console.error('Fade animation error:', error);
            }
        }
    }
};

// Scroll suave para links internos
function smoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Observer único reutilizável
let globalObserver;

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    globalObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                try {
                    if (entry.target.classList.contains('social-proof')) {
                        setTimeout(() => animateNumbers(), 200);
                    }
                    
                    if (entry.target.classList.contains('benefits')) {
                        setTimeout(() => AnimationController.animateSlide(), 200);
                    }
                    
                    entry.target.classList.add('visible');
                    globalObserver.unobserve(entry.target);
                } catch (error) {
                    console.error('Animation error:', error);
                }
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.social-proof, .benefits, .testimonials').forEach(el => {
        globalObserver.observe(el);
    });
}

// Efeito de pulsação no CTA
function initCTAEffects() {
    const ctas = document.querySelectorAll('.cta-primary');
    
    ctas.forEach(cta => {
        // Adicionar efeito de hover dinâmico
        cta.addEventListener('mouseenter', function() {
            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                this.style.transform = 'scale(1.05)';
                this.style.boxShadow = '0 10px 25px rgba(212, 175, 55, 0.3)';
            }
        });
        
        cta.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 5px 15px rgba(212, 175, 55, 0.2)';
        });
        
        // Adicionar data-cta se não existir
        if (!cta.hasAttribute('data-cta')) {
            const section = cta.closest('section');
            const sectionClass = section ? section.className.split(' ')[0] : 'unknown';
            cta.setAttribute('data-cta', `${sectionClass}-cta`);
        }
    });
}

// FAQ interativo com indicadores visuais
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        // Adicionar indicador visual
        const indicator = document.createElement('span');
        indicator.className = 'faq-indicator';
        indicator.textContent = '+';
        indicator.style.cssText = `
            float: right;
            font-size: 20px;
            font-weight: bold;
            color: var(--gold, #D4AF37);
            transition: transform 0.3s ease;
        `;
        question.appendChild(indicator);
        
        // Inicialmente ocultar respostas
        answer.style.display = 'none';
        answer.style.maxHeight = '0';
        answer.style.overflow = 'hidden';
        answer.style.transition = 'max-height 0.3s ease, padding 0.3s ease';
        
        question.style.cursor = 'pointer';
        question.style.userSelect = 'none';
        question.style.display = 'flex';
        question.style.justifyContent = 'space-between';
        question.style.alignItems = 'center';
        
        question.addEventListener('click', () => {
            const isOpen = answer.style.display === 'block';
            
            // Fechar todas as outras
            faqItems.forEach(otherItem => {
                const otherAnswer = otherItem.querySelector('.faq-answer');
                const otherIndicator = otherItem.querySelector('.faq-indicator');
                otherAnswer.style.display = 'none';
                otherAnswer.style.maxHeight = '0';
                otherAnswer.style.paddingTop = '0';
                otherItem.classList.remove('active');
                if (otherIndicator) {
                    otherIndicator.textContent = '+';
                    otherIndicator.style.transform = 'rotate(0deg)';
                }
            });
            
            // Abrir/fechar atual
            if (!isOpen) {
                answer.style.display = 'block';
                answer.style.maxHeight = answer.scrollHeight + 'px';
                answer.style.paddingTop = '15px';
                item.classList.add('active');
                indicator.textContent = '−';
                indicator.style.transform = 'rotate(180deg)';
            }
        });
    });
}

// Tracking real com GA4, GTM e Facebook Pixel
function initTracking() {
    // Scroll depth tracking
    const scrollDepths = [25, 50, 75, 100];
    const scrollTracked = new Set();
    
    const trackScrollDepth = throttle(() => {
        const scrollPercent = Math.round((window.scrollY + window.innerHeight) / document.body.offsetHeight * 100);
        
        scrollDepths.forEach(depth => {
            if (scrollPercent >= depth && !scrollTracked.has(depth)) {
                scrollTracked.add(depth);
                
                // GA4
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'scroll', {
                        event_category: 'engagement',
                        event_label: `${depth}%`,
                        value: depth
                    });
                }
                
                // Facebook Pixel
                if (typeof fbq !== 'undefined') {
                    fbq('trackCustom', 'ScrollDepth', {depth: `${depth}%`});
                }
            }
        });
    }, 500);
    
    window.addEventListener('scroll', trackScrollDepth);
    
    // CTA tracking com data-attributes
    document.querySelectorAll('[data-cta]').forEach(cta => {
        cta.addEventListener('click', (e) => {
            const ctaName = e.target.getAttribute('data-cta') || e.target.closest('[data-cta]')?.getAttribute('data-cta');
            
            try {
                // GA4
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'click', {
                        event_category: 'CTA',
                        event_label: ctaName,
                        cta_position: ctaName
                    });
                }
                
                // Facebook Pixel
                if (typeof fbq !== 'undefined') {
                    fbq('track', 'Lead', {source: ctaName});
                }
                
                // GTM DataLayer
                if (typeof dataLayer !== 'undefined') {
                    dataLayer.push({
                        event: 'cta_click',
                        cta_name: ctaName,
                        page_location: window.location.href
                    });
                }
            } catch (error) {
                console.error('Tracking error:', error);
            }
        });
    });
    
    // Time on page tracking
    let startTime = Date.now();
    const timeIntervals = [30, 60, 120, 300]; // 30s, 1m, 2m, 5m
    const timeTracked = new Set();
    
    setInterval(() => {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        
        timeIntervals.forEach(interval => {
            if (timeSpent >= interval && !timeTracked.has(interval)) {
                timeTracked.add(interval);
                
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'timing_complete', {
                        name: 'page_engagement',
                        value: interval
                    });
                }
            }
        });
    }, 1000);
}

// WhatsApp flutuante
function initWhatsAppButton() {
    const whatsappBtn = document.createElement('div');
    whatsappBtn.id = 'whatsapp-float';
    whatsappBtn.innerHTML = `
        <a href="https://wa.me/5511999999999?text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20o%20Sprint%20de%20Diagn%C3%B3stico%20Gratuito" 
           target="_blank" 
           rel="noopener"
           data-cta="whatsapp-float">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2M8.53 7.33c.16 0 .33-.01.47.01.16.01.35-.06.55.42.2.48 1.02 2.58 1.11 2.76.09.18.15.39.03.63-.12.24-.18.39-.36.6-.18.21-.38.47-.54.63-.18.18-.36.39-.15.72.21.33.93 1.44 2 2.13 1.38 1 2.53 1.31 2.88 1.45.36.15.57.12.78-.06.21-.18.93-.99 1.17-1.33.24-.33.48-.27.81-.15.33.12 2.1 1.05 2.46 1.23.36.18.6.27.69.42.09.15.09.84-.21 1.65-.3.81-1.74 1.62-2.4 1.68-.63.06-1.29-.06-4.27-1.11C6.15 14.29 4.07 10.53 3.9 10.26c-.18-.27-1.35-1.92-1.35-3.66 0-1.74.87-2.6 1.17-2.96.33-.36.72-.48 1.05-.48l.76.01z"/>
            </svg>
        </a>
    `;
    
    whatsappBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        animation: pulse-whatsapp 2s infinite;
    `;
    
    whatsappBtn.querySelector('a').style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
        background: #25D366;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(37, 211, 102, 0.4);
        text-decoration: none;
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(whatsappBtn);
}

// Formulário de fallback
function initFallbackForm() {
    const fallbackForm = document.createElement('div');
    fallbackForm.id = 'fallback-form';
    fallbackForm.innerHTML = `
        <div class="form-overlay" style="display: none;">
            <div class="form-modal">
                <h3>Agende Seu Diagnóstico Gratuito</h3>
                <p>Preencha os dados e entraremos em contato:</p>
                <form id="lead-form">
                    <input type="text" name="nome" placeholder="Seu nome" required>
                    <input type="email" name="email" placeholder="Seu melhor e-mail" required>
                    <input type="tel" name="telefone" placeholder="WhatsApp" required>
                    <select name="faturamento" required>
                        <option value="">Faturamento atual</option>
                        <option value="500k-1m">R$ 500k - 1M</option>
                        <option value="1m-5m">R$ 1M - 5M</option>
                        <option value="5m+">R$ 5M+</option>
                    </select>
                    <button type="submit" data-cta="form-fallback">Quero Meu Diagnóstico →</button>
                </form>
                <button class="close-form">✕</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(fallbackForm);
    
    // Lógica do formulário
    const overlay = fallbackForm.querySelector('.form-overlay');
    const closeBtn = fallbackForm.querySelector('.close-form');
    const form = fallbackForm.querySelector('#lead-form');
    
    closeBtn.addEventListener('click', () => overlay.style.display = 'none');
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.style.display = 'none';
    });
    
    // Mostrar form se Calendly falhar (simulação)
    setTimeout(() => {
        if (Math.random() > 0.9) { // 10% chance de mostrar fallback
            overlay.style.display = 'flex';
        }
    }, 5000);
}

// Lazy loading para imagens (se houver)
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}


// Otimização mobile: prevenir zoom em inputs
function preventMobileZoom() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            }
        });
        
        input.addEventListener('blur', () => {
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
            }
        });
    });
}

// Facebook Pixel init
function initFacebookPixel() {
    if (typeof fbq === 'undefined') {
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        
        fbq('init', 'YOUR_PIXEL_ID'); // Substitua pelo seu Pixel ID
        fbq('track', 'PageView');
    }
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Inicializar todas as funcionalidades
        AnimationController.animateFade();
        initScrollAnimations();
        initCTAEffects();
        initFAQ();
        initWhatsAppButton();
        initFallbackForm();
        smoothScroll();
        initTracking();
        initFacebookPixel();
        initLazyLoading();
        preventMobileZoom();
        
        // Adicionar classe ao body quando tudo estiver carregado
        document.body.classList.add('loaded');
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// Throttle para eventos de scroll (60fps)
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Debounce para resize
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Variáveis para performance
let isMobile = window.innerWidth <= 768;
let ticking = false;

window.addEventListener('resize', debounce(() => {
    isMobile = window.innerWidth <= 768;
}, 250));

window.addEventListener('scroll', throttle(() => {
    if (!isMobile && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.3;
        
        const hero = document.querySelector('.hero');
        if (hero && scrolled < window.innerHeight) {
            hero.style.transform = `translateY(${rate}px)`;
        }
    }
}, 16));