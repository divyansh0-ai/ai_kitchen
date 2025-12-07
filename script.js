const API_URL = 'http://localhost:8001';

// DOM Elements
const dishInput = document.getElementById('dishInput');
const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const errorAlert = document.getElementById('errorAlert');
const suggestionsSection = document.getElementById('suggestionsSection');
const suggestionsGrid = document.getElementById('suggestionsGrid');

// State
let currentMode = 'recipe'; // 'recipe' or 'parse'
let currentFilter = 'tasty'; // 'tasty', 'healthy', or 'quick'
let currentRecipe = null;
let originalServings = 4;

// Mode toggle
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;

        const dishInput = document.getElementById('dishInput');
        const sectionTitle = document.querySelector('.section-title');
        const filterOptions = document.getElementById('filterOptions');

        if (currentMode === 'recipe') {
            if (dishInput) {
                dishInput.placeholder = "Enter any dish name... Try 'Vegan Buddha Bowl' or 'Chocolate Mousse'";
            }
            if (filterOptions) filterOptions.style.display = 'none';
            loadSuggestions(); // Reload default suggestions
            if (sectionTitle) {
                sectionTitle.textContent = '✨ Popular Recipes';
            }
        } else {
            if (dishInput) {
                dishInput.placeholder = "Enter ingredients separated by commas (e.g. chicken, rice, garlic)";
            }
            if (filterOptions) filterOptions.style.display = 'block';
            if (sectionTitle) {
                sectionTitle.textContent = '🔍 Recipe Suggestions';
            }
            if (suggestionsGrid) {
                suggestionsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--gray-600);">Enter ingredients above to find recipes!</div>';
            }
        }
    });
});

// Filter button toggle
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
    });
});

