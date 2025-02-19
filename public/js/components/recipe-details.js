document.addEventListener('DOMContentLoaded', () => {
    const recipeId = new URLSearchParams(window.location.search).get('id');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    let currentRecipe = null;

    function getImageUrl(imagePath) {
        if (!imagePath) return 'https://placehold.co/800x500?text=No+Image';
        if (imagePath.startsWith('http')) return imagePath;
        return `https://ylejllriwgtrpuzkcpek.supabase.co/storage/v1/object/public/recipe-images/${imagePath}`;
    }

    async function loadRecipeDetails() {
        try {
            const response = await fetch(`https://street-bites-backend.vercel.app/api/recipes/${recipeId}/details`);
            if (!response.ok) throw new Error('Failed to fetch recipe details');
            
            const recipe = await response.json();
            currentRecipe = recipe;
            console.log('Recipe details:', recipe);
            
            // Update page content
            document.title = `${recipe.title} - Street Bites`;
            document.getElementById('recipe-image').src = getImageUrl(recipe.image_path);
            document.getElementById('recipe-title').textContent = recipe.title;
            document.getElementById('recipe-author').textContent = recipe.user?.username || 'Unknown Chef';
            document.getElementById('recipe-description').textContent = recipe.description;
            document.getElementById('prep-time').textContent = `⏱️ ${recipe.prep_time + recipe.cook_time} mins`;
            document.getElementById('servings').textContent = `👥 ${recipe.servings} servings`;
            document.getElementById('difficulty').textContent = recipe.difficulty;

            // Update ingredients list
            const ingredientsList = document.getElementById('ingredients-list');
            const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
            ingredientsList.innerHTML = ingredients
                .map(ing => {
                    const ingredientText = typeof ing === 'string' ? 
                        ing.replace(/["[\]]/g, '') : 
                        ing.ingredient;
                    return `<li class="ingredient-item">
                        <span class="ingredient-icon">•</span>
                        <span class="ingredient-text">${ingredientText}</span>
                    </li>`;
                })
                .join('');

            // Update instructions list
            const instructionsList = document.getElementById('instructions-list');
            const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];
            instructionsList.innerHTML = instructions
                .sort((a, b) => a.step_number - b.step_number)
                .map(inst => `<li>${inst.instruction}</li>`)
                .join('');

            // Update interactions
            if (recipe.interactions?.likes_count !== undefined) {
                updateLikeCount(recipe.interactions.likes_count);
            }

            // Load comments
            await loadComments();
            
            // Check like status if logged in
            if (token) {
                await checkLikeStatus();
            }

        } catch (error) {
            console.error('Error loading recipe:', error);
            showError('Failed to load recipe details');
        }
    }

    // Like functionality
    const likeBtn = document.getElementById('like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', async () => {
                if (!token) {
                window.location.href = 'login.html';
                return;
                }

                try {
                    const response = await fetch(`https://street-bites-backend.vercel.app/api/interactions/${recipeId}/like`, {
                        method: 'POST',
                        headers: { 
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (!response.ok) throw new Error('Failed to update like');
                    
                    const data = await response.json();
                    if (data.liked !== undefined) {
                        likeBtn.classList.toggle('active', data.liked);
                        updateLikeCount(data.likes_count || 0);
                    }
                } catch (error) {
                    console.error('Error toggling like:', error);
                    showError('Failed to update like');
                }
            });
        }

    // Rating functionality
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('mouseover', () => {
            const rating = parseInt(star.dataset.rating);
            updateStarsDisplay(rating);
        });

        star.addEventListener('mouseout', () => {
            const currentRating = currentRecipe?.interactions?.rating?.average || 0;
            updateStarsDisplay(Math.round(currentRating / 2));
        });

        star.addEventListener('click', async () => {
            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            try {
                const rating = parseInt(star.dataset.rating) * 2;
                const response = await fetch(`https://street-bites-backend.vercel.app/api/interactions/${recipeId}/rate`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ rating })
                });

                if (!response.ok) throw new Error('Failed to submit rating');
                
                const data = await response.json();
                currentRecipe.interactions.rating = data.data;
                updateRatingDisplay(data.data);
            } catch (error) {
                console.error('Error rating recipe:', error);
                showError('Failed to submit rating');
            }
        });
    });

    // Comment functionality
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            const commentInput = document.getElementById('comment-input');
            const comment = commentInput.value.trim();
            
            if (!comment) return;

            try {
                const response = await fetch(`https://street-bites-backend.vercel.app/api/interactions/${recipeId}/comment`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ comment })
                });

                if (!response.ok) throw new Error('Failed to post comment');

                commentInput.value = '';
                await loadComments();
            } catch (error) {
                console.error('Error posting comment:', error);
                showError('Failed to post comment');
            }
        });
    }

    // Helper functions
    function updateStarsDisplay(rating) {
        stars.forEach((s, index) => {
            s.classList.toggle('active', index < rating);
        });
    }

    function updateRatingDisplay(rating) {
        const averageRating = Math.round(rating.average / 2);
        updateStarsDisplay(averageRating);
        document.getElementById('rating-count').textContent = 
            `(${rating.count} rating${rating.count !== 1 ? 's' : ''})`;
    }

    function updateLikeCount(count) {
        const likesCount = document.getElementById('likes-count');
        if (likesCount) {
            likesCount.textContent = count;
        }
    }

    async function checkLikeStatus() {
        try {
            const response = await fetch(`https://street-bites-backend.vercel.app/api/interactions/${recipeId}/like/status`, {
                headers: { 
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to check like status');
            
            const data = await response.json();
            if (likeBtn && data.liked !== undefined) {
                likeBtn.classList.toggle('active', data.liked);
                updateLikeCount(data.likes_count || 0);
            }
        } catch (error) {
            console.error('Error checking like status:', error);
            // Don't show error to user, just fail silently
        }
    }

    function getInitials(name) {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase();
    }

    async function loadComments() {
        try {
            const response = await fetch(`https://street-bites-backend.vercel.app/api/recipes/${recipeId}/comments`);
            if (!response.ok) throw new Error('Failed to load comments');
            
            const comments = await response.json();
            
            const commentsList = document.getElementById('comments-list');
            if (!comments.length) {
                commentsList.innerHTML = '<p class="no-comments">Be the first to comment!</p>';
                return;
            }

            commentsList.innerHTML = comments
                .map(comment => `
                    <div class="comment">
                        <div class="comment-header">
                            <div class="comment-avatar">${getInitials(comment.username)}</div>
                            <div class="comment-info">
                                <div class="comment-author">${comment.username}</div>
                                <div class="comment-date">${new Date(comment.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</div>
                            </div>
                        </div>
                        <p>${comment.comment}</p>
                    </div>
                `)
                .join('');
        } catch (error) {
            console.error('Error loading comments:', error);
            showError('Failed to load comments');
        }
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const container = document.querySelector('.recipe-content');
        const existingError = container.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        container.prepend(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }

    // Initialize
    if (recipeId) {
        loadRecipeDetails();
    } else {
        window.location.href = 'index.html';
    }
});