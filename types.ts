export interface ClinicAddress {
    PHFNo: string;
    SeqNo: string;
    Address: string;
  }
  
  export interface ClinicData {
    RowNo: string;
    PHFNo: string;
    EncodedPHFNo: string;
    PHFType: string;
    LicenceCode: string | null;
    PHFName: string;
    Address: ClinicAddress[];
    Premise: string | null;
    PhoneNo: string;
    PhoneNo2: string | null;
    FaxNo: string | null;
    PhoneNoDisplay: string;
    PhoneNo2Display: string;
    PhoneNo1And2Display: string;
    FaxNoDisplay: string;
    Email: string | null;
    URL_EN: string | null;
    ServiceProvided: string | null;
    LatLng: string | null;
    LicenceNo: string | null;
    LicenceNoEncode: string | null;
    PHFNoEncode: string | null;
    DocumentType: string | null;
    TypeOfPractice: string | null;
    DisplayMap: string | null;
    RegulatoryDesc: string | null;
    RecordStatus: string | null;
    OperatorName: string | null;
    LicenceRecordStatusPublicDesc: string | null;
    LicenceRecordStatus: string | null;
    RecordStatusFromDate: string | null;
    RecordStatusToDate: string | null;
  }

  export enum ProcessingStatus {
    IDLE = 'IDLE',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    ERROR = 'ERROR',
    PAUSED = 'PAUSED'
  }
  
  export interface GeocodedResult {
    lat: number;
    lng: number;
  }