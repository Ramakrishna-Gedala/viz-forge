import client from "./client"

export const bokehApi = {
  dashboard: (params: { machine_id?: string }) =>
    client.get<{ html: string }>("/bokeh/dashboard", { params }).then((r) => r.data),

  linkedBrushing: () =>
    client.get<{ html: string }>("/bokeh/linked-brushing").then((r) => r.data),

  machines: () =>
    client.get<{ machines: string[] }>("/bokeh/machines").then((r) => r.data),

  preview: () =>
    client.get<Record<string, unknown>[]>("/bokeh/preview").then((r) => r.data),
}
