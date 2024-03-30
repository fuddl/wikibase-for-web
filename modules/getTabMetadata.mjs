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

            function makeUrlsAbsolute(obj, baseUrl) {
                // Helper function to convert a relative URL to an absolute URL using an <a> element
                function toAbsoluteUrl(relativeUrl) {
                    const a = document.createElement('link');
                    a.setAttribute('href', relativeUrl);

                    return a.href;
                }

                if (Array.isArray(obj)) {
                    obj.forEach((item, index) => {
                        obj[index] = makeUrlsAbsolute(item, baseUrl);
                    });
                } else if (typeof obj === 'object' && obj !== null) {
                    Object.keys(obj).forEach(key => {
                        const value = obj[key];
                        if (
                            typeof value === 'string' &&
                            (value.startsWith('/') ||
                                value.startsWith('./') ||
                                value.startsWith('../'))
                        ) {
                            // Convert relative URLs to absolute
                            obj[key] = toAbsoluteUrl(value);
                        } else if (key === '@context') {
                            obj['@type'] =
                                `${value.replace(/\/$/, '')}/${obj['@type']}`;
                        } else if (typeof value === 'object') {
                            // Recurse into nested objects and arrays
                            makeUrlsAbsolute(value, baseUrl);
                        }
                        if (
                            key === 'url' &&
                            obj[key] === document.location.toString()
                        ) {
                            obj['@isSubjectOfPage'] = true;
                            delete obj[key];
                        }
                    });
                }
                return obj;
            }

            const getLinkedData = () => {
                const scripts = document.querySelectorAll(
                    'script[type="application/ld+json"]',
                );
                const output = [];
                for (const script of scripts) {
                    try {
                        const parsed = JSON.parse(script.innerText);
                        const absolutised = makeUrlsAbsolute(parsed);
                        output.push(absolutised);
                    } catch (e) {
                        console.warn(
                            `Error parsing JSON on ${document.location}`,
                        );
                        //console.debug(e);
                    }
                }
                return output;
            };

            return {
                title: document.title,
                lang: document.documentElement.lang,
                description: getDescription(),
                keywords: getKeywords(),
                canonicalURL: getCanonicalURL(),
                meta: getMeta(),
                linkData: getLinkedData(),
                location: document.location.toString(),
            };
        },
    });
    return execution?.[0]?.result;
}
