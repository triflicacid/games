export class Font {
  constructor() {
    this.style = "normal";
    this.variant = "normal";
    this.weight = "normal";
    this.size = 10;
    this.sizeUnits = "px";
    this.family = "sans-serif";
    this.toDefault();
  }
  /** Return string representation of font (CSS font string) */
  toString() {
    return `${this.style} ${this.variant} ${this.weight} ${this.size}${this.sizeUnits} ${this.family}`;
  }
  /** Apply font to a Canvas 2D Context */
  apply(ctx) {
    ctx.font = this.toString();
  }
  /** Reset Font to default */
  toDefault() {
    this.style = "normal";
    this.variant = "normal";
    this.weight = "normal";
    this.size = 10;
    this.sizeUnits = 'px';
    this.family = "sans-serif";
  }
  /** Return copy of this font */
  clone() {
    const font = new Font();
    font.style = this.style;
    font.variant = this.variant;
    font.weight = this.weight;
    font.size = this.size;
    font.sizeUnits = this.sizeUnits;
    font.family = this.family;
    return font;
  }
  /** @chainable option to set properties */
  set(prop, value) {
    if (prop in this) {
      this[prop] = value;
      return this;
    }
    else {
      throw new Error(`Property '${prop}' does not exist`);
    }
  }
  /** Get new Font from a CSS font string */
  static fromString(string) {
    const div = document.createElement("div"), font = new Font();
    div.style.font = string;
    font.style = div.style.fontStyle;
    font.variant = div.style.fontVariant;
    font.weight = div.style.fontWeight;
    let [size, units] = div.style.fontSize.split(/(?<=[0-9\.])(?=[A-Za-z])/);
    font.size = +size;
    font.sizeUnits = units !== null && units !== void 0 ? units : 'px';
    font.family = div.style.fontFamily;
    return font;
  }
}