export class LoginRequestModel {
  phone: string;

  constructor(phone: string) {
    this.phone = phone;
  }

  toJson() {
    return {
      phone: this.phone,
    };
  }
}

export class LoginResponseModel {
  status?: boolean;
  message?: string;

  static fromJson(json: any): LoginResponseModel {
    const instance = new LoginResponseModel();
    instance.status = json.status;
    instance.message = json.message;
    return instance;
  }
}

//// OTP Verification

export class OtpRequestModel {
  phone: string;
  otp: string;

  constructor(phone: string, otp: string) {
    this.phone = phone;
    this.otp = otp;
  }

  toJson() {
    return {
      phone: this.phone,
      otp: this.otp,
    };
  }
}

export class OtpVerificationResponseModel {
  status?: boolean;
  message?: string;
  data?: {
    token: string;
  };

  constructor(status?: boolean, message?: string, data?: { token: string }) {
    this.status = status;
    this.message = message;
    this.data = data;
  }

  static fromJson(json: any): OtpVerificationResponseModel {
    const instance = new OtpVerificationResponseModel();
    instance.status = json.status;
    instance.message = json.message;
    instance.data = json.data ? { token: json.data.token } : undefined;
    return instance;
  }

  toJson() {
    return {
      status: this.status,
      message: this.message,
      data: this.data,
    };
  }
}
