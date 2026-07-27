export function GET(request: Request) {
  return redirectToCheckout(request)
}

export function HEAD(request: Request) {
  return redirectToCheckout(request)
}

function redirectToCheckout(request: Request) {
  const url = new URL(request.url)

  url.pathname = "/checkout"
  return Response.redirect(url, 307)
}
