/**
 * Contents of this file is copied from @sphereon/ssi-types
 */
import { VerifiablePresentationDto } from '../dto/common/presentation-meta.dto'

export interface ICredential {
  // If exp is present, the UNIX timestamp MUST be converted to an [XMLSCHEMA11-2] date-time, and MUST be used to set the value of the expirationDate property of credentialSubject of the new JSON object.
  expirationDate?: string
  // If iss is present, the value MUST be used to set the issuer property of the new credential JSON object or the holder property of the new presentation JSON object.
  issuer: string | IIssuer
  // If nbf is present, the UNIX timestamp MUST be converted to an [XMLSCHEMA11-2] date-time, and MUST be used to set the value of the issuanceDate property of the new JSON object.
  issuanceDate: string
  // If sub is present, the value MUST be used to set the value of the id property of credentialSubject of the new credential JSON object.
  credentialSubject: ICredentialSubject
  // If jti is present, the value MUST be used to set the value of the id property of the new JSON object.
  id: string
  '@context': ICredentialContextType[] | ICredentialContextType
  credentialStatus?: ICredentialStatus
  credentialSchema?: undefined | ICredentialSchemaType | ICredentialSchemaType[]
  description?: string
  name?: string
  type: string[]

  [x: string]: unknown
}

export interface ICredentialSubject {
  id?: string

  [x: string]: unknown
}

export type ICredentialContextType = ICredentialContext | string

export interface ICredentialContext {
  name?: string
  did?: string
  [x: string]: unknown
}

export type ICredentialSchemaType = ICredentialSchema | string

export interface ICredentialSchema {
  id: string
  type?: string
}

export interface IProof {
  type: IProofType | string // The proof type
  created: string // The ISO8601 date-time string for creation
  proofPurpose: IProofPurpose | string // The specific intent for the proof
  verificationMethod: string // A set of parameters required to independently verify the proof
  challenge?: string // A challenge to protect against replay attacks
  domain?: string // A string restricting the (usage of a) proof to the domain and protects against replay attacks
  proofValue?: string // One of any number of valid representations of proof values
  jws?: string // JWS based proof
  nonce?: string // Similar to challenge. A nonce to protect against replay attacks, used in some ZKP proofs
  requiredRevealStatements?: string[] // The parts of the proof that must be revealed in a derived proof

  [x: string]: string | string[] | undefined
}

export interface ICredentialStatus {
  id: string
  type: string
}

export interface IIssuer {
  id: string

  [x: string]: unknown
}

export interface IHasProof {
  proof: IProof
}

export type IVerifiableCredential = ICredential & IHasProof

export interface IPresentation {
  '@context': ICredentialContextType | ICredentialContextType[]
  type: string[]
  verifiableCredential: IVerifiableCredential[]
  presentation_submission?: PresentationSubmission
  holder?: string
}

export type IVerifiablePresentation = IPresentation & IHasProof

export interface PresentationSubmission {
  /**
   * A UUID or some other unique ID to identify this Presentation Submission
   */
  id: string
  /**
   * A UUID or some other unique ID to identify this Presentation Definition
   */
  definition_id: string
  /**
   * List of descriptors of how the claims are being mapped to presentation definition
   */
  descriptor_map: Array<Descriptor>
}

export interface Descriptor {
  /**
   * ID to identify the descriptor from Presentation Definition Input Descriptor it coresponds to.
   */
  id: string
  /**
   * The path where the verifiable credential is located in the presentation submission json
   */
  path: string
  path_nested?: Descriptor
  /**
   * The Proof or JWT algorith that the proof is in
   */
  format: string
}

export enum IntentType {
  GET_COMPLIANCE_PARTICIPANT = 'GET_COMPLIANCE_PARTICIPANT',
  ONBOARD_PARTICIPANT = 'ONBOARD_PARTICIPANT',
  GET_COMPLIANCE_SERVICE_OFFERING = 'GET_COMPLIANCE_SERVICE_OFFERING',
  ONBOARD_SERVICE_OFFERING = 'ONBOARD_SERVICE_OFFERING',
  GET_ECOSYSTEM_COMPLIANCE_PARTICIPANT = 'GET_ECOSYSTEM_COMPLIANCE_PARTICIPANT',
  ONBOARD_ECOSYSTEM_PARTICIPANT = 'ONBOARD_ECOSYSTEM_PARTICIPANT',
  GET_ECOSYSTEM_COMPLIANCE_SERVICE_OFFERING = 'GET_ECOSYSTEM_COMPLIANCE_SERVICE_OFFERING',
  ONBOARD_ECOSYSTEM_SERVICE_OFFERING = 'ONBOARD_ECOSYSTEM_SERVICE_OFFERING'
}

