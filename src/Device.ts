function generateParameter(parameterName: string, min: number, max: number, timestamp: number, decimalFix: number) {
	return {
		type: parameterName,
		timestamp: timestamp,
		value: generateRandomNumber(min, max, decimalFix),
	};
}
function generateRandomNumber(min: number, max: number, decimalFix: number) {
	const value = Math.random() * (max - min) + min;
	if (decimalFix) return value.toFixed(decimalFix);
	return `${Math.floor(value)}`;
}

const defaultValues = {
	SPO2: { min: 95, max: 99 },
	"systolic-blood-pressure": { min: 120, max: 140 },
	"diastolic-blood-pressure": { min: 80, max: 90 },
	PI: { min: 0, max: 3, decimalFix: 3 },
	temperature: { min: 36, max: 37, decimalFix: 1 },
	pulse: { min: 60, max: 80 },
};

export interface PublishFunction {
	(topic: string, data: any): void
}

export default class Device {

	private _intervalId: NodeJS.Timer | undefined = undefined;
	private _change: any | undefined = undefined;
	private _profile: string = "normal"
	private _reportTime: number = 5
	private _baseTopic: string = ""

	public static readonly CHANGES: { [key: string]: any } = {
		"normal": {},
		"worrying saturation": { SPO2: { min: 90, max: 94 } },
		"critical saturation": { SPO2: { min: 75, max: 89 } },
		"elevated temperature": { temperature: { min: 37, max: 39, decimalFix: 1 } },
		"high temperature": { temperature: { min: 39, max: 42, decimalFix: 1 } },
	};

	constructor(private readonly id: string, private readonly publish: PublishFunction) {
		this._baseTopic = `monitoring/${id}`
	}

	async start() {
		if (this._intervalId !== undefined) return;
		this._intervalId = this.loop(this._reportTime)
		this.publish(`${this._baseTopic}/status`, { status: "started" });
	}
	stop() {
		if (this._intervalId === undefined) return
		clearInterval(this._intervalId);
		this._intervalId = undefined;
		this.publish(`${this._baseTopic}/status`, { status: "stopped" });
	}
	changeReportTime(time: number) {
		this._reportTime = time;
		if (this._intervalId !== undefined) {
			clearInterval(this._intervalId);
			this._intervalId = this.loop(this._reportTime)
		}
		this.publish(`${this._baseTopic}/status`, { reportTime: this._reportTime });
	}
	changeProfile(profile: string) {
		this._change = Device.CHANGES[profile];
		this._profile = profile
		this.publish(`${this._baseTopic}/status`, { profile: this._profile });
	}
	info() {
		this.publish(`${this._baseTopic}/status`, { status: this._intervalId !== undefined ? "started" : "stopped" });
		this.publish(`${this._baseTopic}/status`, { profile: this._profile });
		this.publish(`${this._baseTopic}/status`, { reportTime: this._reportTime });
	}

	private loop(seconds: number) {
		return setInterval(() => {
			const timestamp = new Date().getTime();
			const keys = Object.keys(defaultValues);
			const source = this._change ? { ...defaultValues, ...this._change } : defaultValues;
			keys.forEach((key) => {
				const { min, max, decimalFix } = source[key];
				this.publish(`${this._baseTopic}/data`, generateParameter(key, min, max, timestamp, decimalFix));
			});
		}, 1000 * seconds);
	}
};
