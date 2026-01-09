(async() => {
    if('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();

            for (const registration of registrations) {
                if (!registration.active.scriptURL.endsWith(`sw.js`))
                    await registration.unregister();
            }
        } catch (e) {
            console.error(`Deregistration failed with ${e}`);
        }

        navigator.serviceWorker.register(`sw.js`);
    }
})();
