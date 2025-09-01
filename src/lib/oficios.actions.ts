
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
import crypto from 'crypto';


const OFICIOS_COLLECTION = 'oficios';
const HISTORICO_COLLECTION = 'historico';
const CONFIG_COLLECTION = 'config';
const NUMERACAO_DOC_ID = 'numeracao';
const PUSH_SUBSCRIPTIONS_COLLECTION = 'pushSubscriptions';


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

export async function savePushSubscription(subscription: PushSubscription) {
  try {
    // Garante que o objeto de inscrição é compatível com o Firestore
    const subscriptionObject = JSON.parse(JSON.stringify(subscription));

    if (!subscriptionObject.endpoint) {
       return { success: false, error: 'Endpoint da inscrição está faltando.' };
    }

    // Cria um ID de documento único e determinístico a partir do endpoint
    const docId = crypto.createHash('sha256').update(subscriptionObject.endpoint).digest('hex');
    const docRef = doc(db, PUSH_SUBSCRIPTIONS_COLLECTION, docId);
    
    // Usa setDoc para criar ou sobrescrever a inscrição, evitando duplicatas
    await setDoc(docRef, {
        subscription: subscriptionObject,
        createdAt: serverTimestamp(),
    });
    
    console.log('Push subscription saved or updated with ID:', docId);
    return { success: true };

  } catch (error) {
    console.error('Error saving push subscription:', error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save subscription.";
    return { success: false, error: errorMessage };
  }
}
