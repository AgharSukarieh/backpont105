// JavaScript for interactive features

document.addEventListener('DOMContentLoaded', function() {
    // Password visibility toggle
    const passwordToggle = document.querySelector('#passwordToggle');
    const passwordInput = document.querySelector('#password');
    const eyeShowIcon = document.querySelector('.eye-show-icon');
    const eyeHideIcon = document.querySelector('.eye-hide-icon');

    if (passwordToggle && passwordInput && eyeShowIcon && eyeHideIcon) {
        passwordToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (passwordInput.type === 'password') {
                // إظهار النص عند الضغط على eye_hide.png
                passwordInput.type = 'text';
                eyeHideIcon.style.display = 'none';
                eyeShowIcon.style.display = 'block';
            } else {
                // إخفاء النص عند الضغط على eye_show.png
                passwordInput.type = 'password';
                eyeShowIcon.style.display = 'none';
                eyeHideIcon.style.display = 'block';
            }
        });
    }

    // Form submission
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.querySelector('#email').value;
            const password = document.querySelector('#password').value;
            console.log('Login attempt:', { email, password });
            alert('تم تسجيل الدخول بنجاح!');
        });
    }

    // Social login links
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const platform = this.classList.contains('facebook') ? 'Facebook' : 
                           this.classList.contains('google') ? 'Google' : 'LinkedIn';
            console.log('Social login:', platform);
            // يمكن إضافة منطق تسجيل الدخول هنا
        });
    });

    // Card Flip Animation
    const cardFlipContainer = document.querySelector('.card-flip-container');
    const createAccountBtn = document.querySelector('.card-front .btn-secondary');
    const backToLoginBtn = document.querySelector('#backToLogin');

    if (createAccountBtn && cardFlipContainer) {
        createAccountBtn.addEventListener('click', function(e) {
            e.preventDefault();
            cardFlipContainer.classList.add('flipped');
        });
    }

    if (backToLoginBtn && cardFlipContainer) {
        backToLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            cardFlipContainer.classList.remove('flipped');
        });
    }

    // Password toggle for signup form
    const togglePasswordBtn = document.getElementById('togglePassword');
    const signupPasswordInput = document.getElementById('signup-password');

    if (togglePasswordBtn && signupPasswordInput) {
        togglePasswordBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const isPassword = signupPasswordInput.type === 'password';
            signupPasswordInput.type = isPassword ? 'text' : 'password';
        });
    }

    // Signup form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmit();
        });
    }

    // حركة العجلة الأولى عند كتابة الاسم
    const usernameInput = document.getElementById('username');
    const wheel1 = document.querySelector('.card-back .detached-wheel.wheel-1');
    const carMiddleBody = document.querySelector('.card-back .car-middle-body');
    
    // حركة العجلة الثانية عند كتابة الإيميل
    const emailInput = document.getElementById('signup-email');
    const wheel2 = document.querySelector('.card-back .detached-wheel.wheel-2');
    const carForwardBody = document.querySelector('.card-back .car-forward-body');
    const carBackBody = document.querySelector('.card-back .car-back-body');
    
    // دالة لتحديث حالة السيارة بناءً على الحقول المملوءة
    function updateCarState() {
        if (!carMiddleBody) return;
        
        const usernameValue = usernameInput ? usernameInput.value.trim() : '';
        const emailValue = emailInput ? emailInput.value.trim() : '';
        
        // إزالة جميع الكلاسات أولاً
        carMiddleBody.classList.remove('car-filled', 'email-only');
        
        if (usernameValue.length > 0) {
            // إذا كان الاسم مملوءاً، استخدم الحالة العادية
            carMiddleBody.classList.add('car-filled');
            carMiddleBody.classList.remove('both-filled');
        } else if (emailValue.length > 0) {
            // إذا كان الإيميل مملوءاً فقط (بدون الاسم)
            carMiddleBody.classList.add('email-only');
            carMiddleBody.classList.remove('both-filled');
        }

        if (usernameValue.length > 0 && emailValue.length > 0) {
            carMiddleBody.classList.remove('car-filled', 'email-only');
            carMiddleBody.classList.add('both-filled');
            if (wheel1) {
                wheel1.classList.add('both-filled');
            }
            if (wheel2) {
                wheel2.classList.add('both-filled');
            }
        } else {
            if (wheel1) {
                wheel1.classList.remove('both-filled');
            }
            if (wheel2) {
                wheel2.classList.remove('both-filled');
            }
        }
    }
    
    if (usernameInput && wheel1) {
        usernameInput.addEventListener('input', function() {
            const value = this.value.trim();
            wheel1.classList.toggle('moving-to-car', value.length > 0);
            // تحديث حالة السيارة
            updateCarState();
        });
    }
    
    if (emailInput && wheel2) {
        emailInput.addEventListener('input', function() {
            const value = this.value.trim();
            wheel2.classList.toggle('moving-to-car', value.length > 0);
            // تحديث حالة السيارة
            updateCarState();
        });
    }

    if (signupPasswordInput) {
        signupPasswordInput.addEventListener('input', updatePasswordState);
        // تأكد من تحديث الحالة عند تحميل الصفحة إذا كان هناك قيمة مسبقاً
        updatePasswordState();
    }

    // Social login buttons
    const facebookBtn = document.getElementById('facebookBtn');
    const googleBtn = document.getElementById('googleBtn');
    const linkedinBtn = document.getElementById('linkedinBtn');

    if (facebookBtn) {
        facebookBtn.addEventListener('click', function() {
            handleSocialLogin('facebook');
        });
    }

    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            handleSocialLogin('google');
        });
    }

    if (linkedinBtn) {
        linkedinBtn.addEventListener('click', function() {
            handleSocialLogin('linkedin');
        });
    }

    console.log('Page loaded successfully. Animations are running via CSS.');
});

