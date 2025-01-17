import type {
  Layout,
  LayoutToType,
  CustomizableBytes} from "@wormhole-foundation/sdk-base";
import {
  customizableBytes,
} from "@wormhole-foundation/sdk-base";

import { universalAddressItem, chainItem } from "../../layout-items";
import type { NamedPayloads, RegisterPayloadTypes} from "../../vaa";
import { registerPayloadTypes } from "../../vaa";

export const trimmedAmountLayout = [
  { name: "decimals", binary: "uint", size: 1 },
  { name: "amount", binary: "uint", size: 8 },
] as const satisfies Layout;

export type TrimmedAmount = LayoutToType<typeof trimmedAmountLayout>;

export type Prefix = readonly [number, number, number, number];

const prefixItem = (prefix: Prefix) =>
  ({ name: "prefix", binary: "bytes", custom: Uint8Array.from(prefix), omit: true }) as const;

export const nativeTokenTransferLayout = [
  prefixItem([0x99, 0x4e, 0x54, 0x54]),
  { name: "trimmedAmount", binary: "bytes", layout: trimmedAmountLayout },
  { name: "sourceToken", ...universalAddressItem },
  { name: "recipientAddress", ...universalAddressItem },
  { name: "recipientChain", ...chainItem() }, //TODO restrict to supported chains?
] as const satisfies Layout;

export type NativeTokenTransfer = LayoutToType<typeof nativeTokenTransferLayout>;

export const transceiverMessageLayout = <
  const MP extends CustomizableBytes = undefined,
  const TP extends CustomizableBytes = undefined,
>(
  prefix: Prefix,
  nttManagerPayload?: MP,
  transceiverPayload?: TP,
) =>
  [
    prefixItem(prefix),
    { name: "sourceNttManager", ...universalAddressItem },
    { name: "recipientNttManager", ...universalAddressItem },
    customizableBytes({ name: "nttManagerPayload", lengthSize: 2 }, nttManagerPayload),
    customizableBytes({ name: "transceiverPayload", lengthSize: 2 }, transceiverPayload),
  ] as const satisfies Layout;

export type TransceiverMessage<
  MP extends CustomizableBytes = undefined,
  TP extends CustomizableBytes = undefined,
> = LayoutToType<ReturnType<typeof transceiverMessageLayout<MP, TP>>>;

export const nttManagerMessageLayout = <const P extends CustomizableBytes = undefined>(
  customPayload?: P,
) =>
  [
    { name: "id", binary: "bytes", size: 32 },
    { name: "sender", ...universalAddressItem },
    customizableBytes({ name: "payload", lengthSize: 2 }, customPayload),
  ] as const satisfies Layout;

export type NttManagerMessage<P extends CustomizableBytes = undefined> = LayoutToType<
  ReturnType<typeof nttManagerMessageLayout<P>>
>;

export const wormholeTransceiverMessageLayout = <MP extends CustomizableBytes = undefined>(
  nttManagerPayload?: MP,
) => transceiverMessageLayout([0x99, 0x45, 0xff, 0x10], nttManagerPayload, new Uint8Array(0));

export type WormholeTransceiverMessage<MP extends CustomizableBytes = undefined> = LayoutToType<
  ReturnType<typeof wormholeTransceiverMessageLayout<MP>>
>;

const wormholeNativeTokenTransferLayout = wormholeTransceiverMessageLayout(
  nttManagerMessageLayout(nativeTokenTransferLayout),
);

export const nttNamedPayloads = [
  ["WormholeTransfer", wormholeNativeTokenTransferLayout],
] as const satisfies NamedPayloads;

// factory registration:
import "../../registry";
declare module "../../registry" {
  export namespace WormholeRegistry {
    interface PayloadLiteralToLayoutMapping
      extends RegisterPayloadTypes<"NTT", typeof nttNamedPayloads> {}
  }
}

registerPayloadTypes("NTT", nttNamedPayloads);
