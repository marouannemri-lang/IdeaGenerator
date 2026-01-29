'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';

interface CreateClientDialogProps {
    onSuccess: () => void;
}

export function CreateClientDialog({ onSuccess }: CreateClientDialogProps) {
    const [open, setOpen] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            await apiClient.post('/clients', data);
            reset();
            setOpen(false);
            onSuccess();
        } catch (error) {
            console.error('Erreur création client', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Nouveau Client</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ajouter un client</DialogTitle>
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
                            {loading ? 'Création...' : 'Créer le client'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
