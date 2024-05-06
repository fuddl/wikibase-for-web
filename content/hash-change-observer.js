window.addEventListener(
    'hashchange',
    async () => {
        await browser.runtime.sendMessage({
            type: 'hash_changed',
            url: location.href,
        });
    },
    false,
);
