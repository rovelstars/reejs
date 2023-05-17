let processCwd = globalThis?.process?.cwd?.() || globalThis?.Deno?.cwd?.() || "";
