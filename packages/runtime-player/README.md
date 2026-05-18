# @as3-wasm-runtime/runtime-player

Thin browser entry point for portable sketch bundles. Re-exports
`loadSketchBundle` and related types from `@as3-wasm-runtime/runtime-js`.

The build emits a self-contained `dist/browser/runtime-player.js` (Vite bundles
`runtime-js` in) and copies it to `examples/player/runtime-player.js` for the
standalone HTML demo.

```sh
pnpm --filter @as3-wasm-runtime/runtime-player build
```
