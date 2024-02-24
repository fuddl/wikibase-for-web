export async function pollTabTitle(tabId) {
    let attempt = 0;
    const maxAttempts = 100;

    const checkTitle = async () => {
        try {
            // Use a promise to wait for the tab's title
            const tab = await new Promise((resolve, reject) => {
                chrome.tabs.get(tabId, (tab) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(tab);
                    }
                });
            });

            // Check if the title is available and return it
            if (tab.title && tab.title !== "") {
                return tab.title;
            } else if (attempt < maxAttempts) {
                // Wait 500 ms and then retry
                await new Promise(resolve => setTimeout(resolve, 10));
                attempt++;
                return await checkTitle();
            } else {
                // Max attempts reached, return undefined
                return undefined;
            }
        } catch (error) {
            console.error("Error fetching tab title:", error);
            return undefined;
        }
    };

    return await checkTitle();
}