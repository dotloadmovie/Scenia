import { WasmCanvasRuntime } from "@as3-wasm-runtime/runtime-js";
import "./style.css";

async function boot(): Promise<void> {
  let canvas = document.querySelector<HTMLCanvasElement>("#stage");
  if (canvas == null) {
    throw new Error("Missing #stage canvas.");
  }

  let runtime = await WasmCanvasRuntime.load({
    canvas,
    wasmUrl: "/main.wasm",
    background: "#101827",
    assets: ["ball.png"]
  });

  runtime.start();
}

boot().catch((error) => {
  let app = document.querySelector("#app");
  if (app != null) {
    app.insertAdjacentHTML(
      "beforeend",
      `<pre class="error">${escapeHtml(error instanceof Error ? error.message : String(error))}</pre>`
    );
  }
  console.error(error);
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}
