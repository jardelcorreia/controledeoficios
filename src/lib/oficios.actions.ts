
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
  query,
  where,
  getDocs,
  limit,
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

export async function savePushSubscription(token: string) {
  try {
    if (!token) {
      throw new Error('Token de inscrição está faltando.');
    }
    const q = query(collection(db, PUSH_SUBSCRIPTIONS_COLLECTION), where("token", "==", token), limit(1));
    const existing = await getDocs(q);

    if (existing.empty) {
        await addDoc(collection(db, PUSH_SUBSCRIPTIONS_COLLECTION), {
            token: token,
            createdAt: serverTimestamp(),
        });
        console.log('Token FCM salvo com sucesso no Firestore:', token);
    } else {
        console.log('Token FCM já existe, não foi salvo novamente.');
    }
    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar token de inscrição no Firestore:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Falha ao salvar a inscrição.';
    return { success: false, error: errorMessage };
  }
}
