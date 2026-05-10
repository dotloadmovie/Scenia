export function assetIdForPath(path: string): i32 {
  let hash: i32 = 0;
  for (let i = 0; i < path.length; i++) {
    hash = hash * 31 + path.charCodeAt(i);
    hash = hash & 0x7fffffff;
  }

  return hash == 0 ? 1 : hash;
}
