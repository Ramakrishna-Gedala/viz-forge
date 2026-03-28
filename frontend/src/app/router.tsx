import { lazy, Suspense } from "react"
import { createBrowserRouter } from "react-router-dom"
import { MainLayout } from "@/layouts/MainLayout"
import { ChartSkeleton } from "@/components/shared/ChartSkeleton"

const HomePage = lazy(() => import("@/pages/Home"))
const MatplotlibPage = lazy(() => import("@/pages/MatplotlibPage"))
const SeabornPage = lazy(() => import("@/pages/SeabornPage"))
const PlotlyPage = lazy(() => import("@/pages/PlotlyPage"))
const PandasPage = lazy(() => import("@/pages/PandasPage"))
const BokehPage = lazy(() => import("@/pages/BokehPage"))
const AltairPage = lazy(() => import("@/pages/AltairPage"))
const SparkPage = lazy(() => import("@/pages/SparkPage"))
const NumpyPage = lazy(() => import("@/pages/NumpyPage"))

function Loading() {
  return (
    <div className="p-6 space-y-4">
      <ChartSkeleton height={60} />
      <ChartSkeleton height={400} />
    </div>
  )
}

function wrap(element: React.ReactNode) {
  return <Suspense fallback={<Loading />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: wrap(<HomePage />) },
      { path: "tools/matplotlib", element: wrap(<MatplotlibPage />) },
      { path: "tools/seaborn", element: wrap(<SeabornPage />) },
      { path: "tools/plotly", element: wrap(<PlotlyPage />) },
      { path: "tools/pandas", element: wrap(<PandasPage />) },
      { path: "tools/bokeh", element: wrap(<BokehPage />) },
      { path: "tools/altair", element: wrap(<AltairPage />) },
      { path: "tools/spark", element: wrap(<SparkPage />) },
      { path: "tools/numpy", element: wrap(<NumpyPage />) },
    ],
  },
])
