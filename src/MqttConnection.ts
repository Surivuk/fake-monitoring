import mqtt, { Client } from "mqtt"


export interface MqttMessageHandler {
    (topic: string, data: any): Promise<void>
}

export default class MqttConnection {

    private readonly _client: Client;

    constructor(brokerUrl: string) {
        this._client = mqtt.connect(brokerUrl)
    }

    async subscribe(topic: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this._client.subscribe(topic, (err) => {
                if (err) {
                    reject(err)
                    return;
                }
                resolve()
            })
        })
    }
    async publish(topic: string, data: any): Promise<void> {
        return new Promise((resolve, reject) => {
            this._client.publish(topic, JSON.stringify(data), (err) => {
                if (err) {
                    reject(err)
                    return;
                }
                resolve()
            })
        })
    }
    start(handler: MqttMessageHandler) {
        this._client.on("message", (topic, payload) => {
            handler(topic, JSON.parse(payload.toString()))
        })
    }
}