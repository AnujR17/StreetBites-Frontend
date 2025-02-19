document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    const navAuth = document.querySelector('.nav-auth');

    // Handlin gthe mobile menu toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            mainNav?.classList.toggle('active');
        });
    }

    // This function updates the UI based on the user's authentication status
    function updateAuthUI() {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    
        if (!navAuth) return;
    
        try {
            if (token && userStr) {
                const user = JSON.parse(userStr);
                navAuth.innerHTML = `
                    <div class="user-menu">
                        <div class="user-menu-content">
                            <a href="profile.html" class="profile-link">
                                <img src="https://www.gravatar.com/avatar/${md5(user.email)}?d=identicon" 
                                     alt="${user.username || 'Profile'}" 
                                     class="avatar">
                            </a>
                            <button class="add-recipe-btn" onclick="window.location.href='add-recipe.html'">
                                <span>+</span> Share Recipe
                            </button>
                        </div>
                    </div>
                `;
            } else {
                navAuth.innerHTML = `
                    <div class="guest-menu">
                        <a href="login.html" class="btn btn-text">Login</a>
                        <a href="signup.html" class="btn btn-primary">Sign Up</a>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error updating auth UI:', error);
        }
    }

    // handling the logout process
    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    // Listen for changes in authentication state
    window.addEventListener('storage', (e) => {
        if (e.key === 'token' || e.key === 'user') {
            updateAuthUI();
        }
    });

    // Closes the mobile menu when clicking outside of it
    document.addEventListener('click', (e) => {
        if (mainNav?.classList.contains('active') && 
            !mainNav.contains(e.target) && 
            !menuToggle?.contains(e.target)) {
            mainNav.classList.remove('active');
        }
    });

    // Initialize the authentication UI
    updateAuthUI();

    // Handle any network errors 
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Network Error:', event.reason);
    });
});