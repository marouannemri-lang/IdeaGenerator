'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';

interface ClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    client?: any; // If present, edit mode
}

export function ClientDialog({ open, onOpenChange, onSuccess, client }: ClientDialogProps) {
    const { register, handleSubmit, reset } = useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            if (client) {
                reset(client);
            } else {
                reset({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phoneNumber: '',
                    companyName: ''
                });
            }
        }
    }, [open, client, reset]);

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            if (client) {
                await apiClient.patch(`/clients/${client.id}`, data);
            } else {
                await apiClient.post('/clients', data);
            }
            onOpenChange(false);
            onSuccess();
        } catch (error) {
            console.error('Erreur sauvegarde client', error);
            alert("Erreur lors de la sauvegarde");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{client ? 'Modifier le client' : 'Ajouter un client'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Prénom</Label>
                            <Input {...register('firstName')} placeholder="Jean" />
                        </div>
                        <div className="space-y-2">
                            <Label>Nom</Label>
                            <Input {...register('lastName')} placeholder="Dupont" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input {...register('email')} type="email" placeholder="jean.dupont@email.com" />
                    </div>

                    <div className="space-y-2">
                        <Label>Téléphone</Label>
                        <Input {...register('phoneNumber')} placeholder="06 12 34 56 78" />
                    </div>

                    <div className="space-y-2">
                        <Label>Entreprise (Optionnel)</Label>
                        <Input {...register('companyName')} placeholder="Dupont SARL" />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Sauvegarde...' : (client ? 'Modifier' : 'Créer le client')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
