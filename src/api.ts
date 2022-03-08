import express from "express";
import path from "path";
import http from "http"
import { Server } from "socket.io"
import MqttConnection from "./MqttConnection";
import Device from "./Device";


export default class WebApi {

	private readonly _app = express();
	private readonly _server = http.createServer(this._app);
	public readonly io = new Server(this._server);

	constructor(private readonly _mqtt: MqttConnection, private readonly _devices: string[]) { }

	start() {
		this.configureApp()
		this.configureSocket()
		this._server.listen(3000, () => {
			console.log("Listening on port 3000...");
		});
	}
	private configureApp() {
		this._app.set("views", path.join(__dirname, "pages"))
			.use(express.static("./public"))
			.set("view engine", "ejs")
			.get("/", (req, res) => {
				res.render("index", { devices: this._devices, changes: Object.keys(Device.CHANGES) });
			});
	}

	private configureSocket() {
		this.io.on("connection", (socket) => {
			// console.log(`[SOCKET] Connected ${socket.id}`)
			this._devices.forEach((device) => {

				socket.on(`${device}/command`, (data) => {
					this._mqtt.publish(`monitoring/${device}/command`, data)
				})
			})
			// socket.on("disconnect", () => {
			// 	console.log(`[SOCKET] Disconnected ${socket.id}`);
			// });
		});
	}
}








