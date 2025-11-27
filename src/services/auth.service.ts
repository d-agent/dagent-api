import { checkSignature, DataSignature, generateNonce } from '@meshsdk/core';
import { prisma } from '../lib/db';
import { NONCE_MESSAGE } from '../lib/utils/constants';
import { decode, sign, verify } from 'hono/jwt'
import { config } from '../lib/env';
import { setCookie } from 'hono/cookie';
import { Context } from 'hono';

export class AuthService {
    public static readonly sendNonce = async (address: string) => {
        const existingUser = await prisma.user.findFirst({
            where: {
                walletAddress: {
                    address: address
                }
            },
            include: {
                walletAddress: true
            }
        });

        const nonce = generateNonce(NONCE_MESSAGE);

        if (existingUser) {
            await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    nonce,
                    updatedAt: new Date()
                }
            });

            return { nonce };
        }

        // Create new user and wallet address in a transaction
        const userId = crypto.randomUUID();
        const now = new Date();

        await prisma.$transaction(async (tx) => {
            await tx.user.create({
                data: {
                    id: userId,
                    name: address,
                    email: address,
                    emailVerified: false,
                    nonce,
                    createdAt: now,
                    updatedAt: now
                }
            });

            await tx.walletAddress.create({
                data: {
                    address: address,
                    chainId: 1,
                    isPrimary: true,
                    userId,
                    createdAt: now
                }
            });
        });

        return { nonce };
    }

    public static readonly verifyNonce = async (c: Context, address: string, signature: DataSignature) => {
        const user = await prisma.user.findFirst({
            where: {
                walletAddress: {
                    address: address
                }
            },
            select: {
                nonce: true,
                id: true
            }
        });

        if (!user?.nonce) {
            throw new Error('User not found or nonce not set');
        }

        const verified = await checkSignature(
            user.nonce,
            signature,
            address as `0x${string}`
        );

        if (!verified) {
            throw new Error('Invalid signature');
        }
        else {
            const payload = {
                sub: user.id,
                role: 'user',
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // Token expires in 30 days
            }

            // create a bearer access token
            const token = await sign({
                payload,
                alg: 'HS256'
            }, config.JWT_SECRET);

            setCookie(c, 'token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 30,
            });
            return { token: token };
        }

    }
}