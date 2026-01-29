'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [error, setError] = useState('');

    const onSubmit = async (data: any) => {
        try {
            const res = await apiClient.post('/auth/login', data);
            apiClient.setTokens(res.data.accessToken, res.data.refreshToken);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Une erreur est survenue');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-4 rounded-lg border p-6 shadow-lg">
                <h1 className="text-2xl font-bold">Connexion</h1>

                {error && (
                    <div className="bg-red-100 p-2 text-red-600 rounded text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Email</label>
                        <input
                            {...register('email', { required: true })}
                            className="mt-1 block w-full rounded-md border p-2"
                            type="email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Mot de passe</label>
                        <input
                            {...register('password', { required: true })}
                            className="mt-1 block w-full rounded-md border p-2"
                            type="password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                        Se connecter
                    </button>
                </form>
            </div>
        </div>
    );
}
