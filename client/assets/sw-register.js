const oldSW = [//и старые и текущий SW должны быть здесь
    'sw.js', //убрать после 2026-04-01
    'service-worker.js', //убрать после 2026-04-01
];

// 2026-02-01 переименовать в уникальное имя (напр. sw-liberama-1.js), чтобы не было конфликтов при встраивании через reverse proxy
// не забыть добавить в oldSW
const currentSW = `service-worker.js`;

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
