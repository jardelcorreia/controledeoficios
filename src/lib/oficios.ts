
// src/lib/oficios.ts
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  limit,
  where,
  startAfter,
} from 'firebase/firestore';

export const statusList = ["Aguardando Envio", "Enviado"] as const;

export type Status = (typeof statusList)[number];

export type Oficio = {
  id: string;
  numero: string;
  assunto: string;
  destinatario: string;
  responsavel: string;
  data: string; // ISO 8601 format
  numeroSequencial: number;
  ano: number;
  status: Status;
};

const OFICIOS_COLLECTION = 'oficios';

// --- Funções de Leitura ---

export async function getOficios(): Promise<Oficio[]> {
  const q = query(
    collection(db, OFICIOS_COLLECTION),
    orderBy('numeroSequencial', 'desc')
  );
  // @ts-ignore
  const querySnapshot = await getDocs(q, { cache: 'no-store' });
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Oficio)
  );
}

export async function getOficioById(id: string): Promise<Oficio | null> {
  const docRef = doc(db, OFICIOS_COLLECTION, id);
  // @ts-ignore
  const docSnap = await getDoc(docRef, { cache: 'no-store' });
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
  // @ts-ignore
  const querySnapshot = await getDocs(q, { cache: 'no-store' });
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Oficio)
  );
}

export async function getUltimoOficio(): Promise<Oficio | null> {
  const q = query(
    collection(db, OFICIOS_COLLECTION),
    orderBy('numeroSequencial', 'desc'),
    limit(1)
  );
  // @ts-ignore
  const querySnapshot = await getDocs(q, { cache: 'no-store' });
  if (querySnapshot.empty) {
    return null;
  }
  const docData = querySnapshot.docs[0];
  return { id: docData.id, ...docData.data() } as Oficio;
}

// --- Lógica de Numeração ---

export async function getProximoNumeroSequencial(
  ano: number,
  numeroInicial: number
): Promise<number> {
  const q = query(
    collection(db, OFICIOS_COLLECTION),
    where('ano', '==', ano),
    orderBy('numeroSequencial', 'desc'),
    limit(1)
  );
  // @ts-ignore
  const querySnapshot = await getDocs(q, { cache: 'no-store' });

  if (querySnapshot.empty) {
    return numeroInicial > 0 ? numeroInicial : 1;
  }

  const ultimoOficio = querySnapshot.docs[0].data() as Oficio;

  const proximoNumero = ultimoOficio.numeroSequencial + 1;

  return Math.max(proximoNumero, numeroInicial);
}

export async function getNumeroFormatado(
  numeroSequencial: number,
  ano: number,
  prefixo?: string,
  sufixo?: string
) {
  const numeroFormatado = numeroSequencial.toString().padStart(3, '0');
  const partePrefixo = `${prefixo || 'OF'}-${numeroFormatado}/${ano}`;
  const parteSufixo = sufixo ? `-${sufixo}` : '';
  return `${partePrefixo}${parteSufixo}`;
}

export async function getProximoNumeroOficio(): Promise<string> {
  const { anoBase, prefixo, sufixo, numeroInicial } = await getNumeracaoConfig();
  const proximoNumero = await getProximoNumeroSequencial(anoBase, numeroInicial);
  return getNumeroFormatado(proximoNumero, anoBase, prefixo, sufixo);
}

// --- Configurações de Numeração ---

export type NumeracaoConfig = {
  prefixo?: string;
  sufixo?: string;
  anoBase: number;
  numeroInicial: number;
};

const CONFIG_COLLECTION = 'config';
const NUMERACAO_DOC_ID = 'numeracao';

export async function getNumeracaoConfig(): Promise<NumeracaoConfig> {
  const docRef = doc(db, CONFIG_COLLECTION, NUMERACAO_DOC_ID);
  // @ts-ignore
  const docSnap = await getDoc(docRef, { cache: 'no-store' });

  if (docSnap.exists()) {
    return docSnap.data() as NumeracaoConfig;
  }

  // Default config
  return {
    prefixo: 'OF',
    sufixo: 'GAB',
    anoBase: new Date().getFullYear(),
    numeroInicial: 1,
  };
}

// --- Histórico ---
export type Historico = {
  id: string;
  acao: string;
  data: string;
  detalhes: string;
};

const HISTORICO_COLLECTION = 'historico';

export async function getHistorico(
  pageSize: number,
  lastVisibleId?: string | null
): Promise<{ historico: Historico[], lastVisible: string | null }> {
  const historicoCollection = collection(db, HISTORICO_COLLECTION);
  let q;

  if (lastVisibleId) {
    const lastDocRef = doc(db, HISTORICO_COLLECTION, lastVisibleId);
    // @ts-ignore
    const lastDocSnap = await getDoc(lastDocRef, { cache: 'no-store' });
    if (!lastDocSnap.exists()) {
      // Se o documento cursor não for encontrado, retorna vazio
      return { historico: [], lastVisible: null };
    }
    q = query(
      historicoCollection,
      orderBy('data', 'desc'),
      startAfter(lastDocSnap),
      limit(pageSize)
    );
  } else {
    // Primeira página
    q = query(historicoCollection, orderBy('data', 'desc'), limit(pageSize));
  }

  // @ts-ignore
  const snapshot = await getDocs(q, { cache: 'no-store' });

  const historicoData = snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Historico)
  );

  const newLastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null;

  return { historico: historicoData, lastVisible: newLastVisible };
}
