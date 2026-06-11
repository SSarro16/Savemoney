export function isAuthError(error) {
  const status = Number(error?.response?.status || error?.status || 0);
  return status === 401 || status === 403;
}

export async function withFirebaseAuthRetry(request, { token, refreshSession } = {}) {
  try {
    return await request(token);
  } catch (error) {
    if (!isAuthError(error)) throw error;

    const refreshed = await refreshSession?.(true).catch(() => null);
    const nextToken = refreshed?.token;
    if (!nextToken) throw error;

    return await request(nextToken);
  }
}
