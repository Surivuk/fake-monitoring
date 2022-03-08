function generateParameter(parameterName, min, max, timestamp, decimalFix) {
  return {
    type: parameterName,
    timestamp: timestamp,
    value: generateRandomNumber(min, max, decimalFix),
  };
}
function generateRandomNumber(min, max, decimalFix) {
  const value = Math.random() * (max - min) + min;
  if (decimalFix) return value.toFixed(decimalFix);
  return `${Math.floor(value)}`;
}

const params = [
  {
    type: "saturation",
    normal: { min: 95, max: 99 },
    warning: { min: 90, max: 94 },
    critical: { min: 75, max: 89 },
  },
  {
    type: "systolic-blood-pressure",
    normal: { min: 120, max: 140 }, // 120/80   140/90
    warning: { min: 150, max: 160 }, // 150/90   160/100
    critical: { min: 180, max: 200 }, // 180/10   200/120
  },
  {
    type: "diastolic-blood-pressure",
    normal: { min: 80, max: 90 }, // 120/80   140/90
    warning: { min: 91, max: 100 }, // 150/90   160/100
    critical: { min: 101, max: 120 }, // 180/10   200/120
  },
  {
    type: "PI",
    normal: { min: 0, max: 3 }, // 120/80   140/90
    warning: { min: 5, max: 15 }, // 150/90   160/100
    critical: { min: 16, max: 30 }, // 180/10   200/120
  },
];

const defaultValues = {
  SPO2: { min: 95, max: 99 },
  "systolic-blood-pressure": { min: 120, max: 140 },
  "diastolic-blood-pressure": { min: 80, max: 90 },
  PI: { min: 0, max: 3, decimalFix: 3 },
  temperature: { min: 36, max: 37, decimalFix: 1 },
  pulse: { min: 60, max: 80 },
};

module.exports.Device = class {
  constructor(id, publish) {
    this.intervalId = undefined;
    this.id = id;
    this.publish = publish;
    this.change = undefined;
  }

  async start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      const timestamp = new Date().getTime();
      const keys = Object.keys(defaultValues);

      const source = this.change
        ? { ...defaultValues, ...this.change }
        : defaultValues;
      console.log(source);

      keys.forEach((key) => {
        const { min, max, decimalFix } = source[key];
        this.publish(
          `monitoring/${this.id}/data`,
          JSON.stringify(
            generateParameter(key, min, max, timestamp, decimalFix)
          )
        );
      });
    }, 1000 * 5);
    this.publish(
      `monitoring/${this.id}/status`,
      JSON.stringify({ status: "running" })
    );
  }
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      this.publish(
        `monitoring/${this.id}/status`,
        JSON.stringify({ status: "stopped" })
      );
    }
  }

  makeChange(newState) {
    const changes = {
      "worrying saturation": { SP02: { min: 90, max: 94 } },
      "critical saturation": { SP02: { min: 75, max: 89 } },

      "elevated temperature": {
        temperature: { min: 37, max: 42, decimalFix: 1 },
      },
      "high temperature": { temperature: { min: 39, max: 42, decimalFix: 1 } },
    };
    this.change = changes[newState];
  }
};
