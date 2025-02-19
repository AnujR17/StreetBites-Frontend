document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const passwordToggles = document.querySelectorAll('.password-toggle');

    // Toggle password visibility
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const input = toggle.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            const eyeIcon = toggle.querySelector('.eye-icon');
            eyeIcon.innerHTML = type === 'password' 
                ? `<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>`
                : `<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>`;
        });
    });

    // Validate form inputs
    const forms = document.querySelectorAll('.auth-form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input[required]');
        
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                validateInput(input);
            });

            input.addEventListener('blur', () => {
                validateInput(input);
            });
        });

        form.addEventListener('submit', (e) => {
            let isValid = true;
            
            inputs.forEach(input => {
                if (!validateInput(input)) {
                    isValid = false;
                }
            });

            if (!isValid) {
                e.preventDefault();
            }
        });
    });


    function validateInput(input) {
        const isValid = input.checkValidity();
        const errorElement = input.nextElementSibling.nextElementSibling;
        
        if (!isValid) {
            input.classList.add('invalid');
            input.classList.remove('valid');
            if (errorElement && errorElement.classList.contains('error-message')) {
                errorElement.style.display = 'block';
                errorElement.textContent = input.validationMessage;
            }
        } else {
            input.classList.add('valid');
            input.classList.remove('invalid');
            if (errorElement && errorElement.classList.contains('error-message')) {
                errorElement.style.display = 'none';
            }
        }

        // validation for confirm password
        if (input.id === 'confirm-password') {
            const password = document.getElementById('password');
            if (password && input.value !== password.value) {
                input.setCustomValidity("Passwords don't match");
                isValid = false;
            } else {
                input.setCustomValidity('');
            }
        }

        return isValid;
    }

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;

            try {
                const response = await fetch('https://street-bites-backend.vercel.app/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    const storage = remember ? localStorage : sessionStorage;
                    storage.setItem('token', data.session.access_token);
                    storage.setItem('user', JSON.stringify({
                        email: data.user.email,
                        id: data.user.id,
                        username: data.user.username
                    }));
                    window.location.href = 'index.html';
                } else {
                    throw new Error(data.error || 'Login failed');
                }
            } catch (error) {
                showError(error.message);
            }
        });
    }

    // Handle signup form submission
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const terms = document.getElementById('terms').checked;

            // Validate passwords and terms
            if (password !== confirmPassword) {
                showError('Passwords do not match');
                return;
            }

            if (!terms) {
                showError('Please accept the terms and conditions');
                return;
            }

            try {
                const response = await fetch('https://street-bites-backend.vercel.app/api/auth/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password, username })
                });

                const data = await response.json();

                if (response.ok) {
                    showSuccess('Account created successfully! Please check your email for verification.');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    throw new Error(data.error || 'Signup failed');
                }
            } catch (error) {
                showError(error.message);
            }
        });
    }

    // error message
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'auth-error fade-in';
        errorDiv.textContent = message;
        
        const form = document.querySelector('.auth-form');
        form.insertBefore(errorDiv, form.firstChild);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }

    // success message
    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'auth-success fade-in';
        successDiv.textContent = message;
        
        const form = document.querySelector('.auth-form');
        form.insertBefore(successDiv, form.firstChild);
        
        setTimeout(() => successDiv.remove(), 5000);
    }
});