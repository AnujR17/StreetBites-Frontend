document.addEventListener('DOMContentLoaded', () => {
    const recipesGrid = document.getElementById('all-recipes-grid');

    async function loadAllRecipes() {
        try {
            const response = await fetch('https://street-bites-backend.vercel.app/api/recipes/cards');
            if (!response.ok) throw new Error('Failed to fetch recipes');
            
            const recipes = await response.json();
            
            if (recipesGrid) {
                if (!recipes.length) {
                    recipesGrid.innerHTML = '<p class="no-recipes">No recipes found</p>';
                    return;
                }

                recipesGrid.innerHTML = recipes.map(recipe => `
                    <article class="recipe-card">
                        <div class="recipe-image-wrapper">
                            <img src="${getImageUrl(recipe.image_path)}" 
                                 alt="${recipe.title}" 
                                 class="recipe-image"
                                 onerror="this.src='https://placehold.co/300x200?text=No+Image'">
                            <div class="recipe-overlay">
                                <a href="recipe-details.html?id=${recipe.id}" 
                                   class="btn btn-primary btn-view">
                                    View Recipe
                                </a>
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
        } catch (error) {
            console.error('Error loading recipes:', error);
            if (recipesGrid) {
                recipesGrid.innerHTML = '<p class="error">Failed to load recipes. Please try again later.</p>';
            }
        }
    }

    function getImageUrl(imagePath) {
        if (!imagePath) return 'https://placehold.co/300x200?text=No+Image';
        if (imagePath.startsWith('http')) return imagePath;
        return `https://ylejllriwgtrpuzkcpek.supabase.co/storage/v1/object/public/recipe-images/${imagePath}`;
    }

    // Initialize the recipe loading process
    loadAllRecipes();
});
