export async function getTabMetadata(tabId) {
    const execution = await browser.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
            const getDescription = () => {
                const descriptionMeta = document.querySelector(
                    'meta[name="description"]',
                );
                return descriptionMeta ? descriptionMeta.content : '';
            };

            const getKeywords = () => {
                const keywordsMeta = document.querySelector(
                    'meta[name="keywords"]',
                );
                return keywordsMeta ? keywordsMeta.content : '';
            };

            const getCanonicalURL = () => {
                const canonicalLink = document.querySelector(
                    'link[rel="canonical"]',
                );
                return canonicalLink ? canonicalLink.href : '';
            };

            return {
                title: document.title,
                lang: document.documentElement.lang,
                description: getDescription(),
                keywords: getKeywords(),
                canonicalURL: getCanonicalURL(),
            };
        },
    });
    return execution?.[0]?.result;
}
