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

            function makeUrlsAbsolute(obj, baseUrl, parentContext = '') {
                const currentUrls = [
                    document.location.toString(),
                    getCanonicalURL(),
                ];

                // Helper function to convert a relative URL to an absolute URL using an <a> element
                function toAbsoluteUrl(relativeUrl) {
                    const a = document.createElement('link');
                    a.setAttribute('href', relativeUrl);

                    return a.href;
                }

                if (Array.isArray(obj)) {
                    obj.forEach((item, index) => {
                        obj[index] = makeUrlsAbsolute(
                            item,
                            baseUrl,
                            obj?.['@context'] ?? parentContext,
                        );
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
                        } else if (
                            key === '@context' &&
                            obj?.['@type'] &&
                            URL.canParse(value)
                        ) {
                            obj['@type'] =
                                `${value.replace(/\/$/, '')}/${obj['@type']}`;
                        } else if (
                            key === '@type' &&
                            parentContext &&
                            !URL.canParse(value)
                        ) {
                            obj['@type'] =
                                `${parentContext.replace(/\/$/, '')}/${obj['@type']}`;
                        } else if (typeof value === 'object') {
                            // Recurse into nested objects and arrays
                            makeUrlsAbsolute(
                                value,
                                baseUrl,
                                obj?.['@context'] ?? parentContext,
                            );
                        }
                        if (
                            (key === 'url' && currentUrls.includes(obj[key])) ||
                            (key === 'mainEntityOfPage' &&
                                currentUrls.includes(obj[key]?.['@id']))
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

            const getMediaWikiGlobals = () => {
                const scripts = document.getElementsByTagName('script');

                for (let script of scripts) {
                    if (script.textContent.includes('RLCONF')) {
                        const match = /RLCONF\s*=\s*(\{[^;]*\})/.exec(
                            script.textContent,
                        );

                        if (match) {
                            const correctedJson = match[1]
                                .replace(/!0/g, 'true')
                                .replace(/!1/g, 'false');

                            try {
                                // Extract values using regular expressions
                                const extractValue = key => {
                                    const regex = new RegExp(
                                        `"${key}"\\s*:\\s*(".*?"|\\d+|true|false|null)`,
                                        'i',
                                    );
                                    const valueMatch =
                                        correctedJson.match(regex);
                                    return valueMatch
                                        ? JSON.parse(valueMatch[1])
                                        : null;
                                };

                                const extractedData = {
                                    wgTitle: extractValue('wgTitle'),
                                    wgPageContentLanguage: extractValue(
                                        'wgPageContentLanguage',
                                    ),
                                    wgArticleId: extractValue('wgArticleId'),
                                    wgPageName: extractValue('wgPageName'),
                                    wgCurRevisionId:
                                        extractValue('wgCurRevisionId'),
                                    wgIsRedirect: extractValue('wgIsRedirect'),
                                    wgRevisionId: extractValue('wgRevisionId'),
                                };

                                return extractedData;
                            } catch (e) {
                                console.error(
                                    'Error extracting data from script tag:',
                                    e,
                                );
                            }
                        }
                    }
                }

                return null;
            };

            return {
                title: document.title,
                lang:
                    document.documentElement.lang ||
                    document.body.lang ||
                    document.head.lang ||
                    'und',
                description: getDescription(),
                keywords: getKeywords(),
                canonicalURL: getCanonicalURL(),
                mediawiki: getMediaWikiGlobals(),
                meta: getMeta(),
                linkData: getLinkedData(),
                location: document.location.toString(),
            };
        },
    });
    return execution?.[0]?.result;
}
