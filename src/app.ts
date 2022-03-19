import WebApi from "./api";
import MqttConnection from "./MqttConnection"
import fs from "fs"
import Device, { PublishFunction } from "./Device";

async function main() {
    const { devices } = JSON.parse(fs.readFileSync("./settings.json").toString());
    const deviceMap = new Map<string, Device>()
    const mqtt = new MqttConnection(process.env.MQTT_URL as string);
    const api = new WebApi(mqtt, devices)

    const publish: PublishFunction = (topic, data) => { mqtt.publish(topic, data) }
    for await (const device of devices) {
        await mqtt.subscribe(`monitoring/${device}/command`);
        await mqtt.subscribe(`monitoring/${device}/data`);
        await mqtt.subscribe(`monitoring/${device}/status`);
        deviceMap.set(device, new Device(device, publish))
    }
    console.log(process.env.HTTP_PORT)
    api.start(parseInt(process.env.HTTP_PORT as string))
    mqtt.start(async (topic, data) => {
        const device = topic.split('/')[1]
        handleCommand(deviceMap.get(device), data)
        if (topic.endsWith("/data")) api.io.emit(`${device}/data`, data)
        if (topic.endsWith("/status")) api.io.emit(`${device}/status`, data)
    })
}

function handleCommand(device: Device | undefined, { command }: any) {

    if(command === undefined) return;
    if (device === undefined) return;
    if (command === "start") device.start()
    if (command === "stop") device.stop()
    if (command === "info") device.info()
    if (command.startsWith("report-every")) device.changeReportTime(parseInt(command.split("-")[2]))
    const allowed = Object.keys(Device.CHANGES)
    if (allowed.indexOf(command) !== -1) device.changeProfile(command)
}

main().catch(error => { console.log(`[APP] ${error.message}`) })