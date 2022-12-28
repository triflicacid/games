/** Clamp a number within a range */
export const clamp = (min, max, n) => {
  if (n < min) return min;
  if (n > max) return max;
  return n;
};

/** Get mouse coordinates over an element from an event */
export function extractCoords(event) {
  const box = event.target.getBoundingClientRect();
  return [event.clientX - box.left, event.clientY - box.top];
}

/** Return OffscreenCanvas containing the given image data */
export function loadImage(url) {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      const oc = new OffscreenCanvas(image.width, image.height);
      const ctx = oc.getContext('2d');
      ctx.drawImage(image, 0, 0);
      resolve(oc);
    };
    image.src = url;
  });
}

/** Given OffscreenCanvas, return OffscreenCanvas with section extractd from `oc` */
export function extractImage(oc, x, y, w, h) {
  let other = new OffscreenCanvas(w, h);
  let data = oc.getContext("2d").getImageData(x, y, w, h);
  other.getContext("2d").putImageData(data, 0, 0);
  return other;
}

/** Return object which will run a callback at `fps` times per second */
export function createAnimation() {
  let frameCount = 0, fps = 60;
  let _stop = false, _fpsInterval, _now, _then, _elapsed, _callback, _active = false;

  /** Start executing `callback` at `fps` times per second*/
  function start(callback = undefined) {
    if (_active) return false;
    _active = true;
    _fpsInterval = 1000 / fps;
    _then = Date.now();
    if (callback) _callback = callback;
    _animate();
    return true;
  }

  function _animate() {
    if (_stop) {
      _stop = false;
      _active = false;
      return;
    }

    // Calculate elapsed time since last loop
    _now = Date.now();
    _elapsed = _now - _then;

    // If enough time has elapsed, execute callback
    if (_elapsed > _fpsInterval) {
      // Get ready for next frame by setting then=now
      // Also, adjust for fpsInterval not being multiple of 16.67
      _then = _now - (_elapsed % _fpsInterval);

      _callback();
    }

    requestAnimationFrame(_animate);
  }

  /** Stop execution. Return number of times `callback` was executed */
  function stop() {
    _stop = true;
    let fc = frameCount;
    frameCount = 0;
    return fc;
  }

  return {
    getFrameCount: () => frameCount,
    getFPS: () => fps,
    setFPS: (n) => {
      fps = n;
      _fpsInterval = 1000 / fps
    },
    setFunction: (f) => void (_callback = f),
    isActive: () => _active,
    start,
    stop,
  };
}

/**
 * Convert HSL to RGB
 * @params h: hue range [0, 360]
 * @params s: saturation range [0, 100]
 * @params l: lightness range [0, 100]
 * @returns rgb: [r [0, 255], g [0, 255], b [0, 255]]
 */
export function hsl2rgb(h, s, l) {
  h = clamp(0, 360, h % 360);
  s = clamp(0, 100, s) / 100;
  l = clamp(0, 100, l) / 100;
  let c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, rgb;
  if (0 <= h && h < 60) rgb = [c, x, 0];
  else if (60 <= h && h < 120) rgb = [x, c, 0];
  else if (120 <= h && h < 180) rgb = [0, c, x];
  else if (180 <= h && h < 240) rgb = [0, x, c];
  else if (240 <= h && h < 300) rgb = [x, 0, c];
  else if (300 <= h && h < 360) rgb = [c, 0, x];
  else return [0, 0, 0];
  return rgb.map(n => (n + m) * 255);
}

export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Delay for `ms` milliseconds */
export async function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export function toTitleCase(string) {
  return string.split(" ").map(str => str[0].toUpperCase() + str.substring(1).toLowerCase()).join(" ");
}