// Load suggestions
async function loadSuggestions() {
    try {
        const response = await fetch(`${API_URL}/suggestions`);
        const data = await response.json();

        suggestionsGrid.innerHTML = data.suggestions.map(suggestion => `
            <div class="suggestion-card" onclick="searchRecipe('${suggestion.name}')">
                <div class="suggestion-icon">${suggestion.icon}</div>
                <div class="suggestion-name">${suggestion.name}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load suggestions:', error);
    }
}

// Show error
function showError(message) {
    errorAlert.textContent = message;
    errorAlert.classList.add('show');
    setTimeout(() => errorAlert.classList.remove('show'), 5000);
}

// Hide recipe
function hideRecipe() {
    document.getElementById('recipeDisplay').style.display = 'none';
    suggestionsSection.style.display = 'block';
}

// Display recipe in the beautiful new UI
function displayRecipe(recipe) {
    currentRecipe = recipe;
    originalServings = recipe.servings || 4;

    // Show the recipe display section
    document.getElementById('recipeDisplay').style.display = 'block';

    // Hide suggestions
    suggestionsSection.style.display = 'none';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Set recipe title
    const recipeTitleNew = document.querySelector('#recipeDisplay #recipeTitle');
    recipeTitleNew.textContent = recipe.name || 'Delicious Recipe';

    // Set recipe image
    const recipeImageNew = document.querySelector('#recipeDisplay #recipeImage');
    recipeImageNew.src = recipe.image_url || 'https://via.placeholder.com/900x400?text=Recipe+Image';
    recipeImageNew.alt = recipe.name || 'Recipe';

    // Improved error handling with multiple fallbacks
    recipeImageNew.onerror = function () {
        this.onerror = null;
        // Try a high-quality Unsplash source as first fallback
        if (!this.dataset.triedUnsplash) {
            this.dataset.triedUnsplash = 'true';
            this.src = `https://source.unsplash.com/1600x900/?${encodeURIComponent(recipe.name)},food`;
        } else if (!this.dataset.triedLorem) {
            // Try LoremFlickr as second fallback
            this.dataset.triedLorem = 'true';
            this.src = `https://loremflickr.com/800/600/${encodeURIComponent(recipe.name)},food/all`;
        }
    };

    // Set prep time, cook time, and category from REAL recipe data
    const prepTimeElement = document.getElementById('prepTime');
    const cookTimeElement = document.getElementById('cookTime');
    const categoryElement = document.getElementById('categoryDisplay');
    const descriptionElement = document.getElementById('recipeDescription');

    // Use actual data from the recipe object
    prepTimeElement.textContent = recipe.prep_time || '30 mins';
    cookTimeElement.textContent = recipe.cook_time || '45 mins';
    categoryElement.textContent = recipe.category || recipe.area || 'World Cuisine';

    // Set description if available
    if (recipe.description) {
        descriptionElement.textContent = recipe.description;
        document.getElementById('descriptionSection').style.display = 'block';
    } else if (recipe.area && recipe.category) {
        descriptionElement.textContent = `A ${recipe.category} dish from ${recipe.area}`;
        document.getElementById('descriptionSection').style.display = 'block';
    } else {
        descriptionElement.textContent = '';
        document.getElementById('descriptionSection').style.display = 'none';
    }

    // Set dietary badge based on recipe data
    const dietaryBadge = document.getElementById('dietaryBadge');

    // Check multiple sources to determine if vegetarian
    const isVegetarian = (
        (recipe.tags && (recipe.tags.includes('Vegetarian') || recipe.tags.includes('vegetarian'))) ||
        (recipe.category && recipe.category.toLowerCase().includes('vegetarian')) ||
        (recipe.name && recipe.name.toLowerCase().includes('vegetarian'))
    );

    const isVegan = (
        (recipe.tags && (recipe.tags.includes('Vegan') || recipe.tags.includes('vegan'))) ||
        (recipe.category && recipe.category.toLowerCase().includes('vegan')) ||
        (recipe.name && recipe.name.toLowerCase().includes('vegan'))
    );

    // Check if dish contains meat (for non-veg detection)
    const meatKeywords = ['chicken', 'beef', 'pork', 'lamb', 'fish', 'shrimp', 'prawn', 'meat', 'turkey', 'duck'];
    const hasNameMeat = recipe.name && meatKeywords.some(meat => recipe.name.toLowerCase().includes(meat));
    const hasCategoryMeat = recipe.category && meatKeywords.some(meat => recipe.category.toLowerCase().includes(meat));

    if (isVegan) {
        dietaryBadge.textContent = 'Vegan';
        dietaryBadge.style.display = 'inline-block';
        dietaryBadge.style.background = 'linear-gradient(135deg, #84cc16, #65a30d)';
        dietaryBadge.style.color = 'white';
    } else if (isVegetarian) {
        dietaryBadge.textContent = 'Vegetarian';
        dietaryBadge.style.display = 'inline-block';
        dietaryBadge.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        dietaryBadge.style.color = 'white';
    } else if (hasNameMeat || hasCategoryMeat) {
        dietaryBadge.textContent = 'Non-Veg';
        dietaryBadge.style.display = 'inline-block';
        dietaryBadge.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        dietaryBadge.style.color = 'white';
    } else {
        // If we can't determine, hide the badge rather than showing wrong info
        dietaryBadge.style.display = 'none';
    }

    // Set servings count
    document.getElementById('servingsCount').textContent = recipe.servings || 4;

    // Set instructions
    const instructionsListNew = document.querySelector('#recipeDisplay #instructionsList');
    instructionsListNew.innerHTML = '';
    if (recipe.instructions && recipe.instructions.length > 0) {
        recipe.instructions.forEach(instruction => {
            const li = document.createElement('li');
            li.textContent = instruction;
            instructionsListNew.appendChild(li);
        });
    }

    // Set nutrition (if available)
    if (recipe.nutrition) {
        document.getElementById('nutritionSection').style.display = 'block';
        const nutritionInfo = document.getElementById('nutritionInfo');
        nutritionInfo.innerHTML = '';

        // Create nutrition items from the nutrition object
        const nutrition = recipe.nutrition;
        const nutritionItems = [
            { label: 'Calories', value: nutrition.calories + ' kcal' },
            { label: 'Protein', value: nutrition.protein },
            { label: 'Carbs', value: nutrition.carbs },
            { label: 'Fat', value: nutrition.fat },
            { label: 'Saturated Fat', value: nutrition.saturated_fat || '0g' },
            { label: 'Fiber', value: nutrition.fiber },
            { label: 'Sugar', value: nutrition.sugar || '0g' },
            { label: 'Sodium', value: nutrition.sodium || '0mg' }
        ];

        nutritionItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'nutrition-item';
            div.innerHTML = `
                <span class="nutrition-label">${item.label}</span>
                <span class="nutrition-value">${item.value}</span>
            `;
            nutritionInfo.appendChild(div);
        });
    } else {
        document.getElementById('nutritionSection').style.display = 'none';
    }

    // Set YouTube link
    if (recipe.youtube_url) {
        document.getElementById('youtubeSection').style.display = 'block';
        const youtubeLink = document.getElementById('youtubeLink');
        youtubeLink.href = recipe.youtube_url;
    } else {
        document.getElementById('youtubeSection').style.display = 'none';
    }

    // Update ingredients and favorite button
    updateIngredientListWithReplacements();
    updateFavoriteButton();
}

