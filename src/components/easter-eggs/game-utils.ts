export function createGlowSprite(rgb: string, size = 48) {
  const sprite = document.createElement("canvas");
  sprite.width = size;
  sprite.height = size;
  const context = sprite.getContext("2d");

  if (context) {
    const radius = size / 2;
    const gradient = context.createRadialGradient(radius, radius, 0, radius, radius, radius);
    gradient.addColorStop(0, `rgba(${rgb}, 1)`);
    gradient.addColorStop(0.2, `rgba(${rgb}, 0.85)`);
    gradient.addColorStop(0.5, `rgba(${rgb}, 0.25)`);
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }

  return sprite;
}

export function readBest(key: string) {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    return Number(window.localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(key: string, value: number) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {}
}
