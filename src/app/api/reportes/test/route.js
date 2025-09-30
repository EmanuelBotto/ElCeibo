export async function GET() {
    return new Response(JSON.stringify({ message: 'API de reportes funcionando' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
