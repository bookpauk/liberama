import webAppDir from '../build/appdir';

(async() => {
    if('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();

            for (const registration of registrations) {
                if (!registration.active.scriptURL.endsWith(`/${webAppDir}/service-worker.js`))
                    await registration.unregister();
            }
        } catch (e) {
            console.error(`Deregistration failed with ${e}`);
        }

        navigator.serviceWorker.register(`/${webAppDir}/service-worker.js`);
    }
})();
