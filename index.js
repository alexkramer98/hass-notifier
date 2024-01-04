import mqtt from 'mqtt';
import dotenv from "dotenv";
import axios from 'axios';

dotenv.config();

const client = mqtt.connect(`mqtt://${process.env.MQTT_BROKER_DSN}`);
const activeNotifications = []

const notifyUrl = `https://${process.env.HASS_ENDPOINT}/api/services/notify/mobile_app_${process.env.HASS_PHONE_NAME}`;

const sendNotification = async (notification) => {
  const resp = await axios.post(
    notifyUrl,
    notification,
    {
      headers: {
        Authorization: `Bearer ${process.env.HASS_TOKEN}`,
        'Content-Type': 'application/json',
      }
    }
  )
}

const clearNotification = async (tag) => {
  await sendNotification({
    message: 'clear_notification',
    data: {
      tag
    }
  })
}

await sendNotification({
  message: 'test',
  title: 'test',
  data: {
    actions: [{
      action: 'test',
      title: 'test'
    }],
    tag: 'ambi',
    persistent: true,
    sticky: true,
    channel: '_silent',
    icon_url: '/local/icons/music.png'
  }
})

client.on("connect", () => {
  client.subscribe("notifications/add");
  client.subscribe("notifications/remove");
  client.subscribe("notifications/respawn");
});

client.on("message", async (topic, message) => {
  switch (topic) {
    case "notifications/add":
      activeNotifications.push(message);
      await sendNotification(JSON.parse(message.toString()))
      break;
    case "notifications/remove":
      activeNotifications.splice(activeNotifications.indexOf(message), 1);
      await clearNotification(message.toString())
      break;
    case "notifications/respawn":
      for (const notification of activeNotifications) {
        await sendNotification(JSON.parse(notification))
      }
  }
});
