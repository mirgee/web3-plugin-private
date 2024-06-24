export function hexToBase64(str: string) {
  return Buffer.from(str, "hex").toString("base64");
};

export function base64toHex(str: string) {
  return Buffer.from(str, "base64").toString("hex");
};
