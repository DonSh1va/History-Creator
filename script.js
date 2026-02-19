// Global Variables
let characters = [];
let places = [];
let trailers = [];
let downloads = [];
let currentCharacter = null;
let editingCharacterId = null;
let editingPlaceId = null;
let mapClickPosition = null;
let editingHistoryOnly = false;

// Placeholder image for missing photos - replace with your own image path
const PLACEHOLDER_PHOTO = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzJkMmQyZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM4ODgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Gb3RvIG5vIGVuY29udHJhZGE8L3RleHQ+PC9zdmc+';

// Map state
let mapState = {
    scale: 2.5,
    translateX: 0,
    translateY: -700,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragStartTranslateX: 0,
    dragStartTranslateY: 0
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initializeEventListeners();
    renderCharacterList();
    renderPlacesList();
    renderMapPins();
    renderTrailersList();
    renderDownloadsList();
});

// Load data from localStorage
function loadData() {
    try {
        const savedCharacters = localStorage.getItem('gta_characters');
        const savedPlaces = localStorage.getItem('gta_places');
        const savedTrailers = localStorage.getItem('gta_trailers');
        const savedDownloads = localStorage.getItem('gta_downloads');

        if (savedCharacters) characters = JSON.parse(savedCharacters);
        if (savedPlaces) places = JSON.parse(savedPlaces);
        if (savedTrailers) trailers = JSON.parse(savedTrailers);
        if (savedDownloads) downloads = JSON.parse(savedDownloads);
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error al cargar los datos', 'error');
    }
}

// Save data to localStorage
function saveData() {
    try {
        localStorage.setItem('gta_characters', JSON.stringify(characters));
        localStorage.setItem('gta_places', JSON.stringify(places));
        localStorage.setItem('gta_trailers', JSON.stringify(trailers));
        localStorage.setItem('gta_downloads', JSON.stringify(downloads));
    } catch (error) {
        console.error('Error saving data:', error);
        showToast('Error al guardar los datos', 'error');
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // Admin panel toggle
    document.getElementById('adminToggle').addEventListener('click', toggleAdminPanel);

    // Add character button
    document.getElementById('addCharacterBtn').addEventListener('click', () => {
        openCharacterModal();
    });

    // Character form submission
    document.getElementById('characterForm').addEventListener('submit', handleCharacterSubmit);

    // Photo upload
    const photoPreview = document.getElementById('photoPreview');
    const photoInput = document.getElementById('characterPhoto');
    
    photoPreview.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', handlePhotoUpload);

    // Birthday change event for auto-calculation
    document.getElementById('birthday').addEventListener('change', handleBirthdayChange);

    // Add relationship buttons
    document.querySelectorAll('.add-relationship-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            addRelationshipField(this.dataset.type);
        });
    });

    // Add vehicle button
    document.querySelector('.add-vehicle-btn').addEventListener('click', addVehicleField);

    // Add place button
    document.getElementById('addPlaceBtn').addEventListener('click', openPlaceModal);

    // Add trailer button
    document.getElementById('addTrailerBtn').addEventListener('click', openTrailerModal);

    // Map click event
    document.getElementById('mapImage').addEventListener('dblclick', handleMapClick);

    // Place form submission
    document.getElementById('placeForm').addEventListener('submit', handlePlaceSubmit);

    // Place photo upload
    const placePhotoPreview = document.getElementById('placePhotoPreview');
    const placePhotoInput = document.getElementById('placePhoto');
    
    placePhotoPreview.addEventListener('click', () => placePhotoInput.click());
    placePhotoInput.addEventListener('change', handlePlacePhotoUpload);

    // Map controls
    document.getElementById('zoomIn').addEventListener('click', () => zoomMap(0.2));
    document.getElementById('zoomOut').addEventListener('click', () => zoomMap(-0.2));
    document.getElementById('resetView').addEventListener('click', resetMapView);

    // Map drag and scroll events
    initializeMapInteractions();
}

// Switch between tabs
function switchTab(tabName) {
    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
}

// Toggle admin panel
function toggleAdminPanel() {
    const adminPanel = document.getElementById('adminPanel');
    adminPanel.classList.toggle('active');
}

