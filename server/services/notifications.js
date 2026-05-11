const db = require('../db/database');

function createNotification(userId, title, message) {
  const data = db.getData();
  if (!data.notifications) data.notifications = [];
  if (!data.nextId.notifications) data.nextId.notifications = 1;

  data.notifications.push({
    id: data.nextId.notifications++,
    user_id: userId,
    title,
    message,
    read: false,
    created_at: new Date().toISOString()
  });

  if (data.notifications.length > 500) {
    data.notifications = data.notifications.slice(-500);
  }

  db.saveData(data);
}

module.exports = { createNotification };
