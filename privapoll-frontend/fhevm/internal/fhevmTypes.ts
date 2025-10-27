import type { FhevmInstance, FhevmInstanceConfig } from "../fhevmTypes";

export type { FhevmInstance, FhevmInstanceConfig };

export type FhevmInitSDKOptions = {
  // Add any init options here
};

export type FhevmInitSDKType = (options?: FhevmInitSDKOptions) => Promise<boolean>;
export type FhevmLoadSDKType = () => Promise<void>;

export type FhevmRelayerSDKType = {
  initSDK: (options?: FhevmInitSDKOptions) => Promise<boolean>;
  createInstance: (config: FhevmInstanceConfig) => Promise<FhevmInstance>;
  SepoliaConfig: {
    aclContractAddress: `0x${string}`;
    gatewayUrl: string;
    relayerUrl: string;
    chainId: number;
  };
  __initialized__?: boolean;
};

export type FhevmWindowType = Window & {
  relayerSDK: FhevmRelayerSDKType;
};

