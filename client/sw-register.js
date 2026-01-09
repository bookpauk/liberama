import webAppDir from '../build/appdir';

(function() {
    if('serviceWorker' in navigator) {
        navigator.serviceWorker.register(`/${webAppDir}/service-worker.js`);
    }
})();
