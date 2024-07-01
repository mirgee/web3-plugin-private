import { isHexPrefixed, isHexString } from 'web3-validator';
import { hexToBytes, isUint8Array, numberToHex } from 'web3-utils';
import { ToBytesInputTypes } from './types';

export const stripHexPrefix = (str: string): string => {
  if (typeof str !== 'string') throw new Error(`[stripHexPrefix] input must be type 'string', received ${typeof str}`);

  return isHexPrefixed(str) ? str.slice(2) : str;
};

export function padToEven(value: string): string {
  let a = value;

  if (typeof a !== 'string') {
    throw new Error(`[padToEven] value must be type 'string', received ${typeof a}`);
  }

  if (a.length % 2) a = `0${a}`;

  return a;
}

export const toUint8Array = function (v: ToBytesInputTypes): Uint8Array {
  // eslint-disable-next-line no-null/no-null
  if (v === null || v === undefined) {
    return new Uint8Array();
  }

  if (v instanceof Uint8Array) {
    return v;
  }

  if (v?.constructor?.name === 'Uint8Array') {
    return Uint8Array.from(v as unknown as Uint8Array);
  }

  if (Array.isArray(v)) {
    return Uint8Array.from(v);
  }

  if (typeof v === 'string') {
    if (!isHexString(v)) {
      throw new Error(
        `Cannot convert string to Uint8Array. only supports 0x-prefixed hex strings and this string was given: ${v}`
      );
    }
    return hexToBytes(padToEven(stripHexPrefix(v)));
  }

  if (typeof v === 'number') {
    return toUint8Array(numberToHex(v));
  }

  if (typeof v === 'bigint') {
    if (v < BigInt(0)) {
      throw new Error(`Cannot convert negative bigint to Uint8Array. Given: ${v}`);
    }
    let n = v.toString(16);
    if (n.length % 2) n = `0${n}`;
    return toUint8Array(`0x${n}`);
  }

  if (v.toArray) {
    // converts a BN to a Uint8Array
    return Uint8Array.from(v.toArray());
  }

  throw new Error('invalid type');
};

export function bigIntToUint8Array(num: bigint) {
  return toUint8Array(`0x${num.toString(16)}`);
}

export function assertIsUint8Array(input: unknown): asserts input is Uint8Array {
  if (!isUint8Array(input)) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const msg = `This method only supports Uint8Array but input was: ${input}`;
    throw new Error(msg);
  }
}

export function stripZeros<T extends Uint8Array | number[] | string>(a: T): T {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
  let first = a[0];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  while (a.length > 0 && first.toString() === '0') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, prefer-destructuring, @typescript-eslint/no-unsafe-call, no-param-reassign
    a = a.slice(1) as T;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, prefer-destructuring, @typescript-eslint/no-unsafe-member-access
    first = a[0];
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return a;
}

export const unpadUint8Array = function (a: Uint8Array): Uint8Array {
  assertIsUint8Array(a);
  return stripZeros(a);
};

export function bigIntToUnpaddedUint8Array(value: bigint): Uint8Array {
  return unpadUint8Array(bigIntToUint8Array(value));
}

export const zeros = function (bytes: number): Uint8Array {
	return new Uint8Array(bytes).fill(0);
};

export function base64ToUint8Array(base64: string | Uint8Array) {
  return typeof base64 === 'string' ? toUint8Array(Buffer.from(base64, 'base64')) : base64;
}

export function uint8ArrayToBase64(uint8array: string | Uint8Array): string {
  if (typeof uint8array === 'string') {
    return uint8array;
  } else {
    // Convert Uint8Array to a binary string
    const binaryString = Array.from(uint8array)
      .map((byte) => String.fromCharCode(byte))
      .join('');

    // Encode the binary string to base64
    return btoa(binaryString);
  }
}

