export interface Login {
  email: string;
  password: string;
}

export interface LoginRes {
  user: any;
  authenticated: Boolean;
  status: String;
}

export interface ICookie {
  key: String;
  value: String;
}

export interface Image {
  type: string;
  width: number;
  height: number;
}
