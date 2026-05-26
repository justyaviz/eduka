(function () {
  const CLEAN_FLAG = "eduka_cache_reset_32_4_0";
  const isStudentApp = location.pathname === "/student-app" || location.pathname.startsWith("/student-app/");

  async function deleteOldCaches() {
    if (!("caches" in window)) return false;
    const keys = await caches.keys();
    const staleKeys = keys.filter((key) => /^eduka-student-v/i.test(key) || /^eduka-app-/i.test(key));
    await Promise.all(staleKeys.map((key) => caches.delete(key)));
    return staleKeys.length > 0;
  }

  async function unregisterWideStudentWorkers() {
    if (!("serviceWorker" in navigator)) return false;
    const registrations = await navigator.serviceWorker.getRegistrations();
    let changed = false;
    await Promise.all(registrations.map(async (registration) => {
      const scriptUrl = registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL || "";
      const isStudentWorker = scriptUrl.includes("/student-sw.js");
      const isWideScope = registration.scope === `${location.origin}/` || registration.scope === `${location.origin}/app/`;
      if (isStudentWorker && isWideScope) {
        changed = true;
        await registration.unregister();
      }
    }));
    return changed;
  }

  async function cleanup() {
    try {
      const [workerChanged, cacheChanged] = await Promise.all([
        unregisterWideStudentWorkers(),
        deleteOldCaches()
      ]);

      if (!isStudentApp && (workerChanged || cacheChanged) && navigator.serviceWorker?.controller && sessionStorage.getItem(CLEAN_FLAG) !== "1") {
        sessionStorage.setItem(CLEAN_FLAG, "1");
        location.reload();
      }
    } catch (error) {
      console.warn("Eduka cache cleanup skipped:", error);
    }
  }

  cleanup();
})();
