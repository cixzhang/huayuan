const ESC = '\x1b';
const CSI = `${ESC}[`;

// Cursor movement
export const moveTo = (row: number, col: number): string => `${CSI}${row + 1};${col + 1}H`;
export const moveUp = (n = 1): string => `${CSI}${n}A`;
export const moveDown = (n = 1): string => `${CSI}${n}B`;
export const moveRight = (n = 1): string => `${CSI}${n}C`;
export const moveLeft = (n = 1): string => `${CSI}${n}D`;
export const saveCursor = `${CSI}s`;
export const restoreCursor = `${CSI}u`;
export const hideCursor = `${CSI}?25l`;
export const showCursor = `${CSI}?25h`;

// Screen
export const clearScreen = `${CSI}2J`;
export const clearLine = `${CSI}2K`;
export const enterAltBuffer = `${CSI}?1049h`;
export const exitAltBuffer = `${CSI}?1049l`;

// Colors (256-color mode)
export const fg = (code: number): string => `${CSI}38;5;${code}m`;
export const bg = (code: number): string => `${CSI}48;5;${code}m`;
export const reset = `${CSI}0m`;
export const bold = `${CSI}1m`;
export const dim = `${CSI}2m`;
export const italic = `${CSI}3m`;
export const underline = `${CSI}4m`;
export const inverse = `${CSI}7m`;

// Named colors
export const fgRgb = (r: number, g: number, b: number): string => `${CSI}38;2;${r};${g};${b}m`;
export const bgRgb = (r: number, g: number, b: number): string => `${CSI}48;2;${r};${g};${b}m`;

// Common color shortcuts
export const colors = {
  black: fg(0),
  red: fg(1),
  green: fg(2),
  yellow: fg(3),
  blue: fg(4),
  magenta: fg(5),
  cyan: fg(6),
  white: fg(7),
  gray: fg(8),
  brightGreen: fg(10),
  brightYellow: fg(11),
  brightCyan: fg(14),

  bgBlack: bg(0),
  bgRed: bg(1),
  bgGreen: bg(2),
  bgYellow: bg(3),
  bgBlue: bg(4),
  bgBrown: bg(130),
  bgDarkGreen: bg(22),
  bgDarkBrown: bg(94),
} as const;
