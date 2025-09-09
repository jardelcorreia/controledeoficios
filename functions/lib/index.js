"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendoficionotification = void 0;
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
const firestore_1 = require("firebase-functions/v2/firestore");
// Inicializa o Firebase Admin SDK. Isso deve ser feito apenas uma vez.
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();
/**
 * Função v2 acionada na criação ou atualização de um ofício para enviar notificações.
 */
exports.sendoficionotification = (0, firestore_1.onDocumentWritten)("oficios/{oficioId}", async (event) => {
    var _a, _b, _c, _d, _e, _f;
    const oficioId = event.params.oficioId;
    const dataAfter = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after.data();
    const dataBefore = (_b = event.data) === null || _b === void 0 ? void 0 : _b.before.data();
    let notification;
    let webpush;
    // Caso 1: Novo ofício criado.
    if (!((_c = event.data) === null || _c === void 0 ? void 0 : _c.before.exists) && ((_d = event.data) === null || _d === void 0 ? void 0 : _d.after.exists) && dataAfter) {
        logger.info(`Novo ofício criado: ${oficioId}`, dataAfter);
        notification = {
            title: "Novo Ofício Criado!",
            body: `O ofício nº ${dataAfter.numero} foi criado e aguarda envio.`,
        };
        webpush = {
            fcmOptions: {
                link: `/oficios/${oficioId}`,
            },
            notification: {
                icon: "/icons/icon-192x192.png",
            },
        };
    }
    else if (
    // Caso 2: Ofício atualizado para "Enviado".
    ((_e = event.data) === null || _e === void 0 ? void 0 : _e.before.exists) &&
        ((_f = event.data) === null || _f === void 0 ? void 0 : _f.after.exists) &&
        (dataBefore === null || dataBefore === void 0 ? void 0 : dataBefore.status) !== "Enviado" &&
        (dataAfter === null || dataAfter === void 0 ? void 0 : dataAfter.status) === "Enviado") {
        logger.info(`Ofício enviado: ${oficioId}`, dataAfter);
        notification = {
            title: "Ofício Enviado!",
            body: `O ofício nº ${dataAfter.numero} foi enviado para ${dataAfter.destinatario}.`,
        };
        webpush = {
            fcmOptions: {
                link: `/oficios/${oficioId}`,
            },
            notification: {
                icon: "/icons/icon-192x192.png",
            },
        };
    }
    // Se nenhuma condição de notificação foi atendida, encerra a execução.
    if (!notification) {
        logger.info("Nenhuma condição de notificação atendida.");
        return null;
    }
    try {
        // Busca todas as inscrições de push no Firestore.
        const subscriptionsSnapshot = await db
            .collection("pushSubscriptions")
            .get();
        if (subscriptionsSnapshot.empty) {
            logger.info("Nenhuma inscrição encontrada para notificar.");
            return null;
        }
        // Mapeia e filtra para garantir que apenas inscrições válidas sejam usadas.
        // E usa um Set para garantir que cada token seja único.
        const tokensSet = new Set(subscriptionsSnapshot.docs
            .map((doc) => { var _a; return (_a = doc.data()) === null || _a === void 0 ? void 0 : _a.token; })
            .filter((token) => !!token));
        const tokens = Array.from(tokensSet);
        if (tokens.length === 0) {
            logger.warn("Documentos de inscrição encontrados, mas nenhum continha um 'token' válido.");
            return null;
        }
        logger.info(`Enviando notificação para ${tokens.length} inscritos únicos.`);
        const message = {
            notification,
            webpush,
            tokens,
        };
        // Envia a notificação para todos os tokens
        const response = await messaging.sendEachForMulticast(message);
        logger.info(`Notificações enviadas: ${response.successCount} com sucesso, ${response.failureCount} falharam.`);
        // Limpeza de tokens inválidos (opcional, mas boa prática)
        const tokensToDelete = [];
        response.responses.forEach(async (result, index) => {
            const token = tokens[index];
            if (!result.success && result.error) {
                logger.error(`Falha ao enviar para o token: ${token}`, result.error);
                const errorCode = result.error.code;
                if (errorCode === "messaging/invalid-registration-token" ||
                    errorCode === "messaging/registration-token-not-registered") {
                    logger.info(`Agendando remoção do token inválido: ${token}`);
                    const subToDeleteQuery = await db.collection("pushSubscriptions").where("token", "==", token).get();
                    subToDeleteQuery.forEach((doc) => {
                        tokensToDelete.push(doc.ref.delete());
                    });
                }
            }
        });
        await Promise.all(tokensToDelete);
        return Object.assign({ success: true }, response);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error("Erro ao enviar notificações push:", error);
        return { error: `Falha ao enviar notificações: ${errorMessage}` };
    }
});
//# sourceMappingURL=index.js.map