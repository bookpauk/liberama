const oldSW = [//и старые и текущий SW должны быть здесь
    'sw.js', //убрать после 2027-01-01
    'service-worker.js', //убрать после 2027-01-01
    'sw-liberama.js',
];

const currentSW = `sw-liberama.js`;

// функция используется также в Reader.checkNewVersionAvailable
window.unregisterLiberamaSW = async() => {
    if('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();

            const needUnregister = (reg) => {
                for (const sw of oldSW)
                    if (reg.active.scriptURL.endsWith(sw))
                        return true;

                return false;
            };

            for (const registration of registrations) {
                if (needUnregister(registration))
                    await registration.unregister();
            }
        } catch (e) {
            console.error(`Deregistration failed with ${e}`);
        }
    }
};

(async() => {
    if('serviceWorker' in navigator) {
        await window.unregisterLiberamaSW();

        navigator.serviceWorker.register(`./${currentSW}`);
    }
})();
