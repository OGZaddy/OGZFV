import Shepherd from 'shepherd.js';

const tour = new Shepherd.Tour({
  defaultStepOptions: {
    cancelIcon: { enabled: true },
    classes: 'tutorial-step',
    scrollTo: { behavior: 'smooth', block: 'center' }
  }
});

tour.addStep({
  id: 'welcome',
  text: 'Hey there! Let’s get you trading—click Next to start.',
  attachTo: { element: '.start-btn', on: 'bottom' },
  buttons: [{ text: 'Next', action: tour.next }]
});

tour.addStep({
  id: 'account',
  text: 'Set up your account here. It’s your trading HQ!',
  attachTo: { element: '.account-box', on: 'right' },
  buttons: [
    { text: 'Back', action: tour.back },
    { text: 'Next', action: tour.next }
  ]
});

// Add more steps for exchange, strategy, etc.

if (!localStorage.getItem('tutorialDone')) {
  tour.start();
}

localStorage.setItem('tutorialDone', 'true');