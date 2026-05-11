import { PointerEvent } from "./Event";
import { hitTestStage, lastPointerHitLocalX, lastPointerHitLocalY } from "./pointerHitTest";
import { Stage } from "./Stage";

export const POINTER_KIND_DOWN: i32 = 1;
export const POINTER_KIND_UP: i32 = 2;
export const POINTER_KIND_MOVE: i32 = 3;

let boundStage: Stage | null = null;

export function bindStage(stage: Stage): void {
  boundStage = stage;
}

export function dispatchPointerFromHost(stageX: f32, stageY: f32, kind: i32): void {
  let stage = boundStage;
  if (stage == null) {
    return;
  }

  let target = hitTestStage(stage, stageX, stageY);
  if (target == null) {
    return;
  }

  let type = pointerKindToType(kind);
  let event = new PointerEvent(
    type,
    stageX,
    stageY,
    lastPointerHitLocalX,
    lastPointerHitLocalY
  );
  target.dispatchEvent(event);
}

function pointerKindToType(kind: i32): string {
  if (kind == POINTER_KIND_DOWN) {
    return PointerEvent.POINTER_DOWN;
  }
  if (kind == POINTER_KIND_UP) {
    return PointerEvent.POINTER_UP;
  }
  return PointerEvent.POINTER_MOVE;
}
