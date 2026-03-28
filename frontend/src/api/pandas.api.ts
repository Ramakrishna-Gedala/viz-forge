import client from "./client"

export const pandasApi = {
  areaChart: (params: { category?: string; sample?: boolean }) =>
    client.get<{ image: string }>("/pandas/area-chart", { params }).then((r) => r.data),

  histogram: (params: { bins?: number; sample?: boolean }) =>
    client.get<{ image: string }>("/pandas/histogram", { params }).then((r) => r.data),

  scatterMatrix: (params: { sample?: boolean }) =>
    client.get<{ image: string }>("/pandas/scatter-matrix", { params }).then((r) => r.data),

  categories: () =>
    client.get<{ categories: string[] }>("/pandas/categories").then((r) => r.data),

  preview: () =>
    client.get<Record<string, unknown>[]>("/pandas/preview").then((r) => r.data),
}
