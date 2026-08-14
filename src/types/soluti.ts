export interface BirdIdSlot {
  slot_alias: string;
  label: string;
}

export interface BirdIdDiscoveryResponse {
  success: boolean;
  message: string;
  data: BirdIdSlot[];
}
