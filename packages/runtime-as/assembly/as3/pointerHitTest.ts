import { NativeMath } from "~lib/math";
import { Bitmap } from "./Bitmap";
import { DisplayObjectContainer } from "./DisplayObjectContainer";
import { Stage } from "./Stage";
import { lookupAssetHeight, lookupAssetWidth } from "./assetDimensions";

const DEG_TO_RAD: f32 = <f32>NativeMath.PI / 180;

export let lastPointerHitLocalX: f32 = 0;
export let lastPointerHitLocalY: f32 = 0;

export function hitTestStage(stage: Stage, stageX: f32, stageY: f32): Bitmap | null {
  lastPointerHitLocalX = 0;
  lastPointerHitLocalY = 0;
  return hitTestContainer(stage, stageX, stageY, 0, 0, 0, 1, 1, true);
}

function hitTestContainer(
  container: DisplayObjectContainer,
  stageX: f32,
  stageY: f32,
  parentX: f32,
  parentY: f32,
  parentRotation: f32,
  parentScaleX: f32,
  parentScaleY: f32,
  parentVisible: bool
): Bitmap | null {
  let visible = parentVisible && container.visible;
  if (!visible) {
    return null;
  }

  let worldX = parentX + container.x * parentScaleX;
  let worldY = parentY + container.y * parentScaleY;
  let worldRotation = parentRotation + container.rotation;
  let worldScaleX = parentScaleX * container.scaleX;
  let worldScaleY = parentScaleY * container.scaleY;

  for (let i = container.numChildren - 1; i >= 0; i--) {
    let child = container.getChildAt(i);
    if (child instanceof DisplayObjectContainer) {
      let hit = hitTestContainer(
        child as DisplayObjectContainer,
        stageX,
        stageY,
        worldX,
        worldY,
        worldRotation,
        worldScaleX,
        worldScaleY,
        visible
      );
      if (hit != null) {
        return hit;
      }
    } else if (child instanceof Bitmap) {
      let hit = hitTestBitmap(
        child as Bitmap,
        stageX,
        stageY,
        worldX,
        worldY,
        worldRotation,
        worldScaleX,
        worldScaleY,
        visible
      );
      if (hit != null) {
        return hit;
      }
    }
  }

  return null;
}

function hitTestBitmap(
  bitmap: Bitmap,
  stageX: f32,
  stageY: f32,
  parentX: f32,
  parentY: f32,
  parentRotation: f32,
  parentScaleX: f32,
  parentScaleY: f32,
  parentVisible: bool
): Bitmap | null {
  let visible = parentVisible && bitmap.visible;
  if (!visible) {
    return null;
  }

  let width = lookupAssetWidth(bitmap.assetId);
  let height = lookupAssetHeight(bitmap.assetId);
  if (width <= 0 || height <= 0) {
    return null;
  }

  let worldX = parentX + bitmap.x * parentScaleX;
  let worldY = parentY + bitmap.y * parentScaleY;
  let worldRotation = parentRotation + bitmap.rotation;
  let worldScaleX = parentScaleX * bitmap.scaleX;
  let worldScaleY = parentScaleY * bitmap.scaleY;

  if (worldScaleX == 0 || worldScaleY == 0) {
    return null;
  }

  let dx = stageX - worldX;
  let dy = stageY - worldY;
  let radians = -worldRotation * DEG_TO_RAD;
  let cos = <f32>NativeMath.cos(<f64>radians);
  let sin = <f32>NativeMath.sin(<f64>radians);
  let rotatedX = dx * cos - dy * sin;
  let rotatedY = dx * sin + dy * cos;
  let localX: f32 = rotatedX / worldScaleX;
  let localY: f32 = rotatedY / worldScaleY;

  if (localX < 0 || localY < 0 || localX > width || localY > height) {
    return null;
  }

  lastPointerHitLocalX = localX;
  lastPointerHitLocalY = localY;
  return bitmap;
}