export enum ServiceOfferingType {
  DcatDataSet = 'dcat:Dataset',
  AutoscaledVirtualMachine = 'AutoscaledVirtualMachine',
  ComputeFunction = 'ComputeFunction',
  IdentityAccessManagementOffering = 'IdentityAccessManagementOffering',
  VirtualMachine = 'VirtualMachine',
  InstantiatedVirtualResource = 'InstantiatedVirtualResource',
  VerifiableCredentialWallet = 'VerifiableCredentialWallet',
  PlatformOffering = 'PlatformOffering',
  Location = 'Location',
  ObjectStorageOffering = 'ObjectStorageOffering',
  BigData = 'BigData',
  InfrastructureOffering = 'InfrastructureOffering',
  Connectivity = 'Connectivity',
  ServiceOffering = 'ServiceOffering',
  Database = 'Database',
  WalletOffering = 'WalletOffering',
  ImageRegistryOffering = 'ImageRegistryOffering',
  IdentityFederation = 'IdentityFederation',
  SoftwareOffering = 'SoftwareOffering',
  LinkConnectivity = 'LinkConnectivity',
  PhysicalConnectivity = 'PhysicalConnectivity',
  Container = 'Container',
  Interconnection = 'Interconnection',
  StorageOffering = 'StorageOffering',
  AutoscaledContainer = 'AutoscaledContainer',
  Catalogue = 'Catalogue',
  Compute = 'Compute',
  NetworkOffering = 'NetworkOffering',
  NetworkConnectivity = 'NetworkConnectivity',
  LocatedServiceOffering = 'LocatedServiceOffering',
  BareMetal = 'BareMetal',
  FileStorageOffering = 'FileStorageOffering',
  IdentityProvider = 'IdentityProvider',
  Orchestration = 'Orchestration',
  BlockStorageOffering = 'BlockStorageOffering',
  DigitalIdentityWallet = 'DigitalIdentityWallet'
}

export class TypedVerifiablePresentation {
  constructor(intent: IntentType, typedVerifiableCredentials: TypedVerifiableCredential[], verifiablePresentationDto: VerifiablePresentationDto) {
    this.intent = intent
    this.originalVerifiablePresentation = verifiablePresentationDto
    this.typedVerifiableCredentials = typedVerifiableCredentials
  }

  intent: IntentType
  originalVerifiablePresentation: IVerifiablePresentation
  typedVerifiableCredentials: TypedVerifiableCredential[]

  public getTypedVerifiableCredentials(type?: string) {
    if (!type) {
      return this.typedVerifiableCredentials
    }
    return this.typedVerifiableCredentials.filter(tvc => tvc.type === type)
  }
}

export interface TypedVerifiableCredential {
  type: string
  rawVerifiableCredential: IVerifiableCredential
  transformedCredentialSubject: ICredentialSubject
}

export enum IProofPurpose {
  verificationMethod = 'verificationMethod',
  assertionMethod = 'assertionMethod',
  authentication = 'authentication',
  keyAgreement = 'keyAgreement',
  contractAgreement = 'contactAgreement',
  capabilityInvocation = 'capabilityInvocation',
  capabilityDelegation = 'capabilityDelegation'
}

export enum IProofType {
  Ed25519Signature2018 = 'Ed25519Signature2018',
  Ed25519Signature2020 = 'Ed25519Signature2020',
  EcdsaSecp256k1Signature2019 = 'EcdsaSecp256k1Signature2019',
  EcdsaSecp256k1RecoverySignature2020 = 'EcdsaSecp256k1RecoverySignature2020',
  JsonWebSignature2020 = 'JsonWebSignature2020',
  RsaSignature2018 = 'RsaSignature2018',
  GpgSignature2020 = 'GpgSignature2020',
  JcsEd25519Signature2020 = 'JcsEd25519Signature2020',
  BbsBlsSignatureProof2020 = 'BbsBlsSignatureProof2020',
  BbsBlsBoundSignatureProof2020 = 'BbsBlsBoundSignatureProof2020'
}
