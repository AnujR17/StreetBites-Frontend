document.addEventListener('DOMContentLoaded', () => {
    // Let's check if the user is authenticated
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // If not authenticated, redirect to login page
    if (!userStr || !token) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userStr);
    const usernameElement = document.getElementById('username');
    const avatarElement = document.getElementById('profile-avatar');
    const logoutBtn = document.getElementById('logout-btn');
    const fabAddRecipe = document.getElementById('fab-add-recipe');

    // Let's initialize the user profile with their details
    function initializeProfile() {
        if (user.email && avatarElement) {
            const emailHash = md5(user.email.toLowerCase().trim());
            avatarElement.src = `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=200`;
        }

        if (usernameElement) {
            usernameElement.textContent = user.username || user.email.split('@')[0];
        }
    }

    // Now, let's load the user's recipes
    async function loadUserRecipes() {
        try {
            const response = await fetch('https://street-bites-backend.vercel.app/api/recipes/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch recipes');

            const recipes = await response.json();
            const recipesGrid = document.getElementById('user-recipes-grid');
            
            if (recipesGrid) {
                if (!recipes || recipes.length === 0) {
                    recipesGrid.innerHTML = `
                        <div class="no-recipes">
                            <p>You haven't shared any recipes yet.</p>
                            <button onclick="window.location.href='add-recipe.html'" class="btn btn-primary">
                                Share Your First Recipe
                            </button>
                        </div>
                    `;
                } else {
                    displayUserRecipes(recipes, recipesGrid);
                }
            }
        } catch (error) {
            console.error('Error loading user recipes:', error);
            showMessage('Failed to load recipes', 'error');
        }
    }

    // This function helps us get the correct image URL
    function getImageUrl(imagePath) {
        if (!imagePath) return 'https://placehold.co/300x200?text=No+Image';
        if (imagePath.startsWith('http')) return imagePath;
        return `https://ylejllriwgtrpuzkcpek.supabase.co/storage/v1/object/public/recipe-images/${imagePath}`;
    }

    // Let's display the user's recipes in a nice format
    function displayUserRecipes(recipes, container) {
        container.innerHTML = recipes.map(recipe => `
            <article class="recipe-card">
                <div class="recipe-image-wrapper">
                    <img src="${getImageUrl(recipe.image_path)}" 
                         alt="${recipe.title}" 
                         class="recipe-image"
                         onerror="this.src='https://placehold.co/300x200?text=No+Image'">
                    <div class="recipe-overlay">
                        <div class="recipe-actions">
                            <a href="recipe-details.html?id=${recipe.id}" 
                               class="btn btn-primary btn-view">
                                View Recipe
                            </a>
                            <button onclick="confirmDelete('${recipe.id}')" 
                                    class="btn btn-danger btn-delete">
                                <svg viewBox="0 0 24 24" width="18" height="18">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="recipe-content">
                    <h4 class="recipe-title">${recipe.title}</h4>
                    <p class="recipe-description">${recipe.description}</p>
                    <div class="recipe-meta">
                        <div class="recipe-stats">
                            <span class="stat">⏱️ ${recipe.prep_time + recipe.cook_time} mins</span>
                            <span class="stat">👥 ${recipe.servings} servings</span>
                            <span class="stat difficulty-${recipe.difficulty.toLowerCase()}">${recipe.difficulty}</span>
                        </div>
                    </div>
                </div>
            </article>
        `).join('');
    }

    // Adding event listeners for logout and adding recipes
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }

    if (fabAddRecipe) {
        fabAddRecipe.addEventListener('click', () => {
            window.location.href = 'add-recipe.html';
        });
    }

    // Initialize the profile and load the user's recipes
    initializeProfile();
    loadUserRecipes();
});

// Global functions for HTML onclick handlers
window.confirmDelete = function(recipeId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Delete Recipe</h3>
            <p>Are you sure you want to delete this recipe? This action cannot be undone.</p>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-danger" onclick="deleteRecipe('${recipeId}')">Delete</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.closeModal = function() {
    const modal = document.querySelector('.modal');
    if (modal) modal.remove();
};

window.deleteRecipe = async function(recipeId) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
        const response = await fetch(`https://street-bites-backend.vercel.app/api/recipes/${recipeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete recipe');

        closeModal();
        showMessage('Recipe deleted successfully', 'success');
        setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
        console.error('Error deleting recipe:', error);
        showMessage('Failed to delete recipe', 'error');
    }
};

function showMessage(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}