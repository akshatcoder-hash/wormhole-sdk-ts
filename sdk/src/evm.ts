/// <reference path="../../platforms/evm/dist/esm/address.d.ts" />
import type { Network, PlatformDefinition } from ".";
/** Platform and protocol definitions for Evm */
export const evm = async (): Promise<PlatformDefinition<Network, "Evm">> => {
  const _evm = await import("@wormhole-foundation/sdk-evm");
  return {
    Address: _evm.EvmAddress,
    ChainContext: _evm.EvmChain,
    Platform: _evm.EvmPlatform,
    Signer: _evm.EvmNativeSigner,
    getSigner: _evm.getEvmSignerForKey,
    protocols: {
      core: () => import("@wormhole-foundation/sdk-evm-core"),
      tokenbridge: () => import("@wormhole-foundation/sdk-evm-tokenbridge"),
      portico: () => import("@wormhole-foundation/sdk-evm-portico"),
      cctp: () => import("@wormhole-foundation/sdk-evm-cctp"),
    },
    // @ts-ignore
    getSignerForSigner: _evm.getEvmSignerForSigner,
  };
};