function adjustServings(change) {
    const servingsElement = document.getElementById('servingsCount');
    let currentServings = parseInt(servingsElement.textContent);

    const newServings = currentServings + change;
    if (newServings < 1) return;

    servingsElement.textContent = newServings;
    updateIngredientListWithReplacements();
}

// Close recipe display
function closeRecipeDisplay() {
    document.getElementById('recipeDisplay').style.display = 'none';
    suggestionsSection.style.display = 'block';
}

// Search recipe
async function searchRecipe(dishName) {
    const query = dishName || dishInput.value.trim();

    if (!query) {
        showError(currentMode === 'recipe' ? 'Please enter a dish name' : 'Please enter ingredients');
        return;
    }

    // If in parse mode and searching from input (not clicking a suggestion), use ingredient search
    if (currentMode === 'parse' && !dishName) {
        await generateRecipeFromIngredients(query, currentFilter);
        return;
    }

    // Otherwise (recipe mode OR clicking a suggestion), fetch the full recipe
    loading.classList.add('show');
    hideRecipe();
    errorAlert.classList.remove('show');

    try {
        const response = await fetch(`${API_URL}/generate-recipe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dish_name: query })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to generate recipe');
        }

        const recipe = await response.json();
        displayRecipe(recipe);
        if (!dishName) dishInput.value = ''; // Clear input only if manual search
    } catch (error) {
        showError(error.message);
        suggestionsSection.style.display = 'block';
    } finally {
        loading.classList.remove('show');
    }
}

// Event listeners
searchBtn.addEventListener('click', () => searchRecipe());
dishInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchRecipe();
});

// Initialize
loadSuggestions();

// Navigation Functions
function showMainView() {
    const mainView = document.getElementById('mainView');
    const normalizerView = document.getElementById('unitNormalizerView');
    const myRecipesView = document.getElementById('myRecipesView');
    const recipeDisplay = document.getElementById('recipeDisplay');
    const navLinks = document.querySelectorAll('.nav-link');

    mainView.style.display = 'block';
    normalizerView.style.display = 'none';
    if (myRecipesView) myRecipesView.style.display = 'none';
    recipeDisplay.style.display = 'none';

    navLinks.forEach((link, index) => {
        link.classList.toggle('active', index === 0);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showUnitNormalizer() {
    const mainView = document.getElementById('mainView');
    const normalizerView = document.getElementById('unitNormalizerView');
    const myRecipesView = document.getElementById('myRecipesView');
    const recipeDisplay = document.getElementById('recipeDisplay');
    const navLinks = document.querySelectorAll('.nav-link');

    mainView.style.display = 'none';
    normalizerView.style.display = 'block';
    if (myRecipesView) myRecipesView.style.display = 'none';
    recipeDisplay.style.display = 'none';

    navLinks.forEach((link, index) => {
        link.classList.toggle('active', index === 1);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Legacy function for compatibility
function switchView(viewName) {
    if (viewName === 'main') {
        showMainView();
    } else if (viewName === 'normalizer') {
        showUnitNormalizer();
    }
}

// Unit Normalizer
function convertUnits() {
    const value = parseFloat(document.getElementById('convertValue').value);
    const fromUnit = document.getElementById('convertFrom').value;
    const toUnit = document.getElementById('convertTo').value;
    const resultElement = document.getElementById('convertResult');

    if (isNaN(value) || value < 0) {
        resultElement.textContent = 'Invalid Input';
        resultElement.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        return;
    }

    const volumeUnits = {
        ml: 1,
        l: 1000,
        cup: 240,
        tbsp: 15,
        tsp: 5,
        'fl-oz': 29.5735,
        pint: 473.176,
        quart: 946.353,
        gallon: 3785.41
    };

    const weightUnits = {
        g: 1,
        kg: 1000,
        oz: 28.3495,
        lb: 453.592
    };

    const fromIsVolume = fromUnit in volumeUnits;
    const toIsVolume = toUnit in volumeUnits;
    const fromIsWeight = fromUnit in weightUnits;
    const toIsWeight = toUnit in weightUnits;

    if ((fromIsVolume && toIsWeight) || (fromIsWeight && toIsVolume)) {
        resultElement.textContent = '⚠️ Cannot convert';
        resultElement.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        return;
    }

    let result;
    if (fromIsVolume && toIsVolume) {
        const baseValue = value * volumeUnits[fromUnit];
        result = baseValue / volumeUnits[toUnit];
    } else if (fromIsWeight && toIsWeight) {
        const baseValue = value * weightUnits[fromUnit];
        result = baseValue / weightUnits[toUnit];
    } else {
        resultElement.textContent = 'Error';
        return;
    }

    let formattedResult;
    if (result >= 1000) {
        formattedResult = result.toFixed(0);
    } else if (result >= 10) {
        formattedResult = result.toFixed(1);
    } else if (result >= 1) {
        formattedResult = result.toFixed(2);
    } else {
        formattedResult = result.toFixed(3);
    }

    const unitNames = {
        ml: 'ml', l: 'L', cup: 'cups', tbsp: 'tbsp', tsp: 'tsp',
        'fl-oz': 'fl oz', pint: 'pints', quart: 'quarts', gallon: 'gallons',
        g: 'g', kg: 'kg', oz: 'oz', lb: 'lbs'
    };

    resultElement.textContent = `${formattedResult} ${unitNames[toUnit]}`;
    resultElement.style.background = 'linear-gradient(135deg, var(--primary-light), var(--primary))';
}

// New function to generate recipe from ingredients with filter
async function generateRecipeFromIngredients(ingredientsText, filter) {
    loading.classList.add('show');
    hideRecipe();
    errorAlert.classList.remove('show');

    try {
        const response = await fetch(`${API_URL}/generate-recipe-from-ingredients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ingredients: ingredientsText,
                filter_type: filter
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to generate recipe');
        }

        const recipe = await response.json();
        displayRecipe(recipe);
        dishInput.value = ''; // Clear input
    } catch (error) {
        showError(error.message);
        suggestionsSection.style.display = 'block';
    } finally {
        loading.classList.remove('show');
    }
}

