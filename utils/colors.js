//text colors for terminal coloring
const black = '\x1b[30m';
const red = '\x1b[31m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const blue = '\x1b[34m';
const magenta = '\x1b[35m';
const cyan = '\x1b[36m';
const white = '\x1b[37m';
const reset = '\x1b[0m';
//text colors for terminal coloring
const blackBg = '\x1b[40m';
const redBg = '\x1b[41m';
const greenBg = '\x1b[42m';
const yellowBg = '\x1b[43m';
const blueBg = '\x1b[44m';
const magentaBg = '\x1b[45m';
const cyanBg = '\x1b[46m';
const whiteBg = '\x1b[47m';
const resetBg = '\x1b[0m';
//text colors for terminal coloring
const blackBright = '\x1b[90m';
const redBright = '\x1b[91m';
const greenBright = '\x1b[92m';
const yellowBright = '\x1b[93m';
const blueBright = '\x1b[94m';
const magentaBright = '\x1b[95m';
const cyanBright = '\x1b[96m';
const whiteBright = '\x1b[97m';
const resetBright = '\x1b[0m';
//text colors for terminal coloring
const blackBrightBg = '\x1b[100m';
const redBrightBg = '\x1b[101m';
const greenBrightBg = '\x1b[102m';
const yellowBrightBg = '\x1b[103m';
const blueBrightBg = '\x1b[104m';
const magentaBrightBg = '\x1b[105m';
const cyanBrightBg = '\x1b[106m';
const whiteBrightBg = '\x1b[107m';
const resetBrightBg = '\x1b[0m';

//make a function to print text in color
export default (text, color, bg) => {
    //if bg is true, print in bg color
    if (bg) {
        return `${eval(bg)}${text}${resetBg}`;
    }
    //if bg is false, print in color
    else {
        return `${eval(color)}${text}${reset}`;
    }
}