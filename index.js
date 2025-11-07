import mqtt from 'mqtt'
import dotenv from "dotenv"

dotenv.config()

const client = mqtt.connect(`${process.env.MQTT_BROKER_DSN}`)
let activeNotifications = []

const sendNotification = (notification) => {
  // hass handles this topic too using an automation and actually sends the notification to the phone
  // maybe we shouldn't do it like this, but for now (tm) it works
  client.publish('notifications/add', JSON.stringify(notification), { qos: 1 })
  log('sent notification with id: ' + notification.id)
}

const log = (message) => {
  console.log(new Date().toLocaleString() + ': ' + message)
}

client.on("connect", () => {

  client.subscribe([
    "notifications/add",
    "notifications/user-close",
    "notifications/clear-item",
    "notifications/replay-items",
  ])
  log('connected.')
})

client.on('error', (error) => {
  log('[error]: ' + error.message)
})

client.on("message", async (topic, message) => {
  const messageString = message.toString()

  switch (topic) {
    case "notifications/add":
      // todo: als nieuwe melding niet persistent en oude wel, oude verwijderen. Dus onderstaande niet alleen runnen als NIEUWE persistent is
      const payload = JSON.parse(messageString)
      const existingIndex = activeNotifications.findIndex(item => item.id === payload.id)

      if (payload.isPersistent) {
        if (existingIndex === -1) {
          log('adding persistent notification with id: ' + payload.id)
          activeNotifications.push(payload)
        } else {
          log('changing persistent notification with id: ' + payload.id)
          activeNotifications[existingIndex] = payload
        }
      } else if (existingIndex !== -1) {
        log('clearing previously persistent notification which changed to non-persistent notification: ' + payload.id)
        activeNotifications.splice(existingIndex, 1)
      }
      break
    case "notifications/user-close":
      log('user closed notification with id: ' + messageString)
      const existingNotification = activeNotifications.find(item => item.id === messageString)
      if (existingNotification) {
        await sendNotification(existingNotification)
      }
      break
    case "notifications/clear-item":
      log('clearing notification with id: ' + messageString)
      activeNotifications = activeNotifications.filter(item => item.id !== messageString)
      break
    case "notifications/replay-items":
      log('system requested replay of notifications.')
      for (let i = 0; i < activeNotifications.length; i++) {
        const activeNotification = activeNotifications[i]
        setTimeout(async () => {
          await sendNotification(activeNotification)
        }, i * 3000)
      }
  }
})
