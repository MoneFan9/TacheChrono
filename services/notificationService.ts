export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('Ce navigateur ne supporte pas les notifications de bureau.');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  const permission = await Notification.requestPermission();
  return permission;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
};

export const sendNotification = (title: string, body?: string) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: 'https://cdn-icons-png.flaticon.com/512/762/762660.png', // Icône générique de checklist
      silent: false,
    });
  }
};