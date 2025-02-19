document.addEventListener('DOMContentLoaded', () => {
        const searchForm = document.getElementById('search-form');
    const newRecipesGrid = document.getElementById('new-recipes-grid');
    const featuredRecipesGrid = document.getElementById('featured-recipes-grid');
    const specialRecipeCard = document.querySelector('.special-recipe-card');
    const searchInput = document.getElementById('search-input');
        const searchResultsContainer = document.createElement('div');
    searchResultsContainer.className = 'search-results';

    
    const searchInputWrapper = document.querySelector('.search-input-wrapper');
    if (searchInputWrapper) {
        searchInputWrapper.parentNode.insertBefore(searchResultsContainer, searchInputWrapper.nextSibling);
    }

    // Setting up search
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            // Clear any pending searches 
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            // search for keywords
            if (query.length < 2) {
                searchResultsContainer.style.display = 'none';
                return;
            }

            // Wait a bit before searching to prevent too many requests ¬_¬ 
            searchTimeout = setTimeout(async () => {
                try {
                    const response = await fetch(`https://street-bites-backend.vercel.app/api/recipes/search?query=${encodeURIComponent(query)}`);
                    if (!response.ok) throw new Error('Search failed');
                    
                    const recipes = await response.json();
                    displaySearchResults(recipes);
                } catch (error) {
                    console.error('Oops, search failed:', error);
                }
            }, 300);
        });
    }

    // Organizing the search results
    function displaySearchResults(recipes) {
        if (!recipes.length) {
            searchResultsContainer.innerHTML = `
                <div class="no-results">
                    <p>Sorry, I couldn't find any recipes matching your search</p>
                </div>
            `;
            searchResultsContainer.style.display = 'block';
            return;
        }
    
        // search results
        searchResultsContainer.innerHTML = recipes.map(recipe => `
            <a href="recipe-details.html?id=${recipe.id}" class="search-result-item">
                <div class="search-result-info">
                    <h4>${recipe.title}</h4>
                    <p>
                        ${recipe.description.substring(0, 100)}${recipe.description.length > 100 ? '...' : ''} • 
                        ${recipe.prep_time + recipe.cook_time} mins • 
                        ${recipe.difficulty}
                    </p>
                </div>
            </a>
        `).join('');
        
        searchResultsContainer.style.display = 'block';
    }

    // Closes search results when clicked outside
    document.addEventListener('click', (e) => {
        if (!searchResultsContainer.contains(e.target) && 
            !searchForm.contains(e.target)) {
            searchResultsContainer.style.display = 'none';
        }
    });

    // Prevent form submission
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
        });
    }

    function getImageUrl(imagePath) {
        if (!imagePath) return 'https://placehold.co/300x200?text=No+Image';
        
        // If it's already a full URL, return as is
        if (imagePath.startsWith('http')) return imagePath;
        
        // Construct Supabase storage URL
        return `https://ylejllriwgtrpuzkcpek.supabase.co/storage/v1/object/public/recipe-images/${imagePath}`;
    }

    // Load initial content
    const loadInitialContent = async () => {
        try {
            const response = await fetch('https://street-bites-backend.vercel.app/api/recipes/cards');
            const recipes = await response.json();
            
            if (specialRecipeCard) {
                displaySpecialRecipe(recipes[0]);
            }
            
            if (newRecipesGrid) {
                displayRecipes(recipes.slice(0, 6), newRecipesGrid);
            }
            
            if (featuredRecipesGrid) {
                displayRecipes(recipes.filter(r => r.featured).slice(0, 6), featuredRecipesGrid);
            }
        } catch (error) {
            console.error('Error loading recipes:', error);
        }
    };

    // Display functions
    function displayRecipes(recipes, container) {
        container.innerHTML = recipes.map(recipe => `
            <article class="recipe-card">
                <div class="recipe-image-wrapper">
                    <img src="${getImageUrl(recipe.image_path)}" 
                         alt="${recipe.title}" 
                         class="recipe-image"
                         onerror="this.src='https://placehold.co/300x200?text=No+Image'">
                    <div class="recipe-overlay">
                        <button onclick="window.location.href='recipe-details.html?id=${recipe.id}'" 
                            class="btn btn-primary">
                        View Recipe
                        </button>                    </div>
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
    
    function displaySpecialRecipe(recipe) {
        if (!recipe) return;
        specialRecipeCard.innerHTML = `
            <div class="special-recipe-image-wrapper">
                <img src="${getImageUrl(recipe.image_path)}" 
                     alt="${recipe.title}" 
                     class="special-recipe-image"
                     onerror="this.src='https://placehold.co/600x400?text=No+Image'">
            </div>
            <div class="special-recipe-content">
                <h3>${recipe.title}</h3>
                <p>${recipe.description}</p>
                <div class="recipe-meta">
                    <div class="recipe-stats">
                        <span class="stat">⏱️ ${recipe.prep_time + recipe.cook_time} mins</span>
                        <span class="stat">👥 ${recipe.servings} servings</span>
                        <span class="stat difficulty-${recipe.difficulty.toLowerCase()}">${recipe.difficulty}</span>
                    </div>
                    <button onclick="window.location.href='recipe-details.html?id=${recipe.id}'" 
                            class="btn btn-primary">
                        View Recipe
                    </button>
                </div>
            </div>
        `;
    }

    // Initialize
    loadInitialContent();
});