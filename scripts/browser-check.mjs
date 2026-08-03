const endpoint = process.argv[2] ?? "http://127.0.0.1:9222/json";
const pageUrl = process.argv[3];
const viewportWidth = Number(process.argv[4] ?? 375);
const viewportHeight = Number(process.argv[5] ?? 812);
const targets = await fetch(endpoint).then((response) => response.json());
const target = targets.find((item) => item.type === "page");

if (!target?.webSocketDebuggerUrl) {
  throw new Error("No debuggable browser page was found.");
}

const socket = new WebSocket(target.webSocketDebuggerUrl);
const errors = [];
let nextId = 0;

function send(method, params = {}) {
  socket.send(JSON.stringify({ id: ++nextId, method, params }));
}

socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  if (message.method === "Runtime.exceptionThrown") {
    errors.push(`Exception: ${message.params.exceptionDetails.text}`);
  }
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    const text = message.params.args.map((arg) => arg.value ?? arg.description).join(" ");
    errors.push(`Console: ${text}`);
  }
  if (message.method === "Network.loadingFailed" && !message.params.canceled) {
    errors.push(`Network: ${message.params.errorText}`);
  }
});

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

send("Runtime.enable");
send("Log.enable");
send("Network.enable");
send("Page.enable");
send("Emulation.setDeviceMetricsOverride", {
  width: viewportWidth,
  height: viewportHeight,
  deviceScaleFactor: 1,
  mobile: viewportWidth < 768,
});
if (pageUrl) {
  send("Page.navigate", { url: pageUrl });
} else {
  send("Page.reload", { ignoreCache: true });
}

await new Promise((resolve) => setTimeout(resolve, 8000));
socket.close();

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Browser runtime check passed: no console errors, page exceptions, or failed resources.");
