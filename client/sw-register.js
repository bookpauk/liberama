import webAppDir from '../build/appdir';

(async() => {
    if('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register(`/service-worker.js`);
            await registration.unregister();
        } catch (e) {
            console.error(`Deregistration failed with ${e}`);
        }

        navigator.serviceWorker.register(`/${webAppDir}/service-worker.js`);
    }
})();