// Ingredient Replacement Feature
async function showIngredientAlternatives(ingredientName) {
    const overlay = document.createElement('div');
    overlay.className = 'alternatives-overlay show';
    document.body.appendChild(overlay);

    const popup = document.createElement('div');
    popup.className = 'alternatives-popup show';
    popup.innerHTML = `
        <div class="popup-header">
            <h3 class="popup-title">Finding alternatives...</h3>
            <button class="popup-close" onclick="closeAlternativesPopup()">✕</button>
        </div>
        <div class="loading" style="display: flex; margin: 2rem 0;">
            <div class="spinner"></div>
        </div>
    `;
    document.body.appendChild(popup);

    try {
        const response = await fetch(`${API_URL}/suggest-ingredient-replacement`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ingredient: ingredientName,
                recipe_name: currentRecipe.name
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get alternatives');
        }

        const data = await response.json();

        popup.innerHTML = `
            <div class="popup-header">
                <h3 class="popup-title">Alternatives for "${data.original}"</h3>
                <button class="popup-close" onclick="closeAlternativesPopup()">✕</button>
            </div>
            <p style="color: var(--gray-600); margin-bottom: 1.5rem; font-size: 0.9rem;">${data.notes}</p>
            <ul class="alternatives-list">
                ${data.alternatives.map(alt => `
                    <li class="alternative-item">
                        <span style="font-weight: 600;">✓ ${alt}</span>
                    </li>
                `).join('')}
            </ul>
        `;
    } catch (error) {
        popup.innerHTML = `
            <div class="popup-header">
                <h3 class="popup-title">Error</h3>
                <button class="popup-close" onclick="closeAlternativesPopup()">✕</button>
            </div>
            <p style="color: var(--gray-600);">Could not fetch alternatives. Please try again.</p>
        `;
    }
}

function closeAlternativesPopup() {
    const overlay = document.querySelector('.alternatives-overlay');
    const popup = document.querySelector('.alternatives-popup');

    if (overlay) overlay.remove();
    if (popup) popup.remove();
}

// Update the ingredient list display to include replacement buttons
function updateIngredientListWithReplacements() {
    const ingredientsListNew = document.querySelector('#recipeDisplay #ingredientsList');
    ingredientsListNew.innerHTML = '';

    if (currentRecipe.ingredients && currentRecipe.ingredients.length > 0) {
        const currentServings = parseInt(document.getElementById('servingsCount').textContent);
        const ratio = currentServings / originalServings;

        currentRecipe.ingredients.forEach(ing => {
            const li = document.createElement('li');

            // Try to parse and scale the measure
            let scaledMeasure = ing.measure;
            const match = ing.measure.match(/^([\d\.\/\s]+)(.*)$/);

            if (match) {
                const numberPart = match[1].trim();
                const textPart = match[2];

                // Simple fraction parser
                let value = 0;
                if (numberPart.includes('/')) {
                    const [num, den] = numberPart.split('/').map(Number);
                    value = num / den;
                } else if (numberPart.includes(' ')) {
                    const parts = numberPart.split(' ');
                    if (parts.length === 2 && parts[1].includes('/')) {
                        const [num, den] = parts[1].split('/').map(Number);
                        value = Number(parts[0]) + (num / den);
                    } else {
                        value = Number(numberPart);
                    }
                } else {
                    value = Number(numberPart);
                }

                if (!isNaN(value)) {
                    const newValue = value * ratio;
                    scaledMeasure = (Number.isInteger(newValue) ? newValue : newValue.toFixed(1).replace('.0', '')) + textPart;
                }
            }

            li.innerHTML = `
                <span>${scaledMeasure} ${ing.name}</span>
                <button class="ingredient-replace-btn" onclick="showIngredientAlternatives('${ing.name.replace(/'/g, "\\'")}')">
                    Replace
                </button>
            `;
            ingredientsListNew.appendChild(li);
        });
    }
}

