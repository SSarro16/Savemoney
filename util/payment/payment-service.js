import {
  fetchCards,
  fetchCashWallets,
  removeCard,
  removeCashWallet,
  setDefaultCashWallet,
  upsertCard,
  upsertCashWallet,
} from "../payment-http";

export function loadCards(userId, withAuthRetry) {
  return withAuthRetry((token) => fetchCards(userId, token));
}

export function loadCashWallets(userId, withAuthRetry) {
  return withAuthRetry((token) => fetchCashWallets(userId, token));
}

export function saveCard(userId, withAuthRetry, card) {
  return withAuthRetry((token) => upsertCard(userId, token, card));
}

export function deleteStoredCard(userId, withAuthRetry, cardId) {
  return withAuthRetry((token) => removeCard(userId, token, cardId));
}

export function saveCashWallet(userId, withAuthRetry, wallet) {
  return withAuthRetry((token) => upsertCashWallet(userId, token, wallet));
}

export function deleteStoredCashWallet(userId, withAuthRetry, walletId) {
  return withAuthRetry((token) =>
    removeCashWallet(userId, token, walletId),
  );
}

export function saveDefaultCashWallet(
  userId,
  withAuthRetry,
  walletId,
  wallets,
) {
  return withAuthRetry((token) =>
    setDefaultCashWallet(userId, token, walletId, wallets),
  );
}
