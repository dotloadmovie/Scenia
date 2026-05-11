let dimensionAssetIds: Array<i32> = new Array<i32>();
let dimensionWidths: Array<f32> = new Array<f32>();
let dimensionHeights: Array<f32> = new Array<f32>();

export function registerAssetDimensions(assetId: i32, width: f32, height: f32): void {
  for (let i = 0; i < dimensionAssetIds.length; i++) {
    if (unchecked(dimensionAssetIds[i]) == assetId) {
      dimensionWidths[i] = width;
      dimensionHeights[i] = height;
      return;
    }
  }

  dimensionAssetIds.push(assetId);
  dimensionWidths.push(width);
  dimensionHeights.push(height);
}

export function lookupAssetWidth(assetId: i32): f32 {
  for (let i = 0; i < dimensionAssetIds.length; i++) {
    if (unchecked(dimensionAssetIds[i]) == assetId) {
      return unchecked(dimensionWidths[i]);
    }
  }
  return 0;
}

export function lookupAssetHeight(assetId: i32): f32 {
  for (let i = 0; i < dimensionAssetIds.length; i++) {
    if (unchecked(dimensionAssetIds[i]) == assetId) {
      return unchecked(dimensionHeights[i]);
    }
  }
  return 0;
}
