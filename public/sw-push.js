self.addEventListener('push', function(e) {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'PACGYM', {
      body: data.body || 'Hora de entrenar 💪',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
    })
  );
});
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(clients.openWindow('/mi-plan'));
});
