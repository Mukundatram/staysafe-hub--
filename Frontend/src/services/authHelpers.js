export function getToken() {
  return localStorage.getItem('staysafe-token');
}

export function clearToken() {
  localStorage.removeItem('staysafe-token');
}
