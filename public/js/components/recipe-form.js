document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('recipe-form');
    const ingredientsList = document.getElementById('ingredients-list');
    const instructionsList = document.getElementById('instructions-list');
    const addIngredientBtn = document.getElementById('add-ingredient');
    const addInstructionBtn = document.getElementById('add-instruction');
    const imageTabs = document.querySelectorAll('.tab-btn');
    const imageUploadArea = document.getElementById('image-upload-area');
    const imageInput = document.getElementById('recipe-image');
    const imageUrlInput = document.getElementById('image-url');
    const imagePreview = document.getElementById('image-preview');

    // Creates ingredient row
    function createIngredientRow() {
        const row = document.createElement('div');
        row.className = 'ingredient-row';
        row.innerHTML = `
            <input type="number" 
                   class="ingredient-amount" 
                   min="0" 
                   step="0.25" 
                   placeholder="Amount" 
                   required>
            <select class="ingredient-unit" required>
                <option value="">Select Unit</option>
                <option value="g">grams</option>
                <option value="ml">ml</option>
                <option value="tsp">tsp</option>
                <option value="tbsp">tbsp</option>
                <option value="cup">cup</option>
                <option value="piece">piece</option>
            </select>
            <input type="text" 
                   class="ingredient-name" 
                   placeholder="Ingredient name" 
                   required>
            <button type="button" class="btn-icon remove-ingredient">×</button>
        `;
    
        // Add change event listeners for validation
        const inputs = row.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                input.classList.toggle('invalid', !input.value);
            });
        });
    
        row.querySelector('.remove-ingredient').addEventListener('click', () => {
            row.remove();
        });
    
        return row;
    }

    // Creates instruction step
    function createInstructionStep() {
        const step = document.createElement('div');
        step.className = 'instruction-step';
        step.innerHTML = `
            <div class="step-number">${instructionsList.children.length + 1}</div>
            <textarea required placeholder="Describe this step..."></textarea>
            <button type="button" class="btn-icon remove-step">×</button>
        `;

        step.querySelector('.remove-step').addEventListener('click', () => {
            step.remove();
            updateStepNumbers();
        });

        return step;
    }

    // Updates step numbers
    function updateStepNumbers() {
        const steps = instructionsList.querySelectorAll('.step-number');
        steps.forEach((step, index) => {
            step.textContent = index + 1;
        });
    }

    // Image handling
    function handleImage(file) {
        if (!file.type.match('image/(jpeg|jpg|png)')) {
            showMessage('Please upload a valid image file (JPG, JPEG, or PNG)', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Recipe preview">`;
            imagePreview.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    }

    // Tab switching
    imageTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            imageTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
        });
    });

    // Event listeners for image upload
    imageUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageUploadArea.classList.add('dragover');
    });

    imageUploadArea.addEventListener('dragleave', () => {
        imageUploadArea.classList.remove('dragover');
    });

    imageUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        imageUploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) handleImage(file);
    });

    imageUploadArea.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            handleImage(e.target.files[0]);
        }
    });

    imageUrlInput.addEventListener('change', async (e) => {
        const url = e.target.value.trim();
        if (url) {
            try {
                imagePreview.innerHTML = `<img src="${url}" alt="Recipe preview">`;
                imagePreview.classList.add('has-image');
            } catch (error) {
                showMessage('Invalid image URL', 'error');
            }
        }
    });

    // Add ingredient and instruction buttons
    addIngredientBtn.addEventListener('click', () => {
        ingredientsList.appendChild(createIngredientRow());
    });

    addInstructionBtn.addEventListener('click', () => {
        instructionsList.appendChild(createInstructionStep());
    });

    // Initialize with first ingredient and instruction
    if (!ingredientsList.children.length) {
        ingredientsList.appendChild(createIngredientRow());
    }
    if (!instructionsList.children.length) {
        instructionsList.appendChild(createInstructionStep());
    }

    // Form validation and submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            // Validate required fields
            const title = document.getElementById('recipe-title').value.trim();
            if (!title) throw new Error('Recipe title is required');

            const description = document.getElementById('recipe-description').value.trim();
            if (!description) throw new Error('Description is required');

            const prepTime = parseInt(document.getElementById('prep-time').value);
            if (!prepTime) throw new Error('Preparation time is required');

            const cookTime = parseInt(document.getElementById('cook-time').value);
            if (!cookTime) throw new Error('Cooking time is required');

            const servings = parseInt(document.getElementById('servings').value);
            if (!servings) throw new Error('Number of servings is required');

            const difficulty = document.querySelector('input[name="difficulty"]:checked');
            if (!difficulty) throw new Error('Please select a difficulty level');

            // Validate ingredients
            const ingredients = Array.from(ingredientsList.children).map(row => {
                const amount = row.querySelector('.ingredient-amount').value;
                const unit = row.querySelector('.ingredient-unit').value;
                const name = row.querySelector('.ingredient-name').value.trim();
                
                console.log('Ingredient values:', { amount, unit, name });
                
                if (!amount || !unit || !name) {
                    throw new Error('Please fill in all ingredient fields');
                }
                
                return `${amount} ${unit} ${name}`;
            });

            if (ingredients.length === 0) {
                throw new Error('At least one ingredient is required');
            }

            // Validate instructions
            const instructions = Array.from(instructionsList.querySelectorAll('textarea'))
                .map(ta => ta.value.trim())
                .filter(text => text.length > 0);

            if (instructions.length === 0) throw new Error('At least one instruction step is required');

            // Validate image
            const imageFile = imageInput.files[0];
            const imageUrl = imageUrlInput.value.trim();

            if (!imageFile && !imageUrl) {
                throw new Error('Please provide an image or image URL');
            }

            // Check authentication
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            // Create form data
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('prep_time', prepTime);
            formData.append('cook_time', cookTime);
            formData.append('servings', servings);
            formData.append('difficulty', difficulty.value);
            formData.append('ingredients', JSON.stringify(ingredients));
            formData.append('instructions', JSON.stringify(instructions));

            if (imageFile) {
                formData.append('image', imageFile);
            } else if (imageUrl) {
                formData.append('image_url', imageUrl);
            }

            // Submit form
            const response = await fetch('https://street-bites-backend.vercel.app/api/recipes', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create recipe');
            }

            showMessage('Recipe created successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);

        } catch (error) {
            console.error('Error:', error);
            showMessage(error.message, 'error');
        }
    });

    // Message display 
    function showMessage(message, type = 'error') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        Object.assign(messageDiv.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '1rem 2rem',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: type === 'error' ? 'var(--error-color)' : 'var(--success-color)',
            color: 'white',
            zIndex: '1000',
            animation: 'slideDown 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        });

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }
});