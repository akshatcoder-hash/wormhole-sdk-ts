import type { Chain } from "@wormhole-foundation/sdk-base";
import type { TokenAddress } from "../../types";

import type { Platform } from "@wormhole-foundation/sdk-base";
import type { EmptyPlatformMap } from "../../protocol";

import "../../registry";
declare module "../../registry" {
  export namespace WormholeRegistry {
    interface ProtocolToPlatformMapping {
      Relayer: EmptyPlatformMap<Platform, "Relayer">;
    }
  }
}

export interface Relayer {
  relaySupported(chain: Chain): boolean;
  getRelayerFee(
    sourceChain: Chain,
    destChain: Chain,
    tokenId: TokenAddress<Chain>,
  ): Promise<bigint>;
  // TODO: What should this be named?
  // I don't think it should return an UnisgnedTransaction
  // rather it should take some signing callbacks and
  // a ref to track the progress
  startTransferWithRelay(
    token: TokenAddress<Chain>,
    amount: bigint,
    toNativeToken: string,
    sendingChain: Chain,
    senderAddress: string,
    recipientChain: Chain,
    recipientAddress: string,
    overrides?: any,
  ): Promise<any>;
  calculateNativeTokenAmt(
    destChain: Chain,
    tokenId: TokenAddress<Chain>,
    amount: bigint,
    walletAddress: string,
  ): Promise<bigint>;
  calculateMaxSwapAmount(
    destChain: Chain,
    tokenId: TokenAddress<Chain>,
    walletAddress: string,
  ): Promise<bigint>;
}
