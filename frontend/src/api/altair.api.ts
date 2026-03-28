import client from "./client"

export const altairApi = {
  layered: (params: { city?: string }) =>
    client.get<{ chart_json: Record<string, unknown> }>("/altair/layered", { params }).then((r) => r.data),

  faceted: () =>
    client.get<{ chart_json: Record<string, unknown> }>("/altair/faceted").then((r) => r.data),

  interactiveBrush: () =>
    client.get<{ chart_json: Record<string, unknown> }>("/altair/interactive-brush").then((r) => r.data),

  cities: () =>
    client.get<{ cities: string[] }>("/altair/cities").then((r) => r.data),

  preview: () =>
    client.get<Record<string, unknown>[]>("/altair/preview").then((r) => r.data),
}
