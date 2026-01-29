'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [error, setError] = useState('');

    const onSubmit = async (data: any) => {
        try {
            const res = await apiClient.post('/auth/register', data);
            apiClient.setTokens(res.data.accessToken, res.data.refreshToken);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Une erreur est survenue');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-sm space-y-6 rounded-lg border bg-white p-8 shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Inscription</h1>
                    <p className="text-sm text-gray-500 mt-2">Créez votre compte TalentFlow</p>
                </div>

                {error && (
                    <div className="bg-destructive/15 p-3 text-destructive rounded text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Prénom</label>
                            <input
                                {...register('firstName', { required: true })}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                type="text"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Nom</label>
                            <input
                                {...register('lastName', { required: true })}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                type="text"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            {...register('email', { required: true })}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            type="email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Nom de l'entreprise</label>
                        <input
                            {...register('businessName')}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            type="text"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Mot de passe</label>
                        <input
                            {...register('password', { required: true, minLength: 6 })}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            type="password"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Minimum 6 caractères</p>
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-md bg-primary py-2 text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                    >
                        S'inscrire
                    </button>
                </form>

                <div className="text-center text-sm">
                    Vous avez déjà un compte ?{' '}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Se connecter
                    </Link>
                </div>
            </div>
        </div>
    );
}
