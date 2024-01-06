import mqtt from 'mqtt';
import dotenv from "dotenv";

dotenv.config();

const client = mqtt.connect(`mqtt://${process.env.MQTT_BROKER_DSN}`);
let activeNotifications = []

const sendNotification = (notification) => {
  client.publish('notifications/add', JSON.stringify(notification), {
    qos: 1,
  })
}

client.on("connect", () => {
  client.subscribe([
    "notifications/add",
    "notifications/user-close",
    "notifications/replay-items"
  ]);
});

client.on('error', (error) => {
  console.error(error)
})

client.on("message", async (topic, message) => {
  const messageString = message.toString()

  switch (topic) {
    case "notifications/add":
      const payload = JSON.parse(messageString)
      if (payload.isPersistent) {
        const existingIndex = activeNotifications.findIndex(item => item.id === payload.id)
        if (existingIndex !== -1) {
          activeNotifications[existingIndex] = payload
        } else {
          activeNotifications.push(payload);
        }
      }
      break;
    case "notifications/user-close":
      const existingNotification = activeNotifications.find(item => item.id === messageString)
      if (existingNotification) {
        await sendNotification(existingNotification)
      }
      break;
    case "notifications/replay-items":
      for (let i = 0; i < activeNotifications.length; i++) {
        const activeNotification = activeNotifications[i]
        setTimeout(async () => {
          await sendNotification(activeNotification)
        }, i * 3000)
      }
  }
});
