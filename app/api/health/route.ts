export async function GET() {
  return Response.json({
    ok: true,
    service: "auntie-chen-next",
    time: new Date().toISOString(),
  })
}
