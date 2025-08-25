
export type Oficio = {
  id: string;
  numero: string;
  assunto: string;
  tipo: "enviado";
  destinatario: string;
  responsavel: string;
  data: string;
};

export type Historico = {
  id: string;
  acao: string;
  usuario: string;
  data: string;
  detalhes: string;
};

export const mockOficios: Oficio[] = [
  {
    id: "1",
    numero: "060/2024-GAB",
    assunto: "Solicitação de informações sobre o projeto X",
    tipo: "enviado",
    destinatario: "Secretaria de Obras",
    responsavel: "João Silva",
    data: "2024-07-15",
  },
  {
    id: "2",
    numero: "061/2024-GAB",
    assunto: "Convite para reunião de alinhamento",
    tipo: "enviado",
    destinatario: "Departamento de Pessoal",
    responsavel: "Maria Oliveira",
    data: "2024-07-12",
  },
  {
    id: "4",
    numero: "062/2024-GAB",
    assunto: "Encaminhamento de relatório anual",
    tipo: "enviado",
    destinatario: "Tribunal de Contas",
    responsavel: "Carlos Pereira",
    data: "2024-07-08",
  },
    {
    id: "5",
    numero: "063/2024-GAB",
    assunto: "Reiteração de pedido de material de escritório",
    tipo: "enviado",
    destinatario: "Setor de Compras",
    responsavel: "Ana Costa",
    data: "2024-07-05",
  },
];

export const mockHistorico: Historico[] = [
  {
    id: "1",
    acao: "Criação de Ofício",
    usuario: "admin",
    data: "2024-07-15 10:30",
    detalhes: "Ofício nº 001/2024-GAB criado.",
  },
  {
    id: "2",
    acao: "Edição de Ofício",
    usuario: "admin",
    data: "2024-07-12 14:00",
    detalhes: "Ofício nº 002/2024-GAB atualizado.",
  },
  {
    id: "3",
    acao: "Login de Usuário",
    usuario: "user1",
    data: "2024-07-12 09:00",
    detalhes: "Usuário user1 logado com sucesso.",
  },
  {
    id: "4",
    acao: "Configuração Alterada",
    usuario: "admin",
    data: "2024-07-10 11:25",
    detalhes: 'Prefixo de numeração alterado para "OF".',
  },
   {
    id: "5",
    acao: "Visualização de Ofício",
    usuario: "user1",
    data: "2024-07-10 10:00",
    detalhes: "Ofício nº 123/2024-SAD visualizado.",
  },
];
