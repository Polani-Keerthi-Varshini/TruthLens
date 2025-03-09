// Tutorial content for API integrations
const tutorialSteps = {
    factCheck: [
        {
            element: '#content-input',
            title: 'Step 1: Enter Your Claim',
            content: 'Start by entering a claim you want to fact-check. For best results, use clear and specific statements.',
            position: 'bottom'
        },
        {
            element: '#analyze-btn',
            title: 'Step 2: Analyze Content',
            content: 'Click here to send your claim to multiple fact-checking APIs for verification.',
            position: 'top'
        },
        {
            element: '#analysis-results',
            title: 'Step 3: View Results',
            content: 'Your results will appear here, showing credibility scores and matching fact-checks from various sources.',
            position: 'top'
        }
    ],
    apiSetup: [
        {
            element: '.api-key-section',
            title: 'Step 1: API Configuration',
            content: 'First, you\'ll need to set up your fact-checking APIs. Click here to manage your API keys.',
            position: 'bottom'
        },
        {
            element: '.api-status',
            title: 'Step 2: API Status',
            content: 'Monitor your API connection status here. A green indicator means everything is working properly.',
            position: 'right'
        },
        {
            element: '#content-input',
            title: 'Step 3: Try It Out',
            content: 'Now that your APIs are configured, try fact-checking a claim!',
            position: 'bottom'
        }
    ]
};

class TutorialManager {
    constructor() {
        console.log('Initializing TutorialManager');
        this.currentTutorial = null;
        this.currentStep = 0;
        this.initializeOverlay();
    }

    initializeOverlay() {
        console.log('Initializing tutorial overlay and popup');
        // Use existing elements instead of creating new ones
        this.overlay = document.getElementById('tutorial-overlay');
        this.popup = document.getElementById('tutorial-popup');

        if (!this.overlay || !this.popup) {
            console.error('Tutorial elements not found in DOM');
            return;
        }

        console.log('Tutorial elements initialized successfully');
    }

    async showTutorial(tutorialName) {
        console.log(`Showing tutorial: ${tutorialName}`);

        this.currentTutorial = tutorialSteps[tutorialName];
        this.currentStep = 0;

        if (this.currentTutorial) {
            console.log(`Starting tutorial with ${this.currentTutorial.length} steps`);
            await this.showStep();
        } else {
            console.error(`Tutorial '${tutorialName}' not found`);
        }
    }

    async showStep() {
        console.log(`Showing step ${this.currentStep + 1}`);

        if (!this.currentTutorial || this.currentStep >= this.currentTutorial.length) {
            console.log('Tutorial complete');
            this.endTutorial();
            return;
        }

        const step = this.currentTutorial[this.currentStep];
        const targetElement = document.querySelector(step.element);

        if (!targetElement) {
            console.warn(`Tutorial target element not found: ${step.element}`);
            this.currentStep++;
            await this.showStep();
            return;
        }

        // Add highlight to target element
        console.log(`Highlighting element: ${step.element}`);
        targetElement.classList.add('tutorial-highlight');

        // Update popup content before positioning
        this.popup.innerHTML = `
            <h3>${step.title}</h3>
            <p>${step.content}</p>
            <div class="tutorial-controls">
                ${this.currentStep < this.currentTutorial.length - 1 ? 
                    '<button class="tutorial-next">Next</button>' :
                    '<button class="tutorial-next">Finish</button>'}
                <button class="tutorial-skip">Skip Tutorial</button>
            </div>
            <div class="tutorial-progress">
                Step ${this.currentStep + 1} of ${this.currentTutorial.length}
            </div>
        `;

        // Show overlay and popup
        this.overlay.style.display = 'block';
        this.popup.style.display = 'block';

        // Position the popup after it's visible to get correct dimensions
        this.positionPopup(targetElement, step);

        // Add event listeners
        const nextButton = this.popup.querySelector('.tutorial-next');
        const skipButton = this.popup.querySelector('.tutorial-skip');

        nextButton.onclick = () => {
            targetElement.classList.remove('tutorial-highlight');
            this.currentStep++;
            this.showStep();
        };

        skipButton.onclick = () => {
            targetElement.classList.remove('tutorial-highlight');
            this.endTutorial();
        };
    }

    positionPopup(targetElement, step) {
        console.log('Positioning popup');
        const rect = targetElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Get popup dimensions after it's visible
        const popupRect = this.popup.getBoundingClientRect();
        const popupWidth = popupRect.width;
        const popupHeight = popupRect.height;

        // Calculate initial position
        let top, left;

        switch (step.position) {
            case 'top':
                top = rect.top + scrollTop - popupHeight - 10;
                left = rect.left + scrollLeft + (rect.width - popupWidth) / 2;
                break;
            case 'bottom':
                top = rect.bottom + scrollTop + 10;
                left = rect.left + scrollLeft + (rect.width - popupWidth) / 2;
                break;
            case 'left':
                top = rect.top + scrollTop + (rect.height - popupHeight) / 2;
                left = rect.left + scrollLeft - popupWidth - 10;
                break;
            case 'right':
                top = rect.top + scrollTop + (rect.height - popupHeight) / 2;
                left = rect.right + scrollLeft + 10;
                break;
        }

        // Ensure popup stays within viewport bounds
        // Add padding of 10px from viewport edges
        const padding = 10;

        // Adjust horizontal position
        if (left < padding) {
            left = padding;
        } else if (left + popupWidth > viewportWidth - padding) {
            left = viewportWidth - popupWidth - padding;
        }

        // Adjust vertical position
        if (top < padding) {
            // If popup would go above viewport, place it below the element instead
            top = rect.bottom + scrollTop + padding;
        } else if (top + popupHeight > viewportHeight + scrollTop - padding) {
            // If popup would go below viewport, place it above the element instead
            top = rect.top + scrollTop - popupHeight - padding;
        }

        // If popup is still outside viewport vertically, position it at the top of the viewport
        if (top < scrollTop + padding) {
            top = scrollTop + padding;
        }

        console.log(`Setting popup position: top=${top}, left=${left}`);
        this.popup.style.top = `${top}px`;
        this.popup.style.left = `${left}px`;
    }

    endTutorial() {
        console.log('Ending tutorial');
        const highlighted = document.querySelector('.tutorial-highlight');
        if (highlighted) {
            highlighted.classList.remove('tutorial-highlight');
        }

        this.overlay.style.display = 'none';
        this.popup.style.display = 'none';
        this.currentTutorial = null;
        this.currentStep = 0;
    }

    resetTutorials() {
        console.log('Resetting all tutorials');
        Object.keys(tutorialSteps).forEach(tutorial => {
            localStorage.removeItem(`tutorial_${tutorial}`);
        });
    }
}

// Initialize tutorial manager
console.log('Creating global tutorial manager');
const tutorialManager = new TutorialManager();

// Export for use in other files
window.tutorialManager = tutorialManager;