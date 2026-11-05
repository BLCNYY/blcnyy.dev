"use client";

// How far a phone is tilted from the way it's being held, from -1 to 1 on
// each screen axis. The resting angle drifts toward the current one, so
// holding the phone still in any position slowly counts as level again.
export const tilt = { x: 0, y: 0, active: false };

const TILT_RANGE_DEGREES = 28;
const REST_DRIFT = 0.004;

type PermissionedOrientationEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

let listening = false;
let permissionAsked = false;
let restX: number | null = null;
let restY: number | null = null;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function screenAngle() {
  return window.screen.orientation?.angle ?? 0;
}

function handleOrientation(event: DeviceOrientationEvent) {
  if (event.beta === null || event.gamma === null) {
    return;
  }

  // Turn the device's axes into the screen's, whichever way it's rotated.
  const { beta, gamma } = event;
  const angle = ((screenAngle() % 360) + 360) % 360;
  const [x, y] =
    angle === 90
      ? [beta, -gamma]
      : angle === 270
        ? [-beta, gamma]
        : angle === 180
          ? [-gamma, -beta]
          : [gamma, beta];

  restX = restX === null ? x : restX + (x - restX) * REST_DRIFT;
  restY = restY === null ? y : restY + (y - restY) * REST_DRIFT;
  tilt.x = clamp((x - restX) / TILT_RANGE_DEGREES, -1, 1);
  tilt.y = clamp((y - restY) / TILT_RANGE_DEGREES, -1, 1);
  tilt.active = true;
}

function listen() {
  if (listening) {
    return;
  }

  listening = true;
  window.addEventListener("deviceorientation", handleOrientation);
}

function isTouchDevice() {
  return window.matchMedia("(pointer: coarse)").matches;
}

function canAskForTilt() {
  const OrientationEvent = window.DeviceOrientationEvent as
    | PermissionedOrientationEvent
    | undefined;

  return typeof OrientationEvent?.requestPermission === "function";
}

// Listens on phones and tablets right away. Where the browser needs
// permission first (iPhones), no events arrive until requestTiltPermission
// runs inside a tap.
export function startTilt() {
  if (isTouchDevice() && window.DeviceOrientationEvent) {
    listen();
  }
}

export function requestTiltPermission() {
  if (!isTouchDevice() || tilt.active || permissionAsked || !canAskForTilt()) {
    return;
  }

  permissionAsked = true;
  const OrientationEvent = window.DeviceOrientationEvent as PermissionedOrientationEvent;

  OrientationEvent.requestPermission?.()
    .then((state) => {
      if (state === "granted") {
        listen();
      }
    })
    .catch(() => {});
}