// Character Management Functions
function openCharacterModal(characterId = null) {
    const modal = document.getElementById('characterModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('characterForm');
    const historySection = document.getElementById('historySection');

    editingCharacterId = characterId;
    editingHistoryOnly = false; // Not in history-only mode

    // Reset submit button to normal behavior
    const submitBtn = form.querySelector('button[type="submit"].save-btn');
    submitBtn.textContent = 'Guardar Personaje';
    submitBtn.onclick = null; // Remove any custom onclick

    // Show all sections first
    const allSections = form.querySelectorAll('.form-section');
    allSections.forEach(section => {
        section.style.display = 'block';
    });

    if (characterId) {
        const character = characters.find(c => c.id === characterId);
        if (character) {
            modalTitle.textContent = 'Editar Personaje';
            populateCharacterForm(character);
            historySection.style.display = 'none'; // Hide history section when editing full character
        }
    } else {
        modalTitle.textContent = 'Nuevo Personaje';
        form.reset();
        clearDynamicFields();
        historySection.style.display = 'none'; // Hide history section when creating
    }

    modal.classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    
    // If we were in history-only mode, restore required attributes
    if (editingHistoryOnly) {
        const form = document.getElementById('characterForm');
        form.querySelectorAll('[data-was-required="true"]').forEach(field => {
            field.setAttribute('required', '');
            field.removeAttribute('data-was-required');
        });
    }
    
    editingCharacterId = null;
    editingHistoryOnly = false;
    
    // Reset submit button to normal behavior
    const form = document.getElementById('characterForm');
    const submitBtn = form.querySelector('button[type="submit"].save-btn');
    submitBtn.textContent = 'Guardar Personaje';
    submitBtn.onclick = null;
}

function populateCharacterForm(character) {
    // Basic info
    document.getElementById('fullName').value = character.fullName || '';
    document.getElementById('originCountry').value = character.originCountry || '';
    document.getElementById('residence').value = character.residence || '';
    document.getElementById('gender').value = character.gender || 'Hombre';
    document.getElementById('birthday').value = character.birthday || '';
    
    // Calculate age and zodiac from birthday if available
    if (character.birthday) {
        const age = calculateAge(character.birthday);
        const zodiac = calculateZodiac(character.birthday);
        document.getElementById('age').value = age;
        document.getElementById('zodiac').value = zodiac;
    } else {
        document.getElementById('age').value = character.age || '';
        document.getElementById('zodiac').value = character.zodiac || 'Aries';
    }
    
    document.getElementById('orientation').value = character.orientation || 'Heterosexual';
    document.getElementById('education').value = character.education || '';
    document.getElementById('occupation').value = character.occupation || '';

    // Physical description
    document.getElementById('physicalDescription').value = character.physicalDescription || '';

    // Character history
    setHistoryContent(character.history || '');

    // Photo
    if (character.photo) {
        const photoPreview = document.getElementById('photoPreview');
        photoPreview.innerHTML = `<img src="${character.photo}" alt="Character Photo">`;
    }

    // Relationships
    if (character.relationships) {
        character.relationships.family?.forEach(rel => addRelationshipField('family', rel));
        character.relationships.friends?.forEach(rel => addRelationshipField('friend', rel));
    }

    // Vehicles
    if (character.vehicles) {
        character.vehicles.forEach(vehicle => addVehicleField(vehicle));
    }
}

function clearDynamicFields() {
    document.getElementById('familyRelationships').innerHTML = '';
    document.getElementById('friendRelationships').innerHTML = '';
    document.getElementById('vehiclesList').innerHTML = '';
    
    const photoPreview = document.getElementById('photoPreview');
    photoPreview.innerHTML = '<i class="fas fa-camera"></i><span>Subir Foto</span>';
}

function handleCharacterSubmit(e) {
    e.preventDefault();

    if (editingHistoryOnly) {
        saveCharacterHistory(editingCharacterId);
        return;
    }

    const characterData = {
        id: editingCharacterId || generateId(),
        fullName: document.getElementById('fullName').value,
        originCountry: document.getElementById('originCountry').value,
        residence: document.getElementById('residence').value,
        gender: document.getElementById('gender').value,
        age: document.getElementById('age').value,
        birthday: document.getElementById('birthday').value,
        zodiac: document.getElementById('zodiac').value,
        orientation: document.getElementById('orientation').value,
        education: document.getElementById('education').value,
        occupation: document.getElementById('occupation').value,
        physicalDescription: document.getElementById('physicalDescription').value,
        history: getHistoryContent(),
        photo: (() => {
            const img = document.getElementById('photoPreview').querySelector('img');
            return img ? img.src : null;
        })(),
        relationships: collectRelationships(),
        vehicles: collectVehicles(),
        createdAt: editingCharacterId ? 
            characters.find(c => c.id === editingCharacterId).createdAt : 
            new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (editingCharacterId) {
        const index = characters.findIndex(c => c.id === editingCharacterId);
        characters[index] = characterData;
        showToast('Personaje actualizado correctamente', 'success');
    } else {
        characters.push(characterData);
        showToast('Personaje creado correctamente', 'success');
    }

    saveData();
    renderCharacterList();
    closeModal('characterModal');
}

function collectRelationships() {
    const relationships = { family: [], friends: [] };

    // Collect family relationships
    document.querySelectorAll('#familyRelationships .relationship-input').forEach(input => {
        const name = input.querySelector('input[type="text"]').value;
        const relation = input.querySelector('input[type="text"]:nth-child(2)').value;
        if (name && relation) {
            relationships.family.push({ name, relation });
        }
    });

    // Collect friend relationships
    document.querySelectorAll('#friendRelationships .relationship-input').forEach(input => {
        const name = input.querySelector('input[type="text"]').value;
        const description = input.querySelector('input[type="text"]:nth-child(2)').value;
        if (name && description) {
            relationships.friends.push({ name, description });
        }
    });

    return relationships;
}

function collectVehicles() {
    const vehicles = [];
    document.querySelectorAll('.vehicle-input').forEach(input => {
        const vehicle = input.querySelector('input[type="text"]').value;
        if (vehicle) {
            vehicles.push(vehicle);
        }
    });
    return vehicles;
}

function addRelationshipField(type, data = null) {
    const container = type === 'family' ? 
        document.getElementById('familyRelationships') : 
        document.getElementById('friendRelationships');

    const div = document.createElement('div');
    div.className = 'relationship-input';

    const nameLabel = type === 'family' ? 'Nombre' : 'Nombre';
    const secondLabel = type === 'family' ? 'Relación' : 'Descripción';
    const secondPlaceholder = type === 'family' ? 'Ej: Padre, Hermano' : 'Ej: Amigo de la infancia';

    div.innerHTML = `
        <input type="text" placeholder="${nameLabel}" value="${data?.name || ''}">
        <input type="text" placeholder="${secondPlaceholder}" value="${type === 'family' ? (data?.relation || '') : (data?.description || '')}">
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">
            <i class="fas fa-trash"></i>
        </button>
    `;

    container.appendChild(div);
}

function addVehicleField(data = null) {
    const container = document.getElementById('vehiclesList');
    
    const div = document.createElement('div');
    div.className = 'vehicle-input';
    div.style.display = 'grid';
    div.style.gridTemplateColumns = '1fr auto';
    div.style.gap = '0.5rem';
    div.style.alignItems = 'center';
    div.style.marginBottom = '0.5rem';

    div.innerHTML = `
        <input type="text" placeholder="Ej: Turismo R, Banshee 900R" value="${data || ''}">
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">
            <i class="fas fa-trash"></i>
        </button>
    `;

    container.appendChild(div);
}

function renderCharacterList() {
    const container = document.getElementById('characterList');
    
    if (characters.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No hay personajes creados</p></div>';
        return;
    }

    container.innerHTML = characters.map(character => `
        <div class="character-item ${currentCharacter?.id === character.id ? 'active' : ''}" 
             onclick="selectCharacter('${character.id}')">
            <div class="character-item-name">${character.fullName}</div>
            <div class="character-item-info">
                ${character.occupation || 'Sin ocupación'} • ${character.age || '?'} años
            </div>
        </div>
    `).join('');
}

function selectCharacter(characterId) {
    currentCharacter = characters.find(c => c.id === characterId);
    renderCharacterList();
    renderCharacterDetails();
}

function renderCharacterDetails() {
    const container = document.getElementById('characterView');
    
    if (!currentCharacter) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-circle"></i>
                <p>Selecciona un personaje para ver los detalles</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="character-detail-container">
            <div class="character-photo-section">
                ${currentCharacter.photo ? 
                    `<img src="${currentCharacter.photo}" alt="${currentCharacter.fullName}" class="character-photo">` :
                    `<div class="character-photo" style="display: flex; align-items: center; justify-content: center; background: #2d2d2d;">
                        <i class="fas fa-user-circle" style="font-size: 4rem; color: #666;"></i>
                    </div>`
                }
                <div class="character-actions">
                    <button onclick="openCharacterModal('${currentCharacter.id}')" class="add-btn" style="width: 100%;">
                        <i class="fas fa-edit"></i> Editar Personaje
                    </button>
                    <button onclick="editCharacterHistory('${currentCharacter.id}')" class="admin-btn" style="width: 100%; margin-top: 0.5rem;">
                        <i class="fas fa-book"></i> Editar Historia
                    </button>
                    <button onclick="deleteCharacter('${currentCharacter.id}')" class="admin-btn danger" style="width: 100%; margin-top: 0.5rem;">
                        <i class="fas fa-trash"></i> Eliminar Personaje
                    </button>
                </div>
            </div>
            
            <div class="character-info-section">
                <div class="info-section">
                    <h4><i class="fas fa-user"></i> Información Básica</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Nombre Completo</span>
                            <span class="info-value">${currentCharacter.fullName}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">País de Origen</span>
                            <span class="info-value">${currentCharacter.originCountry || 'No especificado'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Lugar de Residencia</span>
                            <span class="info-value">${currentCharacter.residence || 'No especificado'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Género</span>
                            <span class="info-value">${currentCharacter.gender}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Edad</span>
                            <span class="info-value">${currentCharacter.age || 'No especificado'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Fecha de Nacimiento</span>
                            <span class="info-value">${currentCharacter.birthday || 'No especificado'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Signo Zodiacal</span>
                            <span class="info-value">${currentCharacter.zodiac}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Orientación Sexual</span>
                            <span class="info-value">${currentCharacter.orientation}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Educación</span>
                            <span class="info-value">${currentCharacter.education || 'No especificado'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Ocupación</span>
                            <span class="info-value">${currentCharacter.occupation || 'No especificado'}</span>
                        </div>
                    </div>
                </div>

                ${currentCharacter.physicalDescription ? `
                    <div class="info-section">
                        <h4><i class="fas fa-body"></i> Descripción Física</h4>
                        <p>${currentCharacter.physicalDescription}</p>
                    </div>
                ` : ''}

                ${currentCharacter.relationships && (currentCharacter.relationships.family?.length > 0 || currentCharacter.relationships.friends?.length > 0) ? `
                    <div class="info-section">
                        <h4><i class="fas fa-users"></i> Relaciones</h4>
                        <div class="relationships-container">
                            ${currentCharacter.relationships.family?.length > 0 ? `
                                <div class="relationship-category">
                                    <h5>Familia</h5>
                                    ${currentCharacter.relationships.family.map(rel => `
                                        <div class="relationship-item">
                                            <div class="relationship-name">${rel.name}</div>
                                            <div class="relationship-type">${rel.relation}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            ${currentCharacter.relationships.friends?.length > 0 ? `
                                <div class="relationship-category">
                                    <h5>Conocidos/Amigos</h5>
                                    ${currentCharacter.relationships.friends.map(rel => `
                                        <div class="relationship-item">
                                            <div class="relationship-name">${rel.name}</div>
                                            <div class="relationship-type">${rel.description}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                ${currentCharacter.vehicles?.length > 0 ? `
                    <div class="info-section">
                        <h4><i class="fas fa-car"></i> Vehículos</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            ${currentCharacter.vehicles.map(vehicle => `
                                <span style="background: #444; padding: 0.5rem 1rem; border-radius: 20px; color: #fff;">
                                    ${vehicle}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${currentCharacter.history ? `
                    <div class="info-section">
                        <h4><i class="fas fa-book"></i> Historia del Personaje</h4>
                        <div class="character-history-display editor-content" style="background: #2d2d2d; padding: 1rem; border-radius: 8px; border: 1px solid #444; min-height: auto; max-height: none;">
                            ${currentCharacter.history}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function editCharacterHistory(characterId) {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const modal = document.getElementById('characterModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('characterForm');
    const historySection = document.getElementById('historySection');

    editingCharacterId = characterId;
    editingHistoryOnly = true;
    
    modalTitle.textContent = 'Editar Historia del Personaje';

    // Clear all form fields first
    form.reset();
    clearDynamicFields();

    // Only show history section and populate it
    historySection.style.display = 'block';
    setHistoryContent(character.history || '');

    // Hide all other sections
    const allSections = form.querySelectorAll('.form-section');
    allSections.forEach(section => {
        if (section.id !== 'historySection') {
            section.style.display = 'none';
            section.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
                field.removeAttribute('required');
                field.dataset.wasRequired = 'true';
            });
        }
    });

    const submitBtn = form.querySelector('button[type="submit"].save-btn');
    submitBtn.textContent = 'Guardar Historia';

    modal.classList.add('active');
}

function saveCharacterHistory(characterId) {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    character.history = getHistoryContent();
    character.updatedAt = new Date().toISOString();

    // Save data
    saveData();
    
    // Update current character if it's the one being displayed
    if (currentCharacter?.id === characterId) {
        currentCharacter = character;
        renderCharacterDetails();
    }

    // Close modal and reset button
    closeModal('characterModal');
    
    showToast('Historia actualizada correctamente', 'success');
}

function deleteCharacter(characterId) {
    if (confirm('¿Estás seguro de que quieres eliminar este personaje? Esta acción no se puede deshacer.')) {
        characters = characters.filter(c => c.id !== characterId);
        if (currentCharacter?.id === characterId) {
            currentCharacter = null;
            renderCharacterDetails();
        }
        saveData();
        renderCharacterList();
        showToast('Personaje eliminado correctamente', 'success');
    }
}

// Map Interaction Functions
function initializeMapInteractions() {
    const map = document.getElementById('map');
    const mapWrapper = document.getElementById('mapWrapper');

    // Mouse wheel zoom
    map.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        zoomMap(delta);
    });

    // Mouse drag
    map.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('map-pin')) return;
        
        mapState.isDragging = true;
        mapState.dragStartX = e.clientX;
        mapState.dragStartY = e.clientY;
        mapState.dragStartTranslateX = mapState.translateX;
        mapState.dragStartTranslateY = mapState.translateY;
        
        map.classList.add('dragging');
        mapWrapper.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!mapState.isDragging) return;
        
        const deltaX = e.clientX - mapState.dragStartX;
        const deltaY = e.clientY - mapState.dragStartY;
        
        mapState.translateX = mapState.dragStartTranslateX + deltaX;
        mapState.translateY = mapState.dragStartTranslateY + deltaY;
        
        updateMapTransform();
    });

    document.addEventListener('mouseup', () => {
        if (mapState.isDragging) {
            mapState.isDragging = false;
            map.classList.remove('dragging');
            mapWrapper.style.transition = 'transform 0.1s ease-out';
        }
    });

    // Touch events for mobile
    let touchStartDistance = 0;
    let touchStartScale = 1;

    map.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            touchStartDistance = Math.sqrt(dx * dx + dy * dy);
            touchStartScale = mapState.scale;
        } else if (e.touches.length === 1) {
            if (e.target.classList.contains('map-pin')) return;
            
            mapState.isDragging = true;
            mapState.dragStartX = e.touches[0].clientX;
            mapState.dragStartY = e.touches[0].clientY;
            mapState.dragStartTranslateX = mapState.translateX;
            mapState.dragStartTranslateY = mapState.translateY;
            
            mapWrapper.style.transition = 'none';
        }
    });

    map.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const scale = touchStartScale * (distance / touchStartDistance);
            mapState.scale = Math.max(2.5, Math.min(4, scale));
            updateMapTransform();
        } else if (e.touches.length === 1 && mapState.isDragging) {
            const deltaX = e.touches[0].clientX - mapState.dragStartX;
            const deltaY = e.touches[0].clientY - mapState.dragStartY;
            
            mapState.translateX = mapState.dragStartTranslateX + deltaX;
            mapState.translateY = mapState.dragStartTranslateY + deltaY;
            
            updateMapTransform();
        }
    });

    map.addEventListener('touchend', () => {
        mapState.isDragging = false;
        mapWrapper.style.transition = 'transform 0.1s ease-out';
    });
}

function zoomMap(delta) {
    const newScale = mapState.scale + delta;
    mapState.scale = Math.max(2.5, Math.min(4, newScale));
    updateMapTransform();
}

function resetMapView() {
    mapState.scale = 2.5;
    mapState.translateX = 0;
    mapState.translateY = -700;
    updateMapTransform();
}

function updateMapTransform() {
    const mapWrapper = document.getElementById('mapWrapper');
    const mapImage = document.getElementById('mapImage');
    const map = document.getElementById('map');
    
    // Calculate boundaries
    const mapRect = map.getBoundingClientRect();
    const mapWidth = mapRect.width;
    const mapHeight = mapRect.height;
    
    // Get the actual image dimensions
    const imageNaturalWidth = mapImage.naturalWidth;
    const imageNaturalHeight = mapImage.naturalHeight;
    
    // Calculate the aspect ratios
    const imageAspectRatio = imageNaturalWidth / imageNaturalHeight;
    const mapAspectRatio = mapWidth / mapHeight;
    
    // Calculate the actual visible dimensions with object-fit: contain
    let visibleImageWidth, visibleImageHeight;
    
    if (imageAspectRatio > mapAspectRatio) {
        // Image is wider than container - width fills container
        visibleImageWidth = mapWidth;
        visibleImageHeight = mapWidth / imageAspectRatio;
    } else {
        // Image is taller than container - height fills container
        visibleImageHeight = mapHeight;
        visibleImageWidth = mapHeight * imageAspectRatio;
    }
    
    // Calculate the scaled dimensions
    const scaledWidth = visibleImageWidth * mapState.scale;
    const scaledHeight = visibleImageHeight * mapState.scale;
    
    // Calculate maximum allowed translation
    const maxTranslateX = Math.max(0, (scaledWidth - mapWidth) / 2);
    const maxTranslateY = Math.max(0, (scaledHeight - mapHeight) / 2);
    
    // Apply boundaries - allow both positive and negative movement
    mapState.translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, mapState.translateX));
    mapState.translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, mapState.translateY));
    
    mapWrapper.style.transform = `translate(${mapState.translateX}px, ${mapState.translateY}px) scale(${mapState.scale})`;
}

