import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

// Split out of ApiDocs so Swagger UI (~500kB gzipped) only downloads when the
// Reference tab is opened; the default Guide tab stays light.
export function ApiReference() {
  return (
    <div className="llb-swagger">
      <SwaggerUI url="/api/openapi.json" docExpansion="list" defaultModelsExpandDepth={-1} />
    </div>
  )
}
