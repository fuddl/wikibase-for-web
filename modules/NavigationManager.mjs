class NavigationManager {
  constructor() {
    this.historyStates = 0; // Track the number of states in the app's history
    this.listeners = []; 
    window.addEventListener('popstate', (event) => {
      // Adjust the historyStates based on forward/backward navigation
      this.triggerListeners(event.state);
    });
  }

  navigate(state) {
    window.history.pushState(state, '');
    this.triggerListeners(state);
    this.historyStates++; // Increment the counter on navigation
  }

  replaceState(state) {
    window.history.replaceState(state, '');
    // No need to modify historyStates since we're replacing the current state
    this.triggerListeners(state);
  }

  onStateChange(callback) {
    this.listeners.push(callback);
  }

  triggerListeners(state) {
    this.listeners.forEach(listener => listener(state));
  }


  back() {
    if (this.canGoBack()) {
      window.history.back();
      // Assuming successful navigation, decrement the counter
      this.historyStates--;
    } else {
      console.log("No more history to go back to.");
    }
  }

  forward() {
    window.history.forward();
    // Since forward navigation depends on the browser's history,
    // it's more challenging to accurately track without additional state management.
  }

  resetHistory(state) {
    window.history.replaceState(state, '');
    this.triggerListeners(state);
    this.historyStates = 1; // Reset the counter as this is now the only state
  }

  // Method to check if there's a state to go back to
  canGoBack() {
    // Check if there are more than one states recorded
    return this.historyStates > 1;
  }
}

export default NavigationManager
