import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ErrorAlert({ message }: { message?: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {message ?? "Failed to load data. Make sure the backend is running at http://localhost:8000"}
      </AlertDescription>
    </Alert>
  )
}
