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

export interface MediaUploadRes {
  status: string;
  upload_id: string;
}

export interface PostPublished {
  status: string;
}