// Places Management
function handleMapClick(event) {
    if (mapState.isDragging) return;
    
    const mapImage = document.getElementById('mapImage');
    const mapWrapper = document.getElementById('mapWrapper');
    const rect = mapImage.getBoundingClientRect();
    
    // Calculate click position relative to the transformed map
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    mapClickPosition = { x, y };
    
    openPlaceModal();
}

function openPlaceModal(placeId = null) {
    const modal = document.getElementById('placeModal');
    const modalTitle = document.getElementById('placeModalTitle');
    const form = document.getElementById('placeForm');

    editingPlaceId = placeId;

    if (placeId) {
        const place = places.find(p => p.id === placeId);
        if (place) {
            modalTitle.textContent = 'Editar Ubicación';
            populatePlaceForm(place);
        }
    } else {
        modalTitle.textContent = 'Nueva Ubicación';
        form.reset();
        clearPlaceForm();
        
        if (mapClickPosition) {
            document.getElementById('placeX').value = mapClickPosition.x;
            document.getElementById('placeY').value = mapClickPosition.y;
        }
    }

    renderCharacterCheckboxes();
    modal.classList.add('active');
}

function populatePlaceForm(place) {
    document.getElementById('placeName').value = place.name || '';
    document.getElementById('placeType').value = place.type || 'otro';
    document.getElementById('placeDescription').value = place.description || '';
    document.getElementById('placeX').value = place.x || '';
    document.getElementById('placeY').value = place.y || '';
    
    if (place.photo) {
        const photoPreview = document.getElementById('placePhotoPreview');
        photoPreview.innerHTML = `<img src="${place.photo}" alt="Place Photo">`;
    }
}

