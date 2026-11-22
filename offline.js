"use strict";

const offlineStatus = document.getElementById("offline-status");
const offlineDownload = document.getElementById("offline-download");
const offlineGuide = document.getElementById("offline-guide");
const offlineGuideClose = document.getElementById("offline-guide-close");
const workerURL = new URL("sw.js", location.href);

const isAppleTouchDevice =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

function openOfflineGuide() {
  if (!offlineGuide) return;
  if (typeof offlineGuide.showModal === "function") {
    if (!offlineGuide.open) offlineGuide.showModal();
  } else {
    offlineGuide.setAttribute("open", "");
  }
}

function closeOfflineGuide() {
  if (!offlineGuide) return;
  if (typeof offlineGuide.close === "function" && offlineGuide.open) {
    offlineGuide.close();
  } else {
    offlineGuide.removeAttribute("open");
  }
}

if (offlineGuideClose) {
  offlineGuideClose.addEventListener("click", closeOfflineGuide);
}
if (offlineGuide) {
  offlineGuide.addEventListener("click", (event) => {
    if (event.target === offlineGuide) closeOfflineGuide();
  });
}
if (offlineStatus) {
  offlineStatus.addEventListener("click", openOfflineGuide);
}
if (offlineDownload && isAppleTouchDevice && offlineGuide) {
  offlineDownload.addEventListener("click", (event) => {
    event.preventDefault();
    openOfflineGuide();
  });
}

if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  const workers = navigator.serviceWorker;

  async function refreshOfflineStatus() {
    if (!offlineStatus) return;
    if (workers.controller?.scriptURL === workerURL.href) {
      offlineStatus.hidden = false;
      return;
    }
    try {
      const reg = await workers.getRegistration();
      if (reg?.active) {
        offlineStatus.hidden = false;
      }
    } catch {
      // Ignore registration check errors.
    }
  }

  workers.addEventListener("controllerchange", refreshOfflineStatus);
  workers.register(workerURL)
    .then((reg) => {
      if (reg.installing) {
        reg.installing.addEventListener("statechange", () => {
          if (reg.active) refreshOfflineStatus();
        });
      }
      return workers.ready;
    })
    .then(refreshOfflineStatus)
    .catch(() => {
      // Standalone download remains available if the browser blocks service workers.
    });
}
