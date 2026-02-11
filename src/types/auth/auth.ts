// export class SignupRequestModel {
//   phone: string;
//   userType: string;

//   constructor(phone: string, userType: string) {
//     this.phone = phone;
//     this.userType = userType;
//   }

//   toJson() {
//     return {
//       phone: this.phone,
//       userType: this.userType,
//     };
//   }
// }

// export class SignupResponseModel {
//   status?: boolean;
//   message?: string;
//   data?: {
//     phone: string;
//     token: string;
//     isNewUser: boolean;
//     userType: string;
//   };

//   static fromJson(json: any): SignupResponseModel {
//     const instance = new SignupResponseModel();
//     instance.status = json.status;
//     instance.message = json.message;
//     instance.data = json.data;
//     return instance;
//   }
// }

export class VerifyOTPRequestModel {
  phone: string;
  token: string;
  otp: string;

  constructor(
    phone: string,
    token: string,
   
    otp: string,
  ) {
    this.phone = phone;
    this.token = token;
    this.otp = otp;
  }

  toJson() {
    return {
      phoneNumber: this.phone,
      fcm_token: this.token,
      otp: this.otp,
    };
  }
}

export class VerifyOTPResponseModel {
  status?: boolean;
  message?: string;
  data?: {
    token: string;
    is_new: boolean;
  };

  static fromJson(json: any): VerifyOTPResponseModel {
    const instance = new VerifyOTPResponseModel();
    instance.status = json.status;
    instance.message = json.message;
    instance.data = json.data;
    return instance;
  }
}


export class LoginRequestModel {
  phone: string;

  constructor(phone: string) {
    this.phone = phone;
  }

  toJson() {
    return {
      phoneNumber: this.phone,
   };
  }
}

export class LoginResponseModel {
  status?: boolean;
  message?: string;
  data?: {
    phone: string;
    token: string;
    isNewUser: boolean;
    userType: string;
  };

  static fromJson(json: any): LoginResponseModel {
    const instance = new LoginResponseModel();
    instance.status = json.status;
    instance.message = json.message;
    instance.data = json.data;
    return instance;
  }
}