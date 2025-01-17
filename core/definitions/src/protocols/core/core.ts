import type { Chain, Network, Platform } from "@wormhole-foundation/sdk-base";
import type { AccountAddress } from "../../address";
import type { WormholeMessageId } from "../../attestation";
import type { EmptyPlatformMap } from "../../protocol";
import type { TxHash } from "../../types";
import type { UnsignedTransaction } from "../../unsignedTransaction";
import type { VAA } from "../../vaa";

import "../../registry";
declare module "../../registry" {
  export namespace WormholeRegistry {
    interface ProtocolToPlatformMapping {
      WormholeCore: EmptyPlatformMap<Platform, "WormholeCore">;
    }
  }
}

/**
 * WormholeCore provides a consistent interface to interact
 * with the Wormhole core messaging protocol.
 *
 */
export interface WormholeCore<N extends Network, C extends Chain> {
  /** Get the fee for publishing a message */
  getMessageFee(): Promise<bigint>;

  /** Get the current guardian set index */
  getGuardianSetIndex(): Promise<number>;

  /**
   * Publish a message
   *
   * @param sender The address of the sender
   * @param message The message to send
   * @param nonce A number that may be set if needed for the application, may be 0 if unneeded
   * @param consistencyLevel The consistency level to reach before the guardians should sign the message
   *  see {@link https://docs.wormhole.com/wormhole/reference/glossary#consistency-level | the docs} for more information
   *
   * @returns a stream of unsigned transactions to be signed and submitted on chain
   */
  publishMessage(
    sender: AccountAddress<C>,
    message: string | Uint8Array,
    nonce: number,
    consistencyLevel: number,
  ): AsyncGenerator<UnsignedTransaction<N, C>>;

  /**
   * Verify a VAA against the core contract
   * @param sender the sender of the transaction
   * @param vaa the VAA to verify
   *
   * @returns a stream of unsigned transactions to be signed and submitted on chain
   */
  verifyMessage(sender: AccountAddress<C>, vaa: VAA): AsyncGenerator<UnsignedTransaction<N, C>>;

  /**
   * Parse a transaction to get its message id
   *
   * @param txid the transaction hash to parse
   *
   * @returns the message ids produced by the transaction
   */
  parseTransaction(txid: TxHash): Promise<WormholeMessageId[]>;

  /**
   * Parse a transaction to get the VAA message it produced
   *
   * @param txid the transaction hash to parse
   *
   * @returns the VAA message produced by the transaction
   */
  parseMessages(txid: TxHash): Promise<VAA[]>;
}
