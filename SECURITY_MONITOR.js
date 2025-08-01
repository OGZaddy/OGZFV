/**
 * SECURITY MONITOR - DETECT MESSAGE INTERCEPTION
 * Run this in your browser console to monitor input manipulation
 */

console.log('🔒 SECURITY MONITOR ACTIVATED');
console.log('💀 Monitoring for message interception...\n');

// Store original methods to detect hijacking
const originalFetch = window.fetch;
const originalXHR = window.XMLHttpRequest;
const originalWebSocket = window.WebSocket;
const originalAddEventListener = EventTarget.prototype.addEventListener;
const originalSubmit = HTMLFormElement.prototype.submit;

// Monitor all event listeners being added
EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'submit' || type === 'keypress' || type === 'keydown' || type === 'input') {
        console.warn(`⚠️ EVENT LISTENER DETECTED:`, {
            element: this.tagName || this.constructor.name,
            type: type,
            listener: listener.toString().substring(0, 200)
        });
    }
    return originalAddEventListener.call(this, type, listener, options);
};

// Monitor form submissions
HTMLFormElement.prototype.submit = function() {
    console.error('🚨 FORM SUBMIT INTERCEPTED!', {
        form: this,
        action: this.action,
        method: this.method
    });
    debugger; // This will pause execution so you can inspect
    return originalSubmit.call(this);
};

// Monitor all input value changes
let inputMonitor = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.target.tagName === 'INPUT' || mutation.target.tagName === 'TEXTAREA') {
            console.error('🔴 INPUT VALUE CHANGED BY CODE!', {
                element: mutation.target,
                oldValue: mutation.oldValue,
                newValue: mutation.target.value,
                stack: new Error().stack
            });
        }
    });
});

// Start monitoring all inputs
document.querySelectorAll('input, textarea').forEach(input => {
    inputMonitor.observe(input, {
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ['value']
    });
    
    // Also monitor programmatic value changes
    const descriptor = Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value');
    if (descriptor && descriptor.set) {
        const originalSetter = descriptor.set;
        Object.defineProperty(input, 'value', {
            set: function(val) {
                console.error('🚨 INPUT VALUE SET PROGRAMMATICALLY!', {
                    element: this,
                    oldValue: this.value,
                    newValue: val,
                    stack: new Error().stack
                });
                debugger; // Pause here to inspect
                return originalSetter.call(this, val);
            },
            get: descriptor.get
        });
    }
});

// Monitor WebSocket messages
window.WebSocket = new Proxy(originalWebSocket, {
    construct(target, args) {
        const ws = new target(...args);
        console.warn('🔌 WebSocket created:', args[0]);
        
        const originalSend = ws.send;
        ws.send = function(data) {
            console.log('📤 WebSocket SEND intercepted:', data);
            // Check if the data being sent differs from what user typed
            if (window.lastUserInput && data.includes(window.lastUserInput)) {
                console.log('✅ Message matches user input');
            } else if (window.lastUserInput) {
                console.error('🚨🚨🚨 MESSAGE REPLACED! 🚨🚨🚨');
                console.error('User typed:', window.lastUserInput);
                console.error('Being sent:', data);
                debugger; // STOP HERE TO INVESTIGATE
            }
            return originalSend.call(this, data);
        };
        
        return ws;
    }
});

// Monitor fetch requests
window.fetch = function(...args) {
    console.log('📡 Fetch intercepted:', args);
    return originalFetch.apply(this, args);
};

// Track what user actually types
document.addEventListener('input', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        window.lastUserInput = e.target.value;
        console.log('✍️ User typed:', e.target.value);
    }
}, true);

// Monitor for hidden iframes
const iframeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.tagName === 'IFRAME') {
                console.error('🚨 HIDDEN IFRAME DETECTED!', node);
                debugger;
            }
        });
    });
});

iframeObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// Check for suspicious global variables
const suspiciousGlobals = Object.keys(window).filter(key => 
    key.includes('hook') || 
    key.includes('intercept') || 
    key.includes('proxy') ||
    key.includes('monitor') && key !== 'inputMonitor'
);

if (suspiciousGlobals.length > 0) {
    console.error('🚨 SUSPICIOUS GLOBALS FOUND:', suspiciousGlobals);
}

console.log('\n✅ Security monitor is now active.');
console.log('🔍 Try typing a message and watch the console.');
console.log('💡 The debugger will pause if interception is detected.\n');