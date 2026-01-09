// ==========================================
// PROJECT AUTHORIZATION PAGE
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initAuthorizationPage();
});

function initAuthorizationPage() {
    initCheckboxLogic();
    initSaveButton();
    updateProgress();
}

// ==========================================
// CHECKBOX LOGIC
// ==========================================
function initCheckboxLogic() {
    const checkboxes = document.querySelectorAll('.checklist-checkbox');
    const naCheckboxes = document.querySelectorAll('.checklist-na');

    // Handle completion checkboxes
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const item = this.getAttribute('data-item');
            const checklistItem = this.closest('.checklist-item');
            const naCheckbox = document.querySelector(`.checklist-na[data-item="${item}"]`);

            if (this.checked) {
                // Uncheck N/A if Complete is checked
                naCheckbox.checked = false;
                checklistItem.classList.add('completed');
                checklistItem.classList.remove('na');
            } else {
                checklistItem.classList.remove('completed');
            }

            updateProgress();
        });
    });

    // Handle N/A checkboxes
    naCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const item = this.getAttribute('data-item');
            const checklistItem = this.closest('.checklist-item');
            const completionCheckbox = document.querySelector(`.checklist-checkbox[data-item="${item}"]`);

            if (this.checked) {
                // Uncheck Complete if N/A is checked
                completionCheckbox.checked = false;
                checklistItem.classList.add('na');
                checklistItem.classList.remove('completed');
            } else {
                checklistItem.classList.remove('na');
            }

            updateProgress();
        });
    });
}

// ==========================================
// PROGRESS CALCULATION
// ==========================================
function updateProgress() {
    const totalItems = document.querySelectorAll('.checklist-checkbox').length;
    const completedItems = document.querySelectorAll('.checklist-checkbox:checked').length;
    const naItems = document.querySelectorAll('.checklist-na:checked').length;
    
    // Items that count as complete: checked items + N/A items
    const effectiveComplete = completedItems + naItems;
    const percentage = Math.round((effectiveComplete / totalItems) * 100);

    // Update progress bar
    const progressBar = document.getElementById('authProgressBar');
    const progressPercentage = document.getElementById('authProgressPercentage');
    const progressStats = document.getElementById('authProgressStats');

    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }

    if (progressPercentage) {
        progressPercentage.textContent = percentage + '%';
    }

    if (progressStats) {
        progressStats.textContent = `${effectiveComplete} of ${totalItems} authorization items complete`;
    }
}

// ==========================================
// SAVE FUNCTIONALITY
// ==========================================
function initSaveButton() {
    const saveBtn = document.getElementById('saveAuthorizationBtn');
    if (!saveBtn) return;

    saveBtn.addEventListener('click', function() {
        saveAuthorizationData();
    });
}

function saveAuthorizationData() {
    const authData = {
        items: []
    };

    // Collect all checklist data
    const checklistItems = document.querySelectorAll('.checklist-item');
    checklistItems.forEach(item => {
        const checkbox = item.querySelector('.checklist-checkbox');
        const naCheckbox = item.querySelector('.checklist-na');
        const notes = item.querySelector('.checklist-notes');
        
        authData.items.push({
            id: checkbox.getAttribute('data-item'),
            completed: checkbox.checked,
            na: naCheckbox.checked,
            notes: notes.value
        });
    });

    console.log('Saving authorization data:', authData);

    // TODO: Send to backend API
    showNotification('Authorization checklist saved successfully', 'success');
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}