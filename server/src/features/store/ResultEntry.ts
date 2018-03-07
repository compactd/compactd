export default interface ResultEntry {
  _id: string;
  name: string;
  format: string;
  store: string;
  sid: string;
  stats: ({
    name: string,
    icon: string,
    value: string,
    desc: string
  })[];
  labels: {[name: string]: string}
}