export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', {status: 401});
    }
    const response = await fetch(`${process.env.BACKEND_URL}/update-database`, {
        headers: {
            'Authorization': `Bearer ${process.env.CRON_SECRET}`
        }
    });
    const data = await response.json();
    return Response.json(data);
}