function clearPlaceForm() {
    document.getElementById('placeName').value = '';
    document.getElementById('placeType').value = 'otro';
    document.getElementById('placeDescription').value = '';
    document.getElementById('placeX').value = '';
    document.getElementById('placeY').value = '';
    
    const photoPreview = document.getElementById('placePhotoPreview');
    photoPreview.innerHTML = '<i class="fas fa-camera"></i><span>Subir Foto del Lugar</span>';
}

function renderCharacterCheckboxes() {
    const container = document.getElementById('placeCharacters');
    
    if (characters.length === 0) {
        container.innerHTML = '<p style="color: #888; text-align: center;">No hay personajes creados</p>';
        return;
    }

    container.innerHTML = characters.map(character => `
        <div class="character-checkbox">
            <input type="checkbox" id="char_${character.id}" value="${character.id}">
            <label for="char_${character.id}">${character.fullName}</label>
        </div>
    `).join('');
}

function handlePlaceSubmit(e) {
    e.preventDefault();

    const selectedCharacters = Array.from(document.querySelectorAll('#placeCharacters input:checked'))
        .map(checkbox => checkbox.value);

    const placeData = {
        id: editingPlaceId || generateId(),
        name: document.getElementById('placeName').value,
        type: document.getElementById('placeType').value,
        description: document.getElementById('placeDescription').value,
        x: parseFloat(document.getElementById('placeX').value),
        y: parseFloat(document.getElementById('placeY').value),
        photo: document.getElementById('placePhotoPreview').querySelector('img')?.src || null,
        characters: selectedCharacters,
        createdAt: editingPlaceId ? 
            places.find(p => p.id === editingPlaceId).createdAt : 
            new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (editingPlaceId) {
        const index = places.findIndex(p => p.id === editingPlaceId);
        places[index] = placeData;
        showToast('Ubicación actualizada correctamente', 'success');
    } else {
        places.push(placeData);
        showToast('Ubicación creada correctamente', 'success');
    }

    saveData();
    renderPlacesList();
    renderMapPins();
    closeModal('placeModal');
    mapClickPosition = null;
}

function handlePlacePhotoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const photoPreview = document.getElementById('placePhotoPreview');
            photoPreview.innerHTML = `<img src="${e.target.result}" alt="Place Photo">`;
        };
        reader.readAsDataURL(file);
    }
}

