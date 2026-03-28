import client from "./client"

interface SparkResult<T> {
  data: T[]
  row_count?: number
  execution_time_s: number
}

export const sparkApi = {
  aggregations: (params: { sample?: boolean }) =>
    client.get<SparkResult<Record<string, unknown>>>("/spark/aggregations", { params }).then((r) => r.data),

  windowFunctions: (params: { sample?: boolean }) =>
    client.get<SparkResult<Record<string, unknown>>>("/spark/window-functions", { params }).then((r) => r.data),

  topProducts: (params: { limit?: number }) =>
    client.get<SparkResult<Record<string, unknown>>>("/spark/top-products", { params }).then((r) => r.data),

  schema: () =>
    client.get<{ schema: { name: string; type: string }[]; row_count: number; column_count: number; execution_time_s: number }>("/spark/schema").then((r) => r.data),
}
