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
