// src/lib/oficios.ts
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export type Oficio = {
  id: string;
  numero: string;
  assunto: string;
  destinatario: string;
  responsavel: string;
  data: string; // ISO 8601 format
  numeroSequencial: number;
};

const OFICIOS_COLLECTION = 'oficios';

// --- Funções de Leitura ---

export async function getOficios(): Promise<Oficio[]> {
  const q = query(
    collection(db, OFICIOS_COLLECTION),
    orderBy('numeroSequencial', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Oficio)
  );
}

export async function getOficioById(id: string): Promise<Oficio | null> {
  const docRef = doc(db, OFICIOS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Oficio;
  }
  return null;
}

export async function getOficiosRecentes(count: number): Promise<Oficio[]> {
  const q = query(
    collection(db, OFICIOS_COLLECTION),
    orderBy('numeroSequencial', 'desc'),
    limit(count)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Oficio)
  );
}

// --- Lógica de Numeração ---

async function getProximoNumeroSequencial(ano: number): Promise<number> {
   const q = query(
    collection(db, OFICIOS_COLLECTION),
    orderBy('numeroSequencial', 'desc'),
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return 1;
  }
  
  const ultimoOficio = querySnapshot.docs[0].data() as Oficio;
  const ultimoAno = new Date(ultimoOficio.data).getFullYear();

  if(ano > ultimoAno) {
      return 1;
  }

  return ultimoOficio.numeroSequencial + 1;
}

async function getNumeroFormatado(numeroSequencial: number, ano: number, prefixo?: string, sufixo?: string) {
    const numeroFormatado = numeroSequencial.toString().padStart(3, '0');
    return `${prefixo || 'OF'}-${numeroFormatado}/${ano}-${sufixo || 'GAB'}`;
}


export async function getProximoNumeroOficio(): Promise<string> {
    const { anoBase, prefixo, sufixo } = await getNumeracaoConfig();
    const proximoNumero = await getProximoNumeroSequencial(anoBase);
    return getNumeroFormatado(proximoNumero, anoBase, prefixo, sufixo);
}


// --- Funções de Escrita ---

export async function createOficio(data: {
  assunto: string;
  destinatario: string;
  responsavel: string;
}) {
  const { anoBase, prefixo, sufixo } = await getNumeracaoConfig();
  const numeroSequencial = await getProximoNumeroSequencial(anoBase);
  const numero = await getNumeroFormatado(numeroSequencial, anoBase, prefixo, sufixo);

  const newOficio: Omit<Oficio, 'id'> = {
    ...data,
    numero,
    numeroSequencial,
    data: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, OFICIOS_COLLECTION), newOficio);
  
  await addHistorico({
      acao: 'Criação de Ofício',
      detalhes: `Ofício nº ${numero} criado.`,
  });

  revalidatePath('/oficios');
  revalidatePath('/');
  return docRef.id;
}

export async function updateOficio(
  id: string,
  data: {
    assunto: string;
    destinatario: string;
    responsavel: string;
  }
) {
  const docRef = doc(db, OFICIOS_COLLECTION, id);
  const oficio = await getOficioById(id);

  if (!oficio) throw new Error("Ofício não encontrado");

  await updateDoc(docRef, data);
  
  await addHistorico({
      acao: 'Edição de Ofício',
      detalhes: `Ofício nº ${oficio.numero} atualizado.`,
  });

  revalidatePath(`/oficios/${id}`);
  revalidatePath(`/oficios/${id}/editar`);
  revalidatePath('/oficios');
  revalidatePath('/');
}

// --- Configurações de Numeração ---

export type NumeracaoConfig = {
    prefixo: string;
    sufixo: string;
    anoBase: number;
}

const CONFIG_COLLECTION = 'config';
const NUMERACAO_DOC_ID = 'numeracao';

export async function saveNumeracaoConfig(config: NumeracaoConfig) {
    const docRef = doc(db, CONFIG_COLLECTION, NUMERACAO_DOC_ID);
    await writeBatch(db).set(docRef, config).commit();
    revalidatePath('/configuracoes');
    revalidatePath('/');
    revalidatePath('/oficios/novo');
}

export async function getNumeracaoConfig(): Promise<NumeracaoConfig> {
    const docRef = doc(db, CONFIG_COLLECTION, NUMERACAO_DOC_ID);
    const docSnap = await getDoc(docRef);

    if(docSnap.exists()){
        return docSnap.data() as NumeracaoConfig;
    }

    // Default config
    return {
        prefixo: 'OF',
        sufixo: 'GAB',
        anoBase: new Date().getFullYear()
    }
}


// --- Histórico ---
export type Historico = {
  id: string;
  acao: string;
  data: string;
  detalhes: string;
};

const HISTORICO_COLLECTION = 'historico';

export async function addHistorico(data: Omit<Historico, 'id' | 'data'>) {
    await addDoc(collection(db, HISTORICO_COLLECTION), {
        ...data,
        data: new Date().toISOString(),
    });
    revalidatePath('/historico');
}

export async function getHistorico(): Promise<Historico[]> {
    const q = query(collection(db, HISTORICO_COLLECTION), orderBy('data', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({id: doc.id, ...doc.data() } as Historico));
}
