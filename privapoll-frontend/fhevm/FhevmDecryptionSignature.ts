import { ethers } from "ethers";
import type { FhevmInstance, FhevmDecryptionSignatureType, EIP712Type } from "./fhevmTypes";

export class FhevmDecryptionSignature {
  #publicKey: string;
  #privateKey: string;
  #signature: string;
  #startTimestamp: number;
  #durationDays: number;
  #userAddress: `0x${string}`;
  #contractAddresses: `0x${string}`[];
  #eip712: EIP712Type;

  constructor(params: FhevmDecryptionSignatureType) {
    this.#publicKey = params.publicKey;
    this.#privateKey = params.privateKey;
    this.#signature = params.signature;
    this.#startTimestamp = params.startTimestamp;
    this.#durationDays = params.durationDays;
    this.#userAddress = params.userAddress;
    this.#contractAddresses = params.contractAddresses;
    this.#eip712 = params.eip712;
  }

  get publicKey() { return this.#publicKey; }
  get privateKey() { return this.#privateKey; }
  get signature() { return this.#signature; }
  get startTimestamp() { return this.#startTimestamp; }
  get durationDays() { return this.#durationDays; }
  get userAddress() { return this.#userAddress; }
  get contractAddresses() { return this.#contractAddresses; }
  get eip712() { return this.#eip712; }

  static async loadOrSign(
    instance: FhevmInstance,
    contractAddresses: string[],
    signer: ethers.Signer,
    storageKey?: string
  ): Promise<FhevmDecryptionSignature | null> {
    const userAddress = (await signer.getAddress()) as `0x${string}`;
    
    // Try to load from localStorage
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const data: FhevmDecryptionSignatureType = JSON.parse(stored);
          // Check if signature is still valid
          const now = Math.floor(Date.now() / 1000);
          const expiryTime = data.startTimestamp + data.durationDays * 86400;
          if (now < expiryTime && data.userAddress === userAddress) {
            return new FhevmDecryptionSignature(data);
          }
        } catch (err) {
          console.warn("Failed to load stored signature:", err);
        }
      }
    }

    // Generate new signature
    try {
      const keyPair = instance.generateKeypair();
      const publicKey = keyPair.publicKey;
      const privateKey = keyPair.privateKey;

      const startTimestamp = Math.floor(Date.now() / 1000);
      const durationDays = 365;

      const eip712 = instance.createEIP712(
        publicKey,
        contractAddresses,
        startTimestamp,
        durationDays
      );

      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

      const sig = new FhevmDecryptionSignature({
        publicKey,
        privateKey,
        contractAddresses: contractAddresses as `0x${string}`[],
        startTimestamp,
        durationDays,
        signature,
        eip712: eip712 as EIP712Type,
        userAddress,
      });

      // Store to localStorage
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify({
          publicKey,
          privateKey,
          contractAddresses,
          startTimestamp,
          durationDays,
          signature,
          eip712,
          userAddress,
        }));
      }

      return sig;
    } catch (err) {
      console.error("Failed to create signature:", err);
      return null;
    }
  }
}

