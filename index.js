import mqtt from 'mqtt';
import dotenv from "dotenv";

dotenv.config();

const client = mqtt.connect(`mqtt://${process.env.MQTT_BROKER_DSN}`);
let activeNotifications = []

const sendNotification = (notification) => {
  client.publish('notifications/add', JSON.stringify(notification), {
    qos: 1,
  })
  log('sent notification with id: ' + notification.id)
}

const log = (message) => {
  console.log(new Date().toLocaleString() + ': ' + message)
}

client.on("connect", () => {
  client.subscribe([
    "notifications/add",
    "notifications/user-close",
    "notifications/replay-items"
  ]);
  log('connected.')
});

client.on('error', (error) => {
  log('[Error]: ' + error.message)
})

client.on("message", async (topic, message) => {
  const messageString = message.toString()

  switch (topic) {
    case "notifications/add":
      const payload = JSON.parse(messageString)
      if (payload.isPersistent) {
        log('adding persistent notification with id: ' + payload.id)
        const existingIndex = activeNotifications.findIndex(item => item.id === payload.id)
        if (existingIndex !== -1) {
          activeNotifications[existingIndex] = payload
        } else {
          activeNotifications.push(payload);
        }
      }
      break;
    case "notifications/user-close":
      log('user closed notification with id: ' + messageString)
      const existingNotification = activeNotifications.find(item => item.id === messageString)
      if (existingNotification) {
        await sendNotification(existingNotification)
      }
      break;
    case "notifications/replay-items":
      log('system requested replay of notifications.')
      for (let i = 0; i < activeNotifications.length; i++) {
        const activeNotification = activeNotifications[i]
        setTimeout(async () => {
          await sendNotification(activeNotification)
        }, i * 3000)
      }
  }
});
