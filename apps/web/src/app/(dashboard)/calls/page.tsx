import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CallsPage() {
    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Appels Manqués</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Journal des appels</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-10 text-gray-500">
                        Aucun appel manqué récemment.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
