import client from "./client"

export const plotlyApi = {
  candlestick: (params: { ticker?: string; sample?: boolean }) =>
    client.get<{ chart_json: Record<string, unknown> }>("/plotly/candlestick", { params }).then((r) => r.data),

  treemap: () =>
    client.get<{ chart_json: Record<string, unknown> }>("/plotly/treemap").then((r) => r.data),

  scatter3d: (params: { sample?: boolean }) =>
    client.get<{ chart_json: Record<string, unknown> }>("/plotly/scatter-3d", { params }).then((r) => r.data),

  animatedBar: () =>
    client.get<{ chart_json: Record<string, unknown> }>("/plotly/animated-bar").then((r) => r.data),

  tickers: () =>
    client.get<{ tickers: string[] }>("/plotly/tickers").then((r) => r.data),

  preview: () =>
    client.get<Record<string, unknown>[]>("/plotly/preview").then((r) => r.data),
}
