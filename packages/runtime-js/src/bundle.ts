export interface SketchBundleManifest {
  name: string;
  entry?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  runtimeVersion?: string;
}

export interface SketchBundlePayload {
  mime: string;
  data: string;
}

export interface SketchBundle {
  manifest: SketchBundleManifest;
  wasm: SketchBundlePayload & { mime: "application/wasm" };
  assets: Record<string, SketchBundlePayload>;
}

export interface LoadSketchBundleOptions {
  mount: HTMLElement;
  canvas?: HTMLCanvasElement;
  debugPointer?: boolean;
}

export function decodeBase64ToUint8Array(base64: string): Uint8Array {
  let binary = atob(base64);
  let bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function assertSketchBundle(value: unknown): SketchBundle {
  if (value == null || typeof value !== "object") {
    throw new Error("Sketch bundle must be a JSON object.");
  }

  let bundle = value as SketchBundle;
  if (bundle.manifest == null || typeof bundle.manifest.name !== "string") {
    throw new Error("Sketch bundle must include manifest.name.");
  }
  if (bundle.wasm == null || bundle.wasm.mime !== "application/wasm" || typeof bundle.wasm.data !== "string") {
    throw new Error("Sketch bundle must include wasm { mime: application/wasm, data }.");
  }
  if (bundle.assets == null || typeof bundle.assets !== "object" || Array.isArray(bundle.assets)) {
    throw new Error("Sketch bundle must include an assets object.");
  }

  return bundle;
}

export async function fetchSketchBundle(url: string | URL): Promise<SketchBundle> {
  let response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sketch bundle (${response.status} ${response.statusText}).`);
  }
  return assertSketchBundle(await response.json());
}
