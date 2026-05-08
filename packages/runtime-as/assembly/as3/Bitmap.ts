import { DisplayObject } from "./DisplayObject";
import { assetIdForPath } from "./assets";

export class Bitmap extends DisplayObject {
  source: string;
  assetId: i32;

  constructor(source: string) {
    super();
    this.source = source;
    this.assetId = assetIdForPath(source);
  }
}
