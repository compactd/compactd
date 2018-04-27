export function atob(str: string) {
  return new Buffer(str).toString('base64');
}

export function btoa(str: string) {
  return new Buffer(str, 'base64').toString();
}
