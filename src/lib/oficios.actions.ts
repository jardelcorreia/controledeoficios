// src/lib/oficios.actions.ts
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import {
  getNumeracaoConfig,
  getProximoNumeroSequencial,
  getNumeroFormatado,
  getOficioById,
  getUltimoOficio,
  Oficio,
  Historico,
  NumeracaoConfig,
} from './oficios';
import { revalidatePath } from 'next/cache';
import webpush from 'web-push';


const OFICIOS_COLLECTION = 'oficios';
const HISTORICO_COLLECTION = 'historico';
const CONFIG_COLLECTION = 'config';
const NUMERACAO_DOC_ID = 'numeracao';
const PUSH_SUBSCRIPTIONS_COLLECTION = 'pushSubscriptions';

// --- Configuração do Web Push ---
// As chaves VAPID devem ser variáveis de ambiente em produção
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BMOvZxaUXFm3yDnbYMxTKKfgkLC7ErYNVBHjGWPFHeGyCHq9b5mmCPPivky-KWClfOqVY6WPS9niSXdLD8rTjrQ";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "4-C0Y9nUm3D_p32d8Z-J4aRj-3n4a-9Z8j-1c2a3b4d5e6f";

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        'mailto:your-email@example.com', // Substitua pelo seu email
        vapidPublicKey,
        vapidPrivateKey
    );
}


// --- Funções de Notificação ---

async function sendPushNotification(title: string, body: string) {
    if (!vapidPublicKey || !vapidPrivateKey) {
        console.warn("VAPID keys not configured. Skipping push notification.");
        return;
    }
    
    try {
        const subscriptionsSnapshot = await getDocs(collection(db, PUSH_SUBSCRIPTIONS_COLLECTION));
        const subscriptions = subscriptionsSnapshot.docs.map(doc => doc.data().subscription);

        const payload = JSON.stringify({ title, body });

        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(sub, payload);
            } catch (error: any) {
                 if (error.statusCode === 410 || error.statusCode === 404) {
                    console.log('Subscription has expired or is no longer valid: ', error.endpoint);
                    // TODO: Remover a inscrição do banco de dados
                 } else {
                    console.error('Error sending notification to', error.endpoint, ':', error.body);
                 }
            }
        }

    } catch (error) {
        console.error("Error sending push notifications:", error);
    }
}


// --- Funções de Escrita ---

export async function createOficio(data: {
  assunto: string;
  destinatario: string;
  responsavel: string;
}) {
  const { anoBase, prefixo, sufixo, numeroInicial } = await getNumeracaoConfig();
  const numeroSequencial = await getProximoNumeroSequencial(
    anoBase,
    numeroInicial
  );
  const numero = await getNumeroFormatado(
    numeroSequencial,
    anoBase,
    prefixo,
    sufixo
  );

  const newOficio: Omit<Oficio, 'id'> = {
    ...data,
    numero,
    numeroSequencial,
    ano: anoBase,
    data: new Date().toISOString(),
    status: 'Aguardando Envio',
  };

  const docRef = await addDoc(collection(db, OFICIOS_COLLECTION), newOficio);

  await addHistorico({
    acao: 'Criação de Ofício',
    detalhes: `Ofício nº ${numero} criado com status 'Aguardando Envio'.`,
  });

  // Enviar notificação push
  await sendPushNotification('Novo Ofício Criado', `O ofício nº ${numero} está aguardando envio.`);

  revalidatePath('/oficios');
  revalidatePath('/');
  return docRef.id;
}

export async function updateOficio(
  id: string,
  data: Partial<
    Pick<Oficio, 'assunto' | 'destinatario' | 'responsavel' | 'status'>
  >
) {
  const docRef = doc(db, OFICIOS_COLLECTION, id);
  const oficio = await getOficioById(id);

  if (!oficio) throw new Error('Ofício não encontrado');

  await updateDoc(docRef, data);

  const detalhes = data.status
    ? `Status do ofício nº ${oficio.numero} alterado para '${data.status}'.`
    : `Ofício nº ${oficio.numero} atualizado.`;
  
  if (data.status === 'Enviado' && oficio.status !== 'Enviado') {
      // Enviar notificação push
      await sendPushNotification('Ofício Enviado!', `O ofício nº ${oficio.numero} foi enviado para ${oficio.destinatario}.`);
  }

  await addHistorico({
    acao: 'Edição de Ofício',
    detalhes: detalhes,
  });

  revalidatePath(`/oficios/${id}`);
  revalidatePath(`/oficios/${id}/editar`);
  revalidatePath('/oficios');
  revalidatePath('/');
}

export async function deleteOficio(id: string) {
  const oficio = await getOficioById(id);
  if (!oficio) throw new Error('Ofício não encontrado para exclusão');

  const ultimoOficio = await getUltimoOficio();
  if (!ultimoOficio || oficio.id !== ultimoOficio.id) {
    throw new Error('Apenas o último ofício pode ser excluído.');
  }

  const docRef = doc(db, OFICIOS_COLLECTION, id);
  await deleteDoc(docRef);

  await addHistorico({
    acao: 'Exclusão de Ofício',
    detalhes: `Ofício nº ${oficio.numero} excluído.`,
  });

  revalidatePath('/oficios');
  revalidatePath('/');
}


export async function saveNumeracaoConfig(config: Omit<NumeracaoConfig, 'id'>) {
  const docRef = doc(db, CONFIG_COLLECTION, NUMERACAO_DOC_ID);
  await setDoc(docRef, config);
  revalidatePath('/configuracoes');
  revalidatePath('/');
  revalidatePath('/oficios/novo');
}


export async function addHistorico(data: Omit<Historico, 'id' | 'data'>) {
  await addDoc(collection(db, HISTORICO_COLLECTION), {
    ...data,
    data: new Date().toISOString(),
  });
  revalidatePath('/historico');
}

export async function savePushSubscription(subscription: object) {
  try {
    // Verificação simples para evitar duplicatas, embora uma verificação mais robusta possa ser necessária
    const q = query(collection(db, PUSH_SUBSCRIPTIONS_COLLECTION), where("subscription.endpoint", "==", (subscription as any).endpoint));
    const existing = await getDocs(q);
    if (existing.empty) {
        const docRef = await addDoc(collection(db, PUSH_SUBSCRIPTIONS_COLLECTION), {
          subscription: JSON.parse(JSON.stringify(subscription)), // Ensure it's a plain object
          createdAt: serverTimestamp(),
        });
        console.log('Push subscription saved:', docRef.id);
    } else {
        console.log("Push subscription already exists.");
    }
    return { success: true };
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return { success: false, error: 'Failed to save subscription.' };
  }
}
