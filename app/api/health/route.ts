export async function GET() {
  return Response.json(
    { status: "ok", service: "assignme", time: new Date().toISOString() },
    { status: 200 }
  );
}