function renderMapPins() {
    const container = document.getElementById('mapPins');
    container.innerHTML = '';

    places.forEach(place => {
        const pin = document.createElement('div');
        pin.className = `map-pin ${place.type}`;
        pin.style.left = `${place.x}%`;
        pin.style.top = `${place.y}%`;
        pin.title = place.name;
        
        pin.addEventListener('click', (e) => {
            e.stopPropagation();
            showPlaceTooltip(place, e);
        });

        container.appendChild(pin);
    });
}

function showPlaceTooltip(place, event) {
    // Remove existing tooltip
    const existingTooltip = document.querySelector('.pin-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }

    const tooltip = document.createElement('div');
    tooltip.className = 'pin-tooltip show';
    tooltip.innerHTML = `
        <strong>${place.name}</strong><br>
        <small>${place.type}</small>
    `;

    document.body.appendChild(tooltip);

    const rect = event.target.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 10}px`;
    tooltip.style.transform = 'translate(-50%, -100%)';

    setTimeout(() => {
        tooltip.classList.remove('show');
        setTimeout(() => tooltip.remove(), 300);
    }, 2000);
}

function renderPlacesList() {
    const container = document.getElementById('placesList');
    
    if (places.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No hay lugares registrados</p></div>';
        return;
    }

    container.innerHTML = places.map(place => {
        const placeCharacters = place.characters?.map(charId => {
            const character = characters.find(c => c.id === charId);
            return character ? character.fullName : null;
        }).filter(Boolean) || [];

        return `
            <div class="place-item">
                <div class="place-name">
                    <i class="fas fa-map-marker-alt"></i>
                    ${place.name}
                </div>
                <div class="place-type ${place.type}">${getPlaceTypeLabel(place.type)}</div>
                <div class="place-description">${place.description || 'Sin descripción'}</div>
                ${placeCharacters.length > 0 ? `
                    <div class="place-characters">
                        ${placeCharacters.map(charName => `
                            <span class="place-character-tag">${charName}</span>
                        `).join('')}
                    </div>
                ` : ''}
                <div class="place-actions">
                    <button class="place-action-btn" onclick="openPlaceModal('${place.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="place-action-btn delete" onclick="deletePlace('${place.id}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getPlaceTypeLabel(type) {
    const labels = {
        casa: 'Casa',
        negocio: 'Negocio',
        punto_encuentro: 'Punto de Encuentro',
        lugar_trabajo: 'Lugar de Trabajo',
        otro: 'Otro'
    };
    return labels[type] || 'Otro';
}

function deletePlace(placeId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta ubicación? Esta acción no se puede deshacer.')) {
        places = places.filter(p => p.id !== placeId);
        saveData();
        renderPlacesList();
        renderMapPins();
        showToast('Ubicación eliminada correctamente', 'success');
    }
}