function updatePasswordState() {
    const signupPasswordInput = document.getElementById('signup-password');
    const hasPassword = signupPasswordInput ? signupPasswordInput.value.trim().length > 0 : false;
    const carForwardBody = document.querySelector('.card-back .car-forward-body');
    const carBackBody = document.querySelector('.card-back .car-back-body');

    if (carForwardBody) {
        carForwardBody.classList.toggle('password-active', hasPassword);
    }

    if (carBackBody) {
        carBackBody.classList.toggle('password-active', hasPassword);
    }
}

// ==================== Form Submission Handler ====================
function handleFormSubmit() {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const rememberPassword = document.getElementById('rememberPassword').checked;

    // Basic validation
    if (!username) {
        showAlert('يرجى إدخال اسم المستخدم', 'error');
        return;
    }

    if (!email) {
        showAlert('يرجى إدخال البريد الإلكتروني', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showAlert('يرجى إدخال بريد إلكتروني صحيح', 'error');
        return;
    }

    if (!password) {
        showAlert('يرجى إدخال كلمة السر', 'error');
        return;
    }

    if (password.length < 6) {
        showAlert('كلمة السر يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }

    // Form data object
    const formData = {
        username: username,
        email: email,
        password: password,
        rememberPassword: rememberPassword,
        timestamp: new Date().toISOString()
    };

    // Log form data (in production, you would send this to a server)
    console.log('Form submitted with data:', formData);

    // Show success message
    showAlert('تم إنشاء الحساب بنجاح!', 'success');

    // Optional: Reset form after successful submission
    setTimeout(() => {
        document.getElementById('signupForm').reset();
    }, 1500);
}

// ==================== Social Login Handler ====================
function handleSocialLogin(provider) {
    console.log(`Logging in with ${provider}...`);
    showAlert(`جاري تسجيل الدخول عبر ${provider}...`, 'info');
    
    // Add your social login logic here
    // Example:
    // if (provider === 'google') {
    //     window.location.href = 'https://accounts.google.com/...';
    // }
}

// ==================== Utility Functions ====================

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Style the alert
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-family: 'Lemonade', cursive;
    `;

    // Set colors based on type
    const colors = {
        success: { bg: '#d4edda', text: '#155724', border: '#c3e6cb' },
        error: { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' },
        info: { bg: '#d1ecf1', text: '#0c5460', border: '#bee5eb' }
    };

    const color = colors[type] || colors.info;
    alertDiv.style.backgroundColor = color.bg;
    alertDiv.style.color = color.text;
    alertDiv.style.border = `1px solid ${color.border}`;

    // Add animation
    const style = document.createElement('style');
    if (!document.querySelector('style[data-alert-animation]')) {
        style.setAttribute('data-alert-animation', 'true');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Add to page
    document.body.appendChild(alertDiv);

    // Remove after 3 seconds
    setTimeout(() => {
        alertDiv.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}
