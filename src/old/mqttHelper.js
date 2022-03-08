const mqtt = require("mqtt");

let client;

module.exports.connect = async function (brokerUrl) {
  client = mqtt.connect(brokerUrl);
  return new Promise((resolve, reject) => {
    client.on("connect", async () => {
      resolve(client);
    });
  });
};

module.exports.subscribe = async function (topic) {
  return new Promise((resolve, reject) => {
    client.subscribe(topic, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log(`Successfully subscribed on ${topic}`);
      resolve();
    });
  });
};

module.exports.publish = async function (topic, data) {
  return new Promise((resolve) => {
    client.publish(topic, data);
    resolve();
  });
};
