$(document).ready(() => {
  $("#loading").hide();
  const devices = $("#devices");
  const status = $("#status");
  const fields = {
    SPO2: $("#SPO2 strong"),
    "systolic-blood-pressure": $("#systolic-blood-pressure strong"),
    "diastolic-blood-pressure": $("#diastolic-blood-pressure strong"),
    PI: $("#PI strong"),
    temperature: $("#temperature strong"),
    pulse: $("#pulse strong"),
  };
  const timestamp = $("#timestamp");
  const statusChanges = $("#status-changes button");
  const parametersChanges = $("#parameters-changes button");
  const reportTime = $("#report-time");

  let selectedDevice = devices.find(":selected").text();

  socket.on("connect", () => {
    console.log("Connected");
    changeSubscription(undefined, selectedDevice);
  });

  function changeSubscription(oldDevice, newDevice) {
    $("#loading").show();
    const keys = Object.keys(fields);
    if (oldDevice) {
      socket.off(`${oldDevice}/data`);
      socket.off(`${oldDevice}/status`);
    }
    socket.on(`${newDevice}/data`, (data) => {
      timestamp.html(new Date(data.timestamp).toLocaleString());
      fields[data.type].html(data.value);
    });
    socket.on(`${newDevice}/status`, (data) => {
      $("#loading").hide();
      if (data.status) {
        status.html(data.status.toUpperCase());
        statusChanges.removeClass("active");
        const tag = data.status === "started" ? "start" : "stop";
        $(`#${tag}`).addClass("active");
      }
      if (data.reportTime) {
        $("#report-time-label").html(`${data.reportTime} s`);
        reportTime.val(data.reportTime);
      }
      if (data.profile) {
        parametersChanges.removeClass("active");
        $("#parameters-changes")
          .find(`button:contains("${data.profile}")`)
          .addClass("active");
      }
    });
    setTimeout(
      () => socket.emit(`${selectedDevice}/command`, { command: "info" }),
      500
    );

    $("#selected-device").html(newDevice);
    status.html("-");
    timestamp.html("-");
    keys.forEach((key) => fields[key].html("-"));
    $("#report-time-label").html(`-`);
  }

  devices.on("change", function () {
    const newDevice = $(this).find(":selected").text();
    changeSubscription(selectedDevice, newDevice);
    selectedDevice = newDevice;
  });
  parametersChanges.on("click", function () {
    $("#loading").show();
    const command = $(this).html();
    socket.emit(`${selectedDevice}/command`, { command });
  });
  statusChanges.on("click", function () {
    $("#loading").show();
    const command = $(this).attr("id");
    socket.emit(`${selectedDevice}/command`, { command });
  });
  reportTime.on("change", function () {
    const time = parseInt($(this).find(":selected").text());
    if (isNaN(time)) return;
    $("#loading").show();
    socket.emit(`${selectedDevice}/command`, {
      command: `report-every-${time}`,
    });
  });
});
