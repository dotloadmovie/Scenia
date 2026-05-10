import { Stage, getRenderListLength } from "./as3";

export function smoke(): i32 {
  let stage = new Stage(1, 1);
  stage.tick(0);
  return getRenderListLength();
}
