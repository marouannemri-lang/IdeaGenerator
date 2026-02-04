'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';

export function ServicesSettingsPanel() {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<any>(null);

    const loadServices = async () => {
        try {
            const res = await apiClient.get('/settings/services');
            setServices(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadServices();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return;
        try {
            await apiClient.delete(`/settings/services/${id}`);
            loadServices();
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (service: any) => {
        setEditingService(service);
        setDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingService(null);
        setDialogOpen(true);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Catalogue de Services</CardTitle>
                    <CardDescription>Gérez vos prestations et produits types pour vos devis.</CardDescription>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Ajouter
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Prix H.T.</TableHead>
                            <TableHead>Unité</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Aucun service défini.</TableCell>
                            </TableRow>
                        ) : (
                            services.map((service) => (
                                <TableRow key={service.id}>
                                    <TableCell className="font-medium">
                                        {service.name}
                                        {service.description && <div className="text-xs text-muted-foreground">{service.description}</div>}
                                    </TableCell>
                                    <TableCell>{service.basePrice} €</TableCell>
                                    <TableCell>{service.unit}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)} className="text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            <ServiceDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                service={editingService}
                onSuccess={() => {
                    loadServices();
                    setDialogOpen(false);
                }}
            />
        </Card>
    );
}

function ServiceDialog({ open, onOpenChange, service, onSuccess }: any) {
    const { register, handleSubmit, reset } = useForm();
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            reset(service || { name: '', basePrice: 0, unit: 'forfait', description: '' });
        }
    }, [open, service, reset]);

    const onSubmit = async (data: any) => {
        setSaving(true);
        try {
            // Ensure numbers
            const payload = {
                ...data,
                basePrice: parseFloat(data.basePrice),
            };

            if (service) {
                await apiClient.patch(`/settings/services/${service.id}`, payload);
            } else {
                await apiClient.post('/settings/services', payload);
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la sauvegarde");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{service ? 'Modifier' : 'Ajouter'} un service</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nom</Label>
                        <Input {...register('name', { required: true })} placeholder="Ex: Remplacement Robinet" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Prix Base H.T. (€)</Label>
                            <Input type="number" step="0.01" {...register('basePrice', { required: true })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Unité</Label>
                            <Input {...register('unit')} placeholder="forfait, h, m2..." />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Description (Optionnel)</Label>
                        <Input {...register('description')} />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={saving}>Enregistrer</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
