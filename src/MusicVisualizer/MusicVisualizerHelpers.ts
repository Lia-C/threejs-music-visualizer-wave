export const fractionate = (val, minVal, maxVal) => {
  return (val - minVal) / (maxVal - minVal);
};

export const modulate = (val, minVal, maxVal, outMin, outMax) => {
  let fr = fractionate(val, minVal, maxVal);
  let delta = outMax - outMin;
  return outMin + fr * delta;
};

export const avg = (arr) => {
  let total = arr.reduce(function (sum, b) {
    return sum + b;
  });
  return total / arr.length;
};

export const max = (arr) => {
  return arr.reduce(function (a, b) {
    return Math.max(a, b);
  });
};

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
 export const hslToRgb = (h, s, l) => {
  let r, g, b;

  if (s == 0){
      r = g = b = l; // achromatic
  } else {
      let hue2rgb = (p, q, t) => {
          if(t < 0) t += 1;
          if(t > 1) t -= 1;
          if(t < 1/6) return p + (q - p) * 6 * t;
          if(t < 1/2) return q;
          if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
      }

      let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      let p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}