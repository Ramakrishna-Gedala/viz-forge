import client from "./client"

export const seabornApi = {
  heatmap: () =>
    client.get<{ image: string }>("/seaborn/heatmap").then((r) => r.data),

  boxplot: () =>
    client.get<{ image: string }>("/seaborn/boxplot").then((r) => r.data),

  pairplot: () =>
    client.get<{ image: string }>("/seaborn/pairplot").then((r) => r.data),

  violin: () =>
    client.get<{ image: string }>("/seaborn/violin").then((r) => r.data),

  stats: () =>
    client.get<{ headcount: number; avg_salary: number; attrition_rate: number; avg_performance: number; departments: number }>("/seaborn/stats").then((r) => r.data),

  preview: () =>
    client.get<Record<string, unknown>[]>("/seaborn/preview").then((r) => r.data),
}
