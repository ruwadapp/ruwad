self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data.json() } catch { data = { title: 'رُوّاد', body: event.data ? event.data.text() : '' } }

  const title = data.title || 'رُوّاد'
  const ICONS = {
    urgent: '/icons/icon-alert-red-192.png',
    important: '/icons/icon-alert-yellow-192.png',
  }
  const options = {
    body: data.body || '',
    // أيقونة الهوية الملوّنة الكاملة (تدرّج أزرق + النجمة) بدل النسخة بيضاء الخلفية الباهتة
    icon: ICONS[data.tone] || '/icons/icon-notify-192.png',
    // شارة أحادية اللون (صورة ظلّية) — الشكل الصحيح لشريط الحالة في أندرويد
    badge: '/icons/badge-96.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: data.tone === 'urgent' ? [180, 80, 180, 80, 180] : [120, 60, 120],
    timestamp: Date.now(),
    // إشعارات النوع نفسه تُستبدل بأحدثها بدل تكديس المركز، مع تنبيه متجدد
    tag: data.tag || (data.type ? `ruwad-${data.type}` : undefined),
    renotify: !!(data.tag || data.type),
    // صورة كبيرة اختيارية (للدعايات مستقبلاً)
    image: data.image || undefined,
    actions: [{ action: 'open', title: 'فتح' }],
    data: { url: data.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

// عند تدوير المتصفح للاشتراك (أو إبطاله) نعيد الاشتراك ونحفظه ذاتياً —
// بدون هذا يموت اشتراك الجهاز بصمت وتتوقف الإشعارات حتى يعيد المستخدم تفعيلها يدوياً
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const res = await fetch('/api/push/vapid')
        const { key } = await res.json()
        if (!key) return
        const sub = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        })
        await fetch('/api/push/save', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        })
      } catch (e) { /* سيصلحه فتح صفحة الحساب لاحقاً */ }
    })()
  )
})
