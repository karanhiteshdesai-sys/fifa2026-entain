const { db } = require('../db/database');

async function createNotification(userId, title, message) {
  await db.createNotification(userId, title, message);
}

module.exports = { createNotification };
