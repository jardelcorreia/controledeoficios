
export type Oficio = {
  id: string;
  numero: string;
  assunto: string;
  tipo: "enviado" | "recebido";
  destinatario: string;
  data: string;
  status: "pendente" | "respondido" | "arquivado";
  conteudo: string;
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
    numero: "001/2024-GAB",
    assunto: "Solicitação de informações sobre o projeto X",
    tipo: "enviado",
    destinatario: "Secretaria de Obras",
    data: "2024-07-15",
    status: "pendente",
    conteudo:
      "Prezados, solicitamos informações detalhadas sobre o andamento do projeto X, incluindo cronograma atualizado e custos.",
  },
  {
    id: "2",
    numero: "002/2024-GAB",
    assunto: "Convite para reunião de alinhamento",
    tipo: "enviado",
    destinatario: "Departamento de Pessoal",
    data: "2024-07-12",
    status: "respondido",
    conteudo:
      "Convidamos vossa senhoria para uma reunião de alinhamento sobre as novas políticas de RH, a ser realizada no dia 20/07/2024.",
  },
  {
    id: "3",
    numero: "123/2024-SAD",
    assunto: "Resposta à solicitação de férias",
    tipo: "recebido",
    destinatario: "Gabinete Principal",
    data: "2024-07-10",
    status: "arquivado",
    conteudo:
      "Em resposta ao ofício sobre a solicitação de férias do servidor Y, informamos que a mesma foi deferida.",
  },
  {
    id: "4",
    numero: "003/2024-GAB",
    assunto: "Encaminhamento de relatório anual",
    tipo: "enviado",
    destinatario: "Tribunal de Contas",
    data: "2024-07-08",
    status: "arquivado",
    conteudo:
      "Encaminhamos, para fins de apreciação, o relatório de atividades do exercício de 2023.",
  },
    {
    id: "5",
    numero: "004/2024-GAB",
    assunto: "Reiteração de pedido de material de escritório",
    tipo: "enviado",
    destinatario: "Setor de Compras",
    data: "2024-07-05",
    status: "pendente",
    conteudo:
      "Reiteramos o pedido de material de escritório solicitado no ofício 354/2023, ainda sem resposta.",
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
