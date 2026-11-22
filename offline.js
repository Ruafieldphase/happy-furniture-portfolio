"use strict";

const offlineStatus = document.getElementById("offline-status");
const workerURL = new URL("sw.js", location.href);

if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  const workers = navigator.serviceWorker;
  function showOfflineStatus() {
    offlineStatus.hidden = workers.controller?.scriptURL !== workerURL.href;
  }
  workers.addEventListener("controllerchange", showOfflineStatus);
  workers.register(workerURL).then(showOfflineStatus).catch(() => {
    // The standalone download is available if the browser blocks service workers.
  });
}
