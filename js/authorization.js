// ==========================================
// PROJECT AUTHORIZATION PAGE
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initAuthorizationPage();
});

function initAuthorizationPage() {
    initChecklistItems();
    initChecklistActions();
    updateProgress();
}

// ==========================================
// CHECKLIST ITEMS
// ==========================================
function initChecklistItems() {
    const checkboxes = document.querySelectorAll('.checkbox-input');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const item = this.closest('.checklist-item');
            const metaItem = item.querySelector('.meta-item');
            
            if (this.checked) {
                item.classList.add('completed');
                metaItem.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Completed
                `;
            } else {
                item.classList.remove('completed');
                metaItem.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Not started
                `;
            }
            
            updateProgress();
        });
    });
}

// ==========================================
// UPDATE PROGRESS
// ==========================================
function updateProgress() {
    const checkboxes = document.querySelectorAll('.checkbox-input');
    const total = checkboxes.length;
    const completed = Array.from(checkboxes).filter(cb => cb.checked).length;
    const percentage = Math.round((completed / total) * 100);
    
    // Update percentage display
    const percentageDisplay = document.querySelector('.stat-percentage');
    if (percentageDisplay) {
        percentageDisplay.textContent = `${percentage}%`;
    }
    
    // Update circular progress
    const progressCircle = document.querySelector('.progress-foreground');
    if (progressCircle) {
        const circumference = 314; // 2 * PI * radius (50)
        const offset = circumference - (percentage / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
    }
    
    // Update stats
    const completedStat = document.querySelector('.overview-stat-item .stat-number');
    if (completedStat) {
        completedStat.textContent = completed;
    }
    
    const pendingStat = document.querySelectorAll('.overview-stat-item .stat-number')[1];
    if (pendingStat) {
        pendingStat.textContent = total - completed;
    }
}

// ==========================================
// CHECKLIST ACTIONS
// ==========================================
function initChecklistActions() {
    const saveBtn = document.getElementById('saveChecklistBtn');
    const resetBtn = document.getElementById('resetChecklistBtn');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProgress);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetChecklist);
    }
}

function saveProgress() {
    const checkboxes = document.querySelectorAll('.checkbox-input');
    const checklistData = Array.from(checkboxes).map(cb => ({
        id: cb.id,
        checked: cb.checked
    }));
    
    console.log('Saving checklist progress:', checklistData);
    
    // TODO: Send to backend API
    showNotification('Progress saved successfully', 'success');
}

function resetChecklist() {
    if (!confirm('Are you sure you want to reset all checklist items? This action cannot be undone.')) {
        return;
    }
    
    const checkboxes = document.querySelectorAll('.checkbox-input');
    checkboxes.forEach(cb => {
        cb.checked = false;
        cb.dispatchEvent(new Event('change'));
    });
    
    showNotification('Checklist reset successfully', 'success');
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