import webAppDir from '../build/appdir';

(async() => {
    if('serviceWorker' in navigator) {
        try {
            const registrations = navigator.serviceWorker.getRegistrations();

            for (const registration of registrations) {
console.log(registration.active.scriptURL);
                if (registration.active.scriptURL.startsWith('/service-worker.js'))
                    await registration.unregister();
            }
        } catch (e) {
            console.error(`Deregistration failed with ${e}`);
        }

        navigator.serviceWorker.register(`/${webAppDir}/service-worker.js`);
    }
})();
