/** Split an OffscreenCanvas into [red, green, blue, black] components */
export function seperateComponents(oc) {
    const comps = [], w = oc.width, h = oc.height;
    const occtx = oc.getContext("2d"), pixels = occtx.getImageData(0, 0, w, h).data;

    for (let i = 0; i < 4; i++) {
        const canvas = new OffscreenCanvas(w, h), ctx = canvas.getContext("2d");
        const idata = ctx.getImageData(0, 0, w, h);
        for (let j = 0; j < pixels.length; j += 4) {
            idata.data[j] = i === 0 ? pixels[j] : 0;
            idata.data[j + 1] = i === 1 ? pixels[j + 1] : 0;
            idata.data[j + 2] = i === 2 ? pixels[j + 2] : 0;
            idata.data[j + 3] = pixels[j + 3];
        }
        ctx.putImageData(idata, 0, 0);
        comps[i] = canvas;
    }

    return comps;
}

function _tint(original, w, h, components, r, g, b) {
    const canvas = new OffscreenCanvas(w, h), ctx = canvas.getContext("2d");

    // Black
    ctx.globalAlpha = 1;
    ctx.globalCompositionOperation = "copy";
    ctx.drawImage(components[3], 0, 0);

    ctx.globalCompositionOperation = "lighter";
    // Red
    if (r > 0) {
        ctx.globalAlpha = r / 255;
        ctx.drawImage(components[0], 0, 0);
    }
    // Green
    if (g > 0) {
        ctx.globalAlpha = g / 255;
        ctx.drawImage(components[1], 0, 0);
    }
    // Blue
    if (b > 0) {
        ctx.globalAlpha = b / 255;
        ctx.drawImage(components[2], 0, 0);
    }

    return canvas;
}

/** Given an OffscreenCanvas, tint it and return it */
export function tint(oc, r, g, b) {
    const comps = seperateComponents(oc);
    return _tint(oc, oc.width, oc.height, comps, r, g, b);
}