// Trailers Management
function renderTrailersList() {
    const container = document.getElementById('trailersList');
    
    if (trailers.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No hay tráileres disponibles</p></div>';
        return;
    }

    container.innerHTML = trailers.map(trailer => `
        <div class="content-item">
            <div class="content-title">${trailer.title}</div>
            <div class="content-description">${trailer.description || 'Sin descripción'}</div>
            <div class="content-actions">
                <button class="content-action-btn">
                    <i class="fas fa-play"></i> Reproducir
                </button>
                <button class="content-action-btn">
                    <i class="fas fa-download"></i> Descargar
                </button>
            </div>
        </div>
    `).join('');
}

// Downloads Management
function renderDownloadsList() {
    const container = document.getElementById('downloadsList');
    
    if (downloads.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No hay descargas disponibles</p></div>';
        return;
    }

    container.innerHTML = downloads.map(download => `
        <div class="content-item">
            <div class="content-title">${download.title}</div>
            <div class="content-description">${download.description || 'Sin descripción'}</div>
            <div class="content-actions">
                <button class="content-action-btn">
                    <i class="fas fa-download"></i> Descargar
                </button>
            </div>
        </div>
    `).join('');
}

function openTrailerModal() {
    showToast('Función de tráileres en desarrollo', 'warning');
}

