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