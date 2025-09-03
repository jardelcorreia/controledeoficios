"use strict";
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/document";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
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
exports.sendOficioNotification = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Inicializa o Firebase Admin SDK. Isso deve ser feito apenas uma vez.
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();
/**
 * Função acionada na criação ou atualização de um ofício para enviar notificações.
 */
exports.sendOficioNotification = functions
    .region("southamerica-east1")
    .firestore.document("oficios/{oficioId}")
    .onWrite(async (change, context) => {
    const oficioId = context.params.oficioId;
    const dataAfter = change.after.data();
    const dataBefore = change.before.data();
    // Base para o payload da notificação
    let notificationPayload = null;
    // Caso 1: Novo ofício criado.
    if (!change.before.exists && change.after.exists && dataAfter) {
        functions.logger.info(`Novo ofício criado: ${oficioId}`, dataAfter);
        notificationPayload = {
            notification: {
                title: "Novo Ofício Criado!",
                body: `O ofício nº ${dataAfter.numero} foi criado e aguarda envio.`,
            },
            webpush: {
                fcmOptions: {
                    link: `/oficios/${oficioId}`,
                },
                notification: {
                    icon: "/icons/icon-192x192.png",
                },
            },
        };
    }
    else if (
    // Caso 2: Ofício atualizado para "Enviado".
    change.before.exists &&
        change.after.exists &&
        (dataBefore === null || dataBefore === void 0 ? void 0 : dataBefore.status) !== "Enviado" &&
        (dataAfter === null || dataAfter === void 0 ? void 0 : dataAfter.status) === "Enviado") {
        functions.logger.info(`Ofício enviado: ${oficioId}`, dataAfter);
        notificationPayload = {
            notification: {
                title: "Ofício Enviado!",
                body: `O ofício nº ${dataAfter.numero} foi enviado para ${dataAfter.destinatario}.`,
            },
            webpush: {
                fcmOptions: {
                    link: `/oficios/${oficioId}`,
                },
                notification: {
                    icon: "/icons/icon-192x192.png",
                },
            },
        };
    }
    // Se nenhuma condição de notificação foi atendida, encerra a execução.
    if (!notificationPayload) {
        functions.logger.info("Nenhuma condição de notificação atendida.");
        return null;
    }
    try {
        // Busca todas as inscrições de push no Firestore.
        const subscriptionsSnapshot = await db
            .collection("pushSubscriptions")
            .get();
        if (subscriptionsSnapshot.empty) {
            functions.logger.info("Nenhuma inscrição encontrada para notificar.");
            return null;
        }
        // Mapeia e filtra para garantir que apenas inscrições válidas sejam usadas.
        const tokens = subscriptionsSnapshot.docs
            .map((doc) => { var _a; return (_a = doc.data()) === null || _a === void 0 ? void 0 : _a.token; })
            .filter((token) => !!token);
        if (tokens.length === 0) {
            functions.logger.warn("Documentos de inscrição encontrados, mas nenhum continha um 'token' válido.");
            return null;
        }
        functions.logger.info(`Enviando notificação para ${tokens.length} inscritos.`);
        const message = Object.assign(Object.assign({}, notificationPayload), { tokens });
        // Envia a notificação para todos os tokens
        const response = await messaging.sendEachForMulticast(message);
        functions.logger.info(`Notificações enviadas: ${response.successCount} com sucesso, ${response.failureCount} falharam.`);
        // Limpeza de tokens inválidos
        const tokensToDelete = [];
        response.responses.forEach(async (result, index) => {
            const token = tokens[index];
            if (!result.success && result.error) {
                functions.logger.error(`Falha ao enviar para o token: ${token}`, result.error);
                const errorCode = result.error.code;
                if (errorCode === "messaging/invalid-registration-token" ||
                    errorCode === "messaging/registration-token-not-registered") {
                    functions.logger.info(`Agendando remoção do token inválido: ${token}`);
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
        functions.logger.error("Erro ao enviar notificações push:", error);
        return { error: `Falha ao enviar notificações: ${errorMessage}` };
    }
});
//# sourceMappingURL=index.js.map