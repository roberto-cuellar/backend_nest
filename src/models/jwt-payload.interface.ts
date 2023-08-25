export interface JwtPayload {
  id: string;
  userName: string;
  userRole: string;
  iat?: number; 
  exp?: number;
}
