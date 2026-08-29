// Service worker nexjoob : réception des notifications push
// et ouverture de la page concernée au clic.

self.addEventListener('push', (event) => {
  let payload = { title: 'nexjoob', body: '', url: '/' };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      // payload non JSON
    }
  }

  const options = {
    body: payload.body || 'Une nouvelle notification vous attend sur nexjoob.',
    icon: '/logo_nexjoob.png',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: { url: payload.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(payload.title || 'nexjoob', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const target = new URL(url, self.location.origin);
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(target.pathname + target.search);
          }
          return;
        }
      }
      return clients.openWindow(target.pathname + target.search);
    })
  );
});
