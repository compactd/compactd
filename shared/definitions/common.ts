export interface IResponseDTO<T> {
  status: "success" | "error";
  data: T;
}
