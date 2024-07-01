import { Common } from 'web3-eth-accounts';
import { Address } from './address';
import { HexString, Numbers, Uint } from 'web3-types';

export type PrefixedHexString = string;

export type Base64String = string;

export interface TransformableToArray {
  toArray(): Uint8Array;
}

export type ToBytesInputTypes =
  | PrefixedHexString
  | number
  | bigint
  | Uint8Array
  | number[]
  | TransformableToArray
  | null
  | undefined;

// export type Restriction = 'restricted' | 'unrestricted';
export type Restriction = string;

export interface TxOptions {
  common?: Common;
  freeze?: boolean;
  allowUnlimitedInitCodeSize?: boolean;
}

export type Uint8ArrayLike = Uint8Array | number[] | number | bigint | PrefixedHexString;

export type PrivateTxData = {
  nonce?: Numbers | Uint8Array;
  gasPrice?: Numbers | Uint8Array | null;
  gasLimit?: Numbers | Uint8Array;
  to?: Address | Uint8Array | HexString;
  value?: Numbers | Uint8Array;
  data?: Uint8ArrayLike;
  v?: Numbers | Uint8Array;
  r?: Numbers | Uint8Array;
  s?: Numbers | Uint8Array;
  type?: Numbers;
  privateFrom: Base64String | Uint8Array;
  privateFor?: Base64String[] | Uint8Array[];
  privacyGroupId?: Base64String | Uint8Array;
  restriction: Restriction | Uint8Array;
};

export type PrivateTxValuesArray = [
  Uint8Array | null, // nonce
  Uint8Array | null, // gasPrice
  Uint8Array | null, // gasLimit
  Uint8Array | null, // to
  Uint8Array | null, // value
  Uint8Array | null, // data
  Uint8Array | null, // v
  Uint8Array | null, // r
  Uint8Array | null, // s
  Uint8Array, // privateFrom
  Base64String | null, // privacyGroupId
  Restriction | null, // restriction
  ...Uint8Array[] // privateFor
];
