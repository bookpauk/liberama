const hex = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;

export function colorPanStyle(bgColor) {
    return `width: 30px; height: 30px; border: 1px solid black; border-radius: 4px; background-color: ${bgColor}`;
}

export function isHexColor(value) {
    return hex.test(value);
}
