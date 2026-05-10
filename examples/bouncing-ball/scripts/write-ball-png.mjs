import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));
const outputPath = join(directory, "../public/ball.png");

// A tiny 64x64 PNG used by the demo. Keeping it as base64 keeps the repo text-only.
const ballPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAABhUlEQVR4nO2aQQ6DIBBFB///yc1UAxVdBr1nuzAEyudSSBAkD8FlMpmZ+zOAHqifzePfWZOPrfIuNWTwtcJv3TfuElZ5h1AALHoBv1vOOK5sGmEdZOA1Y1QeQP0bz8z4exlpyGr/T6/XKGMJISilFELP87K+xSA7i1kHGbgeZESd933vy7Lk83m+8+xQgi1ns9l8Pp+11pyz2+2maYZhBEEIKfV9H4bhi/cWIcSY8z4I4ZxjtNaa+xr+eFfXPceYtxhrzvv9np7nzPO8NE0xvvlBnufo+97j8cRxHL1eb8y5PM/Rtm0cx1prqtXqZDJJkgRjrDzPk2UZx7EoijzPk+e5qqqIoiiOYxiGTqeTz+eVZVnX9TzPq6rKeZ7P5+M4zuPxyrJ84Nj70aS1qqp6nqcS9++E9WIYBkIQhqE4jh8YH65K01RVlWVZ0zTqLoHv9xti7OI4tm3zPG+MUavVkmVZ3W63KIqaprmua/CM+Tymqeo8z8MwjDFmOBymaZpSSilFURRFUTjn8/luNt6FEGLM8zxN0+R5XtM0V/X/ZOq1AMf2H8e0c/4AAh8ufzRcZK0AAAAASUVORK5CYII=";

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, Buffer.from(ballPngBase64, "base64"));
