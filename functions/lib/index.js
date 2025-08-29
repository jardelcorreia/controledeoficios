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
const webpush = __importStar(require("web-push"));
// Inicializa o Firebase Admin SDK. Isso deve ser feito apenas uma vez.
admin.initializeApp();
const db = admin.firestore();
// Configura as chaves VAPID a partir das variáveis de ambiente das funções
// Use: firebase functions:config:set vapid.public_key="..." vapid.private_key="..."
const vapidConfig = functions.config().vapid;
if (vapidConfig && vapidConfig.public_key && vapidConfig.private_key) {
    webpush.setVapidDetails("mailto:jardel.lc@gmail.com", vapidConfig.public_key, vapidConfig.private_key);
}
else {
    functions.logger.warn("VAPID keys not configured. Push notifications will be disabled.");
}
/**
 * Função acionada na criação ou atualização de um ofício para enviar notificações.
 */
exports.sendOficioNotification = functions
    .region("southamerica-east1")
    .firestore.document("oficios/{oficioId}")
    .onWrite(async (change, context) => {
    // Se as chaves VAPID não estiverem configuradas, a função não prossegue.
    if (!vapidConfig || !vapidConfig.public_key || !vapidConfig.private_key) {
        functions.logger.error("VAPID keys are not set. Cannot send notification.");
        return null;
    }
    const oficioId = context.params.oficioId;
    const dataAfter = change.after.data();
    const dataBefore = change.before.data();
    let notificationPayload = null;
    // Caso 1: Novo ofício criado.
    if (!change.before.exists && change.after.exists && dataAfter) {
        functions.logger.info(`Novo ofício criado: ${oficioId}`, dataAfter);
        notificationPayload = {
            notification: {
                title: "Novo Ofício Criado!",
                body: `O ofício nº ${dataAfter.numero} foi criado e aguarda envio.`,
                icon: "/icons/icon-192x192.png",
                data: {
                    url: `/oficios/${oficioId}`,
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
                icon: "/icons/icon-192x192.png",
                data: {
                    url: `/oficios/${oficioId}`,
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
        // O SDK Admin ignora as regras de segurança por padrão.
        const subscriptionsSnapshot = await db
            .collection("pushSubscriptions")
            .get();
        if (subscriptionsSnapshot.empty) {
            functions.logger.info("Nenhuma inscrição encontrada para notificar.");
            return null;
        }
        const subscriptions = subscriptionsSnapshot.docs.map((doc) => doc.data().subscription);
        functions.logger.info(`Enviando notificação para ${subscriptions.length} inscritos.`);
        // Prepara todas as promessas de envio de notificação.
        const sendPromises = subscriptions.map((sub) => webpush.sendNotification(sub, JSON.stringify(notificationPayload)));
        // Aguarda o envio de todas as notificações.
        await Promise.all(sendPromises);
        functions.logger.info("Notificações enviadas com sucesso!");
        return { success: true };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        functions.logger.error("Erro ao enviar notificações push:", error);
        // Aqui você pode adicionar lógica para limpar inscrições inválidas se necessário.
        return { error: `Falha ao enviar notificações: ${errorMessage}` };
    }
});
//# sourceMappingURL=index.js.map