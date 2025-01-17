import type {
  Connection,
  PublicKeyInitData,
  TransactionInstruction,
} from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import { createReadOnlyTokenBridgeProgramInterface } from '../program';
import { utils as coreUtils } from '@wormhole-foundation/sdk-solana-core';
import { deriveSplTokenMetadataKey } from '../../splMetadata';
import { deriveTokenBridgeConfigKey, deriveWrappedMetaKey } from '../accounts';

export function createAttestTokenInstruction(
  connection: Connection,
  tokenBridgeProgramId: PublicKeyInitData,
  wormholeProgramId: PublicKeyInitData,
  payer: PublicKeyInitData,
  mint: PublicKeyInitData,
  message: PublicKeyInitData,
  nonce: number,
): TransactionInstruction {
  const methods = createReadOnlyTokenBridgeProgramInterface(
    tokenBridgeProgramId,
    connection,
  ).methods.attestToken(nonce);

  console.log(
    getAttestTokenAccounts(
      tokenBridgeProgramId,
      wormholeProgramId,
      payer,
      mint,
      message,
    ),
  );
  // @ts-ignore
  return methods._ixFn(...methods._args, {
    accounts: getAttestTokenAccounts(
      tokenBridgeProgramId,
      wormholeProgramId,
      payer,
      mint,
      message,
    ) as any,
    signers: undefined,
    remainingAccounts: undefined,
    preInstructions: undefined,
    postInstructions: undefined,
  });
}

export interface AttestTokenAccounts {
  payer: PublicKey;
  config: PublicKey;
  mint: PublicKey;
  wrappedMeta: PublicKey;
  splMetadata: PublicKey;
  wormholeBridge: PublicKey;
  wormholeMessage: PublicKey;
  wormholeEmitter: PublicKey;
  wormholeSequence: PublicKey;
  wormholeFeeCollector: PublicKey;
  clock: PublicKey;
  rent: PublicKey;
  systemProgram: PublicKey;
  wormholeProgram: PublicKey;
}

export function getAttestTokenAccounts(
  tokenBridgeProgramId: PublicKeyInitData,
  wormholeProgramId: PublicKeyInitData,
  payer: PublicKeyInitData,
  mint: PublicKeyInitData,
  message: PublicKeyInitData,
): AttestTokenAccounts {
  const {
    bridge: wormholeBridge,
    emitter: wormholeEmitter,
    sequence: wormholeSequence,
    feeCollector: wormholeFeeCollector,
    clock,
    rent,
    systemProgram,
  } = coreUtils.getPostMessageAccounts(
    wormholeProgramId,
    payer,
    message,
    tokenBridgeProgramId,
  );
  return {
    payer: new PublicKey(payer),
    config: deriveTokenBridgeConfigKey(tokenBridgeProgramId),
    mint: new PublicKey(mint),
    wrappedMeta: deriveWrappedMetaKey(tokenBridgeProgramId, mint),
    splMetadata: deriveSplTokenMetadataKey(mint),
    wormholeBridge,
    wormholeMessage: new PublicKey(message),
    wormholeEmitter,
    wormholeSequence,
    wormholeFeeCollector,
    clock,
    rent,
    systemProgram,
    wormholeProgram: new PublicKey(wormholeProgramId),
  };
}