// Admin Functions
function exportData() {
    const data = {
        characters,
        places,
        trailers,
        downloads,
        exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `gta_roleplay_data_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    showToast('Datos exportados correctamente', 'success');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.characters) {
                characters = data.characters.map(char => ({
                    ...char,
                    photo: char.photo || PLACEHOLDER_PHOTO
                }));
            }
            if (data.places) places = data.places;
            if (data.trailers) trailers = data.trailers;
            if (data.downloads) downloads = data.downloads;

            saveData();
            renderCharacterList();
            renderPlacesList();
            renderTrailersList();
            renderDownloadsList();

            showToast('Datos importados correctamente', 'success');
        } catch (error) {
            showToast('Error al importar los datos', 'error');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.')) {
        characters = [];
        places = [];
        trailers = [];
        downloads = [];
        currentCharacter = null;
        
        localStorage.clear();
        
        renderCharacterList();
        renderPlacesList();
        renderTrailersList();
        renderDownloadsList();
        renderCharacterDetails();

        showToast('Todos los datos han sido eliminados', 'success');
    }
}

// Birthday and Zodiac Functions
function handleBirthdayChange(e) {
    const birthday = e.target.value;
    if (!birthday) return;
    
    const age = calculateAge(birthday);
    const zodiac = calculateZodiac(birthday);
    
    document.getElementById('age').value = age;
    document.getElementById('zodiac').value = zodiac;
}

function calculateAge(birthday) {
    const birthDate = new Date(birthday);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

function calculateZodiac(birthday) {
    const date = new Date(birthday);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Tauro';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Géminis';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cáncer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Escorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagitario';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricornio';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Acuario';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Piscis';
    
    return 'Aries';
}

// History Editor Functions
function formatText(command) {
    document.execCommand(command, false, null);
    document.getElementById('characterHistory').focus();
}

function insertHeading(tag) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const selectedText = range.toString() || 'Título';
    
    const heading = document.createElement(tag);
    heading.textContent = selectedText;
    
    range.deleteContents();
    range.insertNode(heading);
    
    range.setStartAfter(heading);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    document.getElementById('characterHistory').focus();
}

function insertList(type) {
    const listHTML = type === 'ul' ? 
        '<ul><li>Elemento de lista</li></ul>' : 
        '<ol><li>Elemento numerado</li></ol>';
    
    document.execCommand('insertHTML', false, listHTML);
    document.getElementById('characterHistory').focus();
}

function getHistoryContent() {
    const editor = document.getElementById('characterHistory');
    const rawTextarea = document.getElementById('characterHistoryRaw');
    const htmlContent = editor.innerHTML;
    rawTextarea.value = htmlContent;
    return htmlContent;
}

function setHistoryContent(htmlContent) {
    const editor = document.getElementById('characterHistory');
    const rawTextarea = document.getElementById('characterHistoryRaw');
    editor.innerHTML = htmlContent || '';
    rawTextarea.value = htmlContent || '';
}

// Image Crop Functions
let cropData = {
    scale: 1,
    cropX: 0,
    cropY: 0,
    cropWidth: 200,
    cropHeight: 200,
    isDragging: false,
    isResizing: false,
    dragStartX: 0,
    dragStartY: 0,
    startWidth: 0,
    startHeight: 0,
    resizeHandle: null
};

function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const photoPreview = document.getElementById('photoPreview');
            photoPreview.innerHTML = `<img src="${e.target.result}" alt="Character Photo">`;
            showToast('Foto subida correctamente', 'success');
        };
        reader.readAsDataURL(file);
    }
}

function openImageCropModal(imageSrc) {
    const modal = document.getElementById('imageCropModal');
    const cropImage = document.getElementById('cropImage');
    const zoomSlider = document.getElementById('zoomSlider');
    const zoomValue = document.getElementById('zoomValue');
    
    const characterModal = document.getElementById('characterModal');
    characterModal.classList.remove('active');
    
    cropImage.src = imageSrc;
    cropImage.onload = () => {
        cropData.scale = 1;
        cropData.cropX = 100;
        cropData.cropY = 100;
        cropData.cropWidth = 200;
        cropData.cropHeight = 200;
        
        zoomSlider.value = 100;
        zoomValue.textContent = '100%';
        
        initializeCropBox();
        
        modal.style.display = 'block';
        modal.classList.add('active');
    };
}

function closeImageCropModal() {
    const modal = document.getElementById('imageCropModal');
    modal.style.display = 'none';
    modal.classList.remove('active');
    
    if (editingCharacterId) {
        const characterModal = document.getElementById('characterModal');
        characterModal.classList.add('active');
    }
}

function initializeCropBox() {
    const cropBox = document.getElementById('cropBox');
    const zoomSlider = document.getElementById('zoomSlider');
    const zoomValue = document.getElementById('zoomValue');
    
    cropBox.onmousedown = null;
    cropBox.onmousemove = null;
    cropBox.onmouseup = null;
    zoomSlider.oninput = null;
    
    cropBox.addEventListener('mousedown', startDrag);
    
    const handles = cropBox.querySelectorAll('.handle');
    handles.forEach(handle => {
        handle.addEventListener('mousedown', startResize);
    });
    
    zoomSlider.addEventListener('input', function() {
        cropData.scale = this.value / 100;
        zoomValue.textContent = this.value + '%';
        updateImageTransform();
    });
}

function startDrag(e) {
    if (e.target.classList.contains('handle')) return;
    
    e.preventDefault();
    cropData.isDragging = true;
    cropData.dragStartX = e.clientX - cropData.cropX;
    cropData.dragStartY = e.clientY - cropData.cropY;
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
}

function drag(e) {
    if (!cropData.isDragging) return;
    
    cropData.cropX = e.clientX - cropData.dragStartX;
    cropData.cropY = e.clientY - cropData.dragStartY;
    
    updateCropBox();
}

function stopDrag() {
    cropData.isDragging = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
}

function startResize(e) {
    e.preventDefault();
    e.stopPropagation();
    
    cropData.isResizing = true;
    cropData.resizeHandle = e.target.className.split(' ')[1];
    cropData.dragStartX = e.clientX;
    cropData.dragStartY = e.clientY;
    cropData.startWidth = cropData.cropWidth;
    cropData.startHeight = cropData.cropHeight;
    
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
}

function resize(e) {
    if (!cropData.isResizing) return;
    
    const deltaX = e.clientX - cropData.dragStartX;
    const deltaY = e.clientY - cropData.dragStartY;
    
    switch(cropData.resizeHandle) {
        case 'se':
            cropData.cropWidth = Math.max(50, cropData.startWidth + deltaX);
            cropData.cropHeight = Math.max(50, cropData.startHeight + deltaY);
            break;
        case 'sw':
            cropData.cropWidth = Math.max(50, cropData.startWidth - deltaX);
            cropData.cropHeight = Math.max(50, cropData.startHeight + deltaY);
            cropData.cropX += deltaX;
            break;
        case 'ne':
            cropData.cropWidth = Math.max(50, cropData.startWidth + deltaX);
            cropData.cropHeight = Math.max(50, cropData.startHeight - deltaY);
            cropData.cropY += deltaY;
            break;
        case 'nw':
            cropData.cropWidth = Math.max(50, cropData.startWidth - deltaX);
            cropData.cropHeight = Math.max(50, cropData.startHeight - deltaY);
            cropData.cropX += deltaX;
            cropData.cropY += deltaY;
            break;
    }
    
    updateCropBox();
}

function stopResize() {
    cropData.isResizing = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
}

function updateCropBox() {
    const cropBox = document.getElementById('cropBox');
    cropBox.style.width = cropData.cropWidth + 'px';
    cropBox.style.height = cropData.cropHeight + 'px';
    cropBox.style.left = cropData.cropX + 'px';
    cropBox.style.top = cropData.cropY + 'px';
}

function updateImageTransform() {
    const cropImage = document.getElementById('cropImage');
    cropImage.style.transform = `scale(${cropData.scale})`;
}

function cropImage() {
    try {
        const cropImageElement = document.getElementById('cropImage');
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = cropData.cropWidth;
        canvas.height = cropData.cropHeight;
        
        const adjustedX = cropData.cropX + (cropData.cropWidth * 0.1);
        const adjustedY = cropData.cropY;
        
        ctx.drawImage(
            cropImageElement,
            adjustedX, adjustedY, cropData.cropWidth, cropData.cropHeight,
            0, 0, cropData.cropWidth, cropData.cropHeight
        );
        
        const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        const photoPreview = document.getElementById('photoPreview');
        photoPreview.innerHTML = `<img src="${croppedImageUrl}" alt="Character Photo">`;
        
        closeImageCropModal();
        
        showToast('Foto recortada correctamente', 'success');
        
    } catch (error) {
        console.error('Error en cropImage:', error);
        showToast('Error al recortar la imagen', 'error');
    }
}

// Utility Functions
function generateId() {
    return 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}
