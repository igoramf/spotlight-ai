// Timer functionality
function updateTimer() {
    const now = new Date();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timerElement = document.getElementById('timer');
    timerElement.textContent = `${minutes}:${seconds}`;
}

// Show/Hide toggle functionality
function initToggleButton() {
    const toggleBtn = document.getElementById('toggleBtn');
    const eyeIcon = document.getElementById('eyeIcon');
    const eyeOffIcon = document.getElementById('eyeOffIcon');
    let showHide = false;

    toggleBtn.addEventListener('click', () => {
        showHide = !showHide;
        
        if (showHide) {
            eyeIcon.classList.add('hidden');
            eyeOffIcon.classList.remove('hidden');
        } else {
            eyeIcon.classList.remove('hidden');
            eyeOffIcon.classList.add('hidden');
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Start timer
    updateTimer();
    setInterval(updateTimer, 1000);
    
    // Initialize toggle button
    initToggleButton();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ask AI shortcut (Cmd/Ctrl)
        if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key === '') {
            e.preventDefault();
            console.log('Ask AI triggered');
        }
        
        // Show/Hide shortcut (Cmd/Ctrl + \)
        if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
            e.preventDefault();
            document.getElementById('toggleBtn').click();
        }
    });
});