// ============================================
// FAVORITE RECIPES FEATURE
// ============================================

// Get favorites from localStorage
function getFavorites() {
    const favorites = localStorage.getItem('favoriteRecipes');
    return favorites ? JSON.parse(favorites) : [];
}

// Save favorites to localStorage
function saveFavorites(favorites) {
    localStorage.setItem('favoriteRecipes', JSON.stringify(favorites));
}

// Check if a recipe is favorited
function isFavorite(recipeName) {
    const favorites = getFavorites();
    return favorites.some(fav => fav.name === recipeName);
}

// Toggle favorite status
function toggleFavorite() {
    if (!currentRecipe) return;

    const favorites = getFavorites();
    const index = favorites.findIndex(fav => fav.name === currentRecipe.name);
    const favoriteBtn = document.getElementById('favoriteBtn');
    const favoriteBtnText = document.getElementById('favoriteBtnText');

    if (index > -1) {
        // Remove from favorites
        favorites.splice(index, 1);
        favoriteBtn.classList.remove('favorited');
        favoriteBtnText.textContent = 'Add to Favorites';
    } else {
        // Add to favorites
        favorites.push({
            name: currentRecipe.name,
            image_url: currentRecipe.image_url,
            category: currentRecipe.category,
            area: currentRecipe.area,
            prep_time: currentRecipe.prep_time,
            cook_time: currentRecipe.cook_time,
            savedAt: new Date().toISOString()
        });
        favoriteBtn.classList.add('favorited');
        favoriteBtnText.textContent = 'Remove from Favorites';
    }

    saveFavorites(favorites);
}

// Update favorite button state
function updateFavoriteButton() {
    if (!currentRecipe) return;

    const favoriteBtn = document.getElementById('favoriteBtn');
    const favoriteBtnText = document.getElementById('favoriteBtnText');

    if (isFavorite(currentRecipe.name)) {
        favoriteBtn.classList.add('favorited');
        favoriteBtnText.textContent = 'Remove from Favorites';
    } else {
        favoriteBtn.classList.remove('favorited');
        favoriteBtnText.textContent = 'Add to Favorites';
    }
}

// Show My Recipes view
function showMyRecipes() {
    const mainView = document.getElementById('mainView');
    const normalizerView = document.getElementById('unitNormalizerView');
    const myRecipesView = document.getElementById('myRecipesView');
    const recipeDisplay = document.getElementById('recipeDisplay');
    const navLinks = document.querySelectorAll('.nav-link');

    // Show My Recipes view
    mainView.style.display = 'none';
    normalizerView.style.display = 'none';
    if (myRecipesView) myRecipesView.style.display = 'block';
    recipeDisplay.style.display = 'none';

    // Update active nav link
    navLinks.forEach((link, index) => {
        link.classList.toggle('active', index === 2);
    });

    // Load and display favorites
    displayFavoriteRecipes();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Display favorite recipes
function displayFavoriteRecipes() {
    const favorites = getFavorites();
    const favoritesGrid = document.getElementById('favoritesGrid');
    const emptyState = document.getElementById('emptyFavoritesState');

    if (favorites.length === 0) {
        favoritesGrid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    favoritesGrid.innerHTML = favorites.map(recipe => `
        <div class="suggestion-card" onclick="searchRecipe('${recipe.name}')" style="position: relative;">
            <div class="favorite-badge" title="Favorite"></div>
            <div class="suggestion-icon">
                <img src="${recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'}"
                     alt="${recipe.name}"
                     style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover;"
                     onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';">
            </div>
            <div class="suggestion-name">${recipe.name}</div>
            ${recipe.category ? `<div style="font-size: 0.8rem; color: var(--primary); margin-top: 0.5rem;">${recipe.category}</div>` : ''}
        </div>
    `).join('');
}
