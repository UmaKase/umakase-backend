// This is a normal typescript file || NOT A MODULE

interface AccessToken {
  id: string;
}

interface RefreshToken {
  id: string;
  iat: number;
  exp: number;
}
