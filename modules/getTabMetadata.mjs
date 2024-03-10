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

            const getMeta = () => {
                const keywordsMeta = document.querySelectorAll(
                    'meta:not([name="keywords"], [name="description"])',
                );
                const output = [];
                keywordsMeta.forEach(tag => {
                    if (
                        tag.getAttribute('name') ||
                        tag.getAttribute('property')
                    ) {
                        output.push({
                            name:
                                tag.getAttribute('name') ??
                                tag.getAttribute('property'),
                            content: tag.getAttribute('content'),
                        });
                    }
                });
                return output;
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
                meta: getMeta(),
            };
        },
    });
    return execution?.[0]?.result;
}
