function isInViewport(element, callback, rootMargin = '0px') {
  
    // Define the callback function for IntersectionObserver
    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            // Check if the element is intersecting
            if (entry.isIntersecting) {
                callback(); // Execute the callback function
                observer.disconnect(); // Disconnect the observer once the callback is executed
            }
        });
    };

    // Create an IntersectionObserver instance
    const observer = new IntersectionObserver(observerCallback, {
        rootMargin: rootMargin
    });

    // Start observing the specified element
    observer.observe(element);
}

// Export the isInViewport function
export { isInViewport };