const { connect, subscribe, publish } = require("./mqttHelper");
const fs = require("fs");
const { Device } = require("./Device");

const { devices } = JSON.parse(fs.readFileSync("./settings.json"));
const deviceMap = new Map()


async function main() {
  const client = await connect("mqtt://localhost");
  for await (const device of devices) {
    await subscribe(`monitoring/${device}/command`);
    deviceMap.set(device, new Device(device, publish))
  }
  client.on("message", (topic, message) => {
    handleCommand(deviceMap.get(topic.split("/")[1]), JSON.parse(message.toString())) 
  });
}

main().catch((err) => {
  console.log(err);
});


function handleCommand(device, {command}) {
    if(!device) return;
    if(command === "start") device.start()
    if(command === "stop") device.stop()
    if(command === "high temperature")  device.makeChange(command)
}
