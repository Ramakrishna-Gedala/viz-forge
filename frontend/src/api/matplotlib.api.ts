import client from "./client"

export const matplotlibApi = {
  lineChart: (params: { region?: string; sample?: boolean }) =>
    client.get<{ image: string }>("/matplotlib/line-chart", { params }).then((r) => r.data),

  barChart: (params: { sample?: boolean }) =>
    client.get<{ image: string }>("/matplotlib/bar-chart", { params }).then((r) => r.data),

  subplots: (params: { sample?: boolean }) =>
    client.get<{ image: string }>("/matplotlib/subplots", { params }).then((r) => r.data),

  regions: () =>
    client.get<{ regions: string[] }>("/matplotlib/regions").then((r) => r.data),

  preview: () =>
    client.get<Record<string, unknown>[]>("/matplotlib/preview").then((r) => r.data